from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, Request, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.schemas.document import DocumentListResponse, DocumentOut, DocumentUploadResponse
from app.services.audit_service import AuditService
from app.services.document_service import DocumentService
from app.utils.helpers import get_client_ip


router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(get_current_user),
    file: UploadFile = File(...),
):
    document = DocumentService(db).upload_document(current_user, file)
    AuditService(db).log(
        action="document.upload",
        resource_type="document",
        resource_id=str(document.id),
        user=current_user,
        ip_address=get_client_ip(request),
    )
    return DocumentUploadResponse(document_id=document.id, filename=document.original_filename, status=document.status)


@router.get("", response_model=DocumentListResponse)
def list_documents(
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(get_current_user),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
):
    items, total = DocumentService(db).list_documents(current_user, page=page, page_size=page_size)
    return DocumentListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(
    document_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(get_current_user),
):
    return DocumentService(db).get_owned_document(document_id, current_user)


@router.delete("/{document_id}")
def delete_document(
    request: Request,
    document_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(get_current_user),
):
    service = DocumentService(db)
    document = service.get_owned_document(document_id, current_user)
    service.delete_document(document)
    AuditService(db).log(
        action="document.delete",
        resource_type="document",
        resource_id=str(document_id),
        user=current_user,
        ip_address=get_client_ip(request),
    )
    return {"message": "Document deleted"}


@router.get("/{document_id}/download")
def download_document(
    request: Request,
    document_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(get_current_user),
):
    service = DocumentService(db)
    document = service.get_owned_document(document_id, current_user)
    file_path, content_type = service.get_download_path(document)
    AuditService(db).log(
        action="document.download",
        resource_type="document",
        resource_id=str(document_id),
        user=current_user,
        ip_address=get_client_ip(request),
    )
    return FileResponse(path=file_path, media_type=content_type, filename=document.original_filename)
