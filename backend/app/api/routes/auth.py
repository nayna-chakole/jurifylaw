from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.schemas.user import Token, UserCreate, UserLogin, UserOut
from app.services.audit_service import AuditService
from app.services.auth_service import AuthService
from app.utils.helpers import get_client_ip


router = APIRouter(prefix="/api/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, payload: UserCreate, db: Annotated[Session, Depends(get_db)]):
    user = AuthService(db).register(payload)
    AuditService(db).log(
        action="auth.register",
        resource_type="user",
        resource_id=str(user.id),
        user=user,
        ip_address=get_client_ip(request),
    )
    return user


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(request: Request, payload: UserLogin, db: Annotated[Session, Depends(get_db)]):
    service = AuthService(db)
    user = service.authenticate(payload.email, payload.password)
    AuditService(db).log(
        action="auth.login",
        resource_type="user",
        resource_id=str(user.id),
        user=user,
        ip_address=get_client_ip(request),
    )
    return Token(access_token=service.issue_token(user.id))


@router.get("/me", response_model=UserOut)
def me(current_user=Depends(get_current_user)):
    return current_user


@router.post("/logout")
def logout(request: Request, db: Annotated[Session, Depends(get_db)], current_user=Depends(get_current_user)):
    AuditService(db).log(
        action="auth.logout",
        resource_type="user",
        resource_id=str(current_user.id),
        user=current_user,
        ip_address=get_client_ip(request),
    )
    return {"message": "Logout is handled client-side by discarding the JWT token."}
