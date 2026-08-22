import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.models.chat import ChatMessage, ChatSession
from app.models.user import User
from app.services.document_service import DocumentService


def default_rag_client(payload: dict) -> dict:
    settings = get_settings()
    if settings.use_mock_rag_service:
        return {
            "reply": "Mock RAG response based on the current session context.",
            "sources": [{"title": "Mock Source", "snippet": "Relevant legal clause excerpt."}],
        }

    # DIRECT RAG PIPELINE (Azure AI Foundry Embeddings + Groq LLM)
    from app.services.chroma_service import query_document_chunks
    from app.services.llm_service import get_llm_service

    query = payload.get("query", "")
    history = payload.get("history", [])
    doc_id = payload.get("document_id")

    # 1. Retrieve top relevant clauses using Azure AI Foundry cosine embedding search
    retrieved_context = query_document_chunks(document_id=doc_id, query_text=query, n_results=4)

    # 2. Synthesize accurate legal response using Groq LLM
    reply_text = get_llm_service().generate_rag_answer(query, retrieved_context, history)

    return {
        "reply": reply_text,
        "sources": retrieved_context,
    }


class ChatService:
    def __init__(self, db: Session, rag_client=default_rag_client) -> None:
        self.db = db
        self.rag_client = rag_client
        self.document_service = DocumentService(db)

    def create_session(self, user: User, *, title: str, document_id: int | None = None) -> ChatSession:
        if document_id is not None:
            self.document_service.get_owned_document(document_id, user)
        session = ChatSession(user_id=user.id, document_id=document_id, title=title)
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def list_sessions(self, user: User) -> list[ChatSession]:
        stmt = (
            select(ChatSession)
            .where(ChatSession.user_id == user.id)
            .options(selectinload(ChatSession.messages))
            .order_by(ChatSession.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def get_session(self, user: User, session_id: int) -> ChatSession:
        stmt = (
            select(ChatSession)
            .where(ChatSession.id == session_id)
            .options(selectinload(ChatSession.messages))
        )
        session = self.db.scalar(stmt)
        if not session or session.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
        return session

    def post_message(self, session_id: int, user: User, content: str) -> tuple[ChatMessage, ChatMessage]:
        session = self.get_session(user, session_id)
        user_message = ChatMessage(session_id=session.id, role="user", content=content, sources=None)
        self.db.add(user_message)
        self.db.commit()
        self.db.refresh(user_message)

        refreshed_session = self.get_session(user, session_id)
        history = [{"role": message.role, "content": message.content} for message in refreshed_session.messages]
        # This client function is injectable so a queue worker can reuse the same task signature later.
        response = self.rag_client(
            {
                "query": content,
                "document_id": refreshed_session.document_id,
                "session_id": refreshed_session.id,
                "history": history,
            }
        )
        assistant_message = ChatMessage(
            session_id=refreshed_session.id,
            role="assistant",
            content=response["reply"],
            sources=response.get("sources"),
        )
        self.db.add(assistant_message)
        self.db.commit()
        self.db.refresh(assistant_message)
        return user_message, assistant_message
