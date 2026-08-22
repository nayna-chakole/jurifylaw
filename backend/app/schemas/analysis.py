from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.document import DocumentStatus
from app.schemas.document import DocumentOut


class RiskResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    risk_level: str
    confidence: float
    model_version: str | None = None


class EntityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entity_type: str
    entity_text: str
    start_position: int
    end_position: int


class ObligationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    description: str
    obligated_party: str
    due_date: date | None = None


class ClauseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    clause_number: str
    text: str
    risk_results: list[RiskResultOut]
    entities: list[EntityOut]
    obligations: list[ObligationOut]


class AnalysisStatus(BaseModel):
    document_id: int
    status: DocumentStatus
    started_at: datetime | None = None
    completed_at: datetime | None = None


class AnalysisResult(BaseModel):
    document: DocumentOut
    status: DocumentStatus
    model_version: str | None = None
    summary: str | None = None
    risk_summary: dict | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    clauses: list[ClauseOut]
