from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.analysis import Analysis
from app.models.clause import Clause, Entity, Obligation, RiskResult
from app.models.document import Document, DocumentStatus


class AnalysisRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, document_id: int, status: DocumentStatus) -> Analysis:
        analysis = Analysis(document_id=document_id, status=status)
        self.db.add(analysis)
        self.db.commit()
        self.db.refresh(analysis)
        return analysis

    def get_by_document(self, document_id: int) -> Analysis | None:
        stmt = (
            select(Analysis)
            .where(Analysis.document_id == document_id)
            .options(
                selectinload(Analysis.document)
                .selectinload(Document.clauses)
                .selectinload(Clause.risk_results),
                selectinload(Analysis.document)
                .selectinload(Document.clauses)
                .selectinload(Clause.entities),
                selectinload(Analysis.document)
                .selectinload(Document.clauses)
                .selectinload(Clause.obligations),
            )
        )
        return self.db.scalar(stmt)

    def save_results(self, analysis: Analysis, payload: dict) -> Analysis:
        document = analysis.document
        analysis.model_version = payload.get("model_version")
        analysis.summary = payload.get("summary")
        analysis.risk_summary = payload.get("risk_summary")
        analysis.status = DocumentStatus.COMPLETED
        analysis.completed_at = datetime.now(UTC)
        document.status = DocumentStatus.COMPLETED

        for existing_clause in list(document.clauses):
            self.db.delete(existing_clause)
        self.db.flush()

        for clause_data in payload.get("clauses", []):
            clause = Clause(
                document_id=document.id,
                clause_number=str(clause_data["clause_number"]),
                text=clause_data["text"],
            )
            self.db.add(clause)
            self.db.flush()

            for risk_data in clause_data.get("risk_results", []):
                self.db.add(
                    RiskResult(
                        clause_id=clause.id,
                        risk_level=risk_data["risk_level"],
                        confidence=float(risk_data["confidence"]),
                        model_version=risk_data.get("model_version"),
                    )
                )

            for entity_data in clause_data.get("entities", []):
                self.db.add(
                    Entity(
                        clause_id=clause.id,
                        entity_type=entity_data["entity_type"],
                        entity_text=entity_data["entity_text"],
                        start_position=int(entity_data["start_position"]),
                        end_position=int(entity_data["end_position"]),
                    )
                )

            for obligation_data in clause_data.get("obligations", []):
                self.db.add(
                    Obligation(
                        clause_id=clause.id,
                        description=obligation_data["description"],
                        obligated_party=obligation_data["obligated_party"],
                        due_date=obligation_data.get("due_date"),
                    )
                )

        self.db.add_all([analysis, document])
        self.db.commit()
        self.db.refresh(analysis)
        return analysis
