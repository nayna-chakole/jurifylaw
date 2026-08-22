from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.schemas.chat import ChatReply, MessageCreate, SessionCreate, SessionOut
from app.services.chat_service import ChatService


router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/sessions", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: SessionCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(get_current_user),
):
    session = ChatService(db).create_session(current_user, title=payload.title, document_id=payload.document_id)
    return session


@router.get("/sessions", response_model=list[SessionOut])
def list_sessions(db: Annotated[Session, Depends(get_db)], current_user=Depends(get_current_user)):
    return ChatService(db).list_sessions(current_user)


@router.get("/sessions/{session_id}", response_model=SessionOut)
def get_session(
    session_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(get_current_user),
):
    return ChatService(db).get_session(current_user, session_id)


@router.post("/sessions/{session_id}/messages", response_model=ChatReply, status_code=status.HTTP_201_CREATED)
def post_message(
    session_id: int,
    payload: MessageCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(get_current_user),
):
    user_message, assistant_message = ChatService(db).post_message(session_id, current_user, payload.content)
    return ChatReply(user_message=user_message, assistant_message=assistant_message)
