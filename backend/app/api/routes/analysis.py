from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.schemas.analysis import AnalysisResult, AnalysisStatus
from app.services.analysis_service import AnalysisService


router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.post("/{document_id}/start", response_model=AnalysisStatus, status_code=status.HTTP_202_ACCEPTED)
def start_analysis(
    document_id: int,
    background_tasks: BackgroundTasks,
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(get_current_user),
):
    analysis = AnalysisService(db).start_analysis(document_id, current_user, background_tasks)
    return AnalysisStatus(
        document_id=document_id,
        status=analysis.status,
        started_at=analysis.started_at,
        completed_at=analysis.completed_at,
    )


@router.get("/{document_id}/status", response_model=AnalysisStatus)
def get_analysis_status(
    document_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(get_current_user),
):
    analysis = AnalysisService(db).get_status(document_id, current_user)
    return AnalysisStatus(
        document_id=document_id,
        status=analysis.status,
        started_at=analysis.started_at,
        completed_at=analysis.completed_at,
    )


@router.get("/{document_id}/result", response_model=AnalysisResult)
def get_analysis_result(
    document_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(get_current_user),
):
    analysis = AnalysisService(db).get_result(document_id, current_user)
    return AnalysisResult(
        document=analysis.document,
        status=analysis.status,
        model_version=analysis.model_version,
        summary=analysis.summary,
        risk_summary=analysis.risk_summary,
        started_at=analysis.started_at,
        completed_at=analysis.completed_at,
        clauses=analysis.document.clauses,
    )
