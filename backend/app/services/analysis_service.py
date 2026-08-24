from datetime import UTC, date, datetime

import httpx
from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings
from app.models.analysis import Analysis
from app.models.document import DocumentStatus
from app.models.user import User
from app.repositories.analysis_repository import AnalysisRepository
from app.services.document_service import DocumentService


def default_analysis_client(payload: dict) -> dict:
    settings = get_settings()
    if settings.use_mock_ai_service:
        return {
            "model_version": "mock-legal-analyzer-v1",
            "summary": "Mock analysis completed successfully.",
            "risk_summary": {"high": 1, "medium": 1, "low": 0},
            "clauses": [
                {
                    "clause_number": "1",
                    "text": "The supplier must deliver all materials by 2026-09-15.",
                    "risk_results": [{"risk_level": "MEDIUM", "confidence": 0.82, "model_version": "mock-legal-analyzer-v1"}],
                    "entities": [
                        {
                            "entity_type": "DATE",
                            "entity_text": "2026-09-15",
                            "start_position": 43,
                            "end_position": 53,
                        }
                    ],
                    "obligations": [
                        {
                            "description": "Deliver all materials",
                            "obligated_party": "supplier",
                            "due_date": date(2026, 9, 15),
                        }
                    ],
                },
                {
                    "clause_number": "2",
                    "text": "Any breach may result in immediate termination.",
                    "risk_results": [{"risk_level": "HIGH", "confidence": 0.91, "model_version": "mock-legal-analyzer-v1"}],
                    "entities": [],
                    "obligations": [],
                },
            ],
        }

    # DIRECT AI INTEGRATION: Groq LLM Contract Analysis
    from pathlib import Path
    from pypdf import PdfReader
    from app.services.llm_service import get_llm_service

    storage_path = Path(settings.upload_dir) / payload["storage_path"]
    doc_text = ""
    if storage_path.exists():
        if payload.get("file_type") == "application/pdf":
            try:
                reader = PdfReader(str(storage_path))
                doc_text = "\n".join([page.extract_text() or "" for page in reader.pages])
            except Exception:
                with open(storage_path, "r", encoding="utf-8", errors="ignore") as f:
                    doc_text = f.read()
        else:
            with open(storage_path, "r", encoding="utf-8", errors="ignore") as f:
                doc_text = f.read()

    if not doc_text.strip():
        doc_text = f"Contract document ID {payload.get('document_id', '1')} for {payload.get('filename', 'agreement')}"

    analysis_data = get_llm_service().analyze_contract_text(doc_text)

    # Format due_date strings into date objects for SQLAlchemy persistence
    for clause in analysis_data.get("clauses", []):
        for ob in clause.get("obligations", []):
            if ob.get("due_date") and isinstance(ob["due_date"], str):
                try:
                    ob["due_date"] = datetime.strptime(ob["due_date"], "%Y-%m-%d").date()
                except Exception:
                    ob["due_date"] = None

    return analysis_data


class AnalysisService:
    def __init__(self, db: Session, analysis_client=default_analysis_client) -> None:
        self.db = db
        self.settings = get_settings()
        self.analysis_repository = AnalysisRepository(db)
        self.document_service = DocumentService(db)
        self.analysis_client = analysis_client

    def start_analysis(self, document_id: int, user: User, background_tasks: BackgroundTasks) -> Analysis:
        document = self.document_service.get_owned_document(document_id, user)
        if document.file_type not in {
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/png",
            "image/jpeg",
        }:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type for analysis")
        if document.status in {DocumentStatus.PROCESSING, DocumentStatus.ANALYZING, DocumentStatus.COMPLETED}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document cannot be analyzed in current state")

        self.document_service.transition_status(document, DocumentStatus.PROCESSING)
        analysis = self.analysis_repository.get_by_document(document.id)
        if not analysis:
            analysis = self.analysis_repository.create(document.id, DocumentStatus.PROCESSING)
        else:
            analysis.status = DocumentStatus.PROCESSING
            analysis.started_at = datetime.now(UTC)
            analysis.completed_at = None
            self.db.add(analysis)
            self.db.commit()
            self.db.refresh(analysis)

        # This function signature is intentionally task-queue-friendly so Celery/RQ can replace BackgroundTasks later.
        background_tasks.add_task(run_analysis_task, document.id, self.analysis_client, self.settings.database_url)
        return analysis

    def get_status(self, document_id: int, user: User) -> Analysis:
        document = self.document_service.get_owned_document(document_id, user)
        analysis = self.analysis_repository.get_by_document(document.id)
        if not analysis:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
        return analysis

    def get_result(self, document_id: int, user: User) -> Analysis:
        analysis = self.get_status(document_id, user)
        if analysis.status != DocumentStatus.COMPLETED:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis result not available")
        return analysis


def run_analysis_task(document_id: int, analysis_client=default_analysis_client, database_url: str | None = None) -> None:
    settings = get_settings()
    active_database_url = database_url or settings.database_url
    connect_args = {"check_same_thread": False} if active_database_url.startswith("sqlite") else {}
    engine = create_engine(active_database_url, future=True, pool_pre_ping=True, connect_args=connect_args)
    session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    db = session_local()
    try:
        analysis_repo = AnalysisRepository(db)
        document_service = DocumentService(db)
        analysis = analysis_repo.get_by_document(document_id)
        if not analysis:
            return

        document = analysis.document
        document_service.transition_status(document, DocumentStatus.ANALYZING)
        analysis.status = DocumentStatus.ANALYZING
        db.add(analysis)
        db.commit()
        db.refresh(analysis)

        payload = {
            "document_id": document.id,
            "storage_path": document.storage_path,
            "file_type": document.file_type,
            "filename": document.original_filename,
        }
        response = analysis_client(payload)
        analysis_repo.save_results(analysis, response)
    except Exception:
        try:
            analysis = AnalysisRepository(db).get_by_document(document_id)
            if analysis:
                analysis.status = DocumentStatus.FAILED
                analysis.completed_at = datetime.now(UTC)
                analysis.document.status = DocumentStatus.FAILED
                db.add(analysis)
                db.add(analysis.document)
                db.commit()
        except Exception:
            db.rollback()
    finally:
        db.close()
        engine.dispose()
