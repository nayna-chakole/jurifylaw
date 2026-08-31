"""Chat and RAG routes connecting backend gateway to ai_service."""

import time
from typing import Any, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.database import get_db
from app.models.user import User
from app.repositories.analysis_repository import AnalysisRepository
from app.services.document_service import DocumentService

router = APIRouter(prefix="/api/chat", tags=["chat"])
settings = get_settings()


class ChatAskRequest(BaseModel):
    query: str = Field(..., min_length=1, description="The user's legal or general question.")
    document_id: Optional[int] = Field(None, description="Optional document ID for contextual legal QA.")


class ChatAskResponse(BaseModel):
    answer: str
    sources: list[str] = Field(default_factory=list)
    mode: str = "general"
    elapsed_seconds: float = 0.0
    document_id: Optional[int] = None


@router.post("/ask", response_model=ChatAskResponse)
async def ask_legal_assistant(
    req: ChatAskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChatAskResponse:
    """Answer legal queries via the RAG pipeline in ai_service, with optional document contextual grounding."""
    start_time = time.monotonic()
    document_context = ""

    # If contextual document query is requested, verify user access and extract context
    if req.document_id is not None:
        doc_service = DocumentService(db)
        try:
            document = doc_service.get_owned_document(req.document_id, current_user)
            analysis = AnalysisRepository(db).get_by_document(document.id)

            context_snippets = [f"Document Name: {document.original_filename}"]
            if analysis:
                if analysis.summary:
                    context_snippets.append(f"Summary: {analysis.summary}")
                if analysis.clauses:
                    clause_texts = [f"Clause {c.clause_number}: {c.text}" for c in analysis.clauses[:8]]
                    context_snippets.append("Key Clauses:\n" + "\n".join(clause_texts))
            document_context = "\n\n".join(context_snippets)
        except HTTPException:
            raise
        except Exception as e:
            # Fallback gracefully if document loading fails
            document_context = ""

    # Construct query with optional document context for the AI service
    ai_payload: dict[str, Any] = {"query": req.query}
    if document_context:
        ai_payload["query"] = (
            f"[CONTEXT FROM UPLOADED DOCUMENT]\n{document_context}\n\n"
            f"[USER QUESTION]\n{req.query}"
        )
        ai_payload["document_context"] = document_context

    ai_url = f"{settings.ai_service_url.rstrip('/')}/answer"

    try:
        async with httpx.AsyncClient(timeout=float(settings.request_timeout_seconds)) as client:
            resp = await client.post(ai_url, json=ai_payload)

            if resp.status_code == 200:
                data = resp.json()
                elapsed = time.monotonic() - start_time
                return ChatAskResponse(
                    answer=data.get("answer", ""),
                    sources=data.get("sources", []),
                    mode=data.get("mode", "rag"),
                    elapsed_seconds=round(data.get("elapsed_seconds", elapsed), 2),
                    document_id=req.document_id,
                )
            else:
                # If AI service returns an error status code, handle gracefully
                error_detail = resp.text
                try:
                    error_detail = resp.json().get("detail", error_detail)
                except Exception:
                    pass
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"AI Service error ({resp.status_code}): {error_detail}",
                )
    except httpx.RequestError as exc:
        # If AI service is offline or in local development mode with USE_MOCK_AI_SERVICE=True, provide mock response
        if settings.use_mock_ai_service:
            elapsed = time.monotonic() - start_time
            mock_sources = ["Indian Contract Act 1872", "The Code on Wages 2020"]
            doc_note = f" analyzing Document #{req.document_id}" if req.document_id else ""
            return ChatAskResponse(
                answer=(
                    f"**JurifyLaw Legal Assistant (Dev Fallback)**{doc_note}\n\n"
                    f"Regarding your query: *\"{req.query}\"*\n\n"
                    "Under applicable Indian Legal provisions, contract terms regarding termination, notice periods, "
                    "and indemnity must adhere strictly to reasonable timelines and mutual consideration. "
                    "Clauses imposing unilateral penalties without cure periods may be held unenforceable under Section 74 "
                    "of the Indian Contract Act."
                ),
                sources=mock_sources,
                mode="rag",
                elapsed_seconds=round(elapsed, 2),
                document_id=req.document_id,
            )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI Service unreachable at {settings.ai_service_url}: {exc}",
        )
