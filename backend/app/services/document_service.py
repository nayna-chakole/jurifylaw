import mimetypes
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.document import Document, DocumentStatus
from app.models.user import User
from app.repositories.document_repository import DocumentRepository
from app.schemas.document import DocumentCreate
from app.services.storage_service import StorageService
from app.utils.file_validator import validate_upload_file


class DocumentService:
    ALLOWED_TRANSITIONS = {
        DocumentStatus.UPLOADED: {DocumentStatus.PROCESSING, DocumentStatus.FAILED},
        DocumentStatus.PROCESSING: {DocumentStatus.ANALYZING, DocumentStatus.FAILED},
        DocumentStatus.ANALYZING: {DocumentStatus.COMPLETED, DocumentStatus.FAILED},
        DocumentStatus.COMPLETED: set(),
        DocumentStatus.FAILED: set(),
    }

    def __init__(self, db: Session) -> None:
        self.db = db
        self.documents = DocumentRepository(db)
        self.storage = StorageService()

    def upload_document(self, user: User, upload_file: UploadFile) -> Document:
        mime_type, file_size = validate_upload_file(upload_file)
        storage_path = self.storage.save_file(user.id, upload_file)
        try:
            payload = DocumentCreate(
                original_filename=upload_file.filename or Path(storage_path).name,
                storage_path=storage_path,
                file_type=mime_type,
                file_size=file_size,
            )
            document = Document(
                user_id=user.id,
                original_filename=payload.original_filename,
                storage_path=payload.storage_path,
                file_type=payload.file_type,
                file_size=payload.file_size,
                status=DocumentStatus.UPLOADED,
            )
            return self.documents.create(document)
        except Exception:
            self.storage.delete_file(storage_path)
            raise

    def list_documents(self, user: User, *, page: int, page_size: int) -> tuple[list[Document], int]:
        return self.documents.get_by_user(user.id, page=page, page_size=page_size)

    def get_owned_document(self, document_id: int, user: User) -> Document:
        document = self.documents.get_by_id(document_id)
        if not document or document.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        return document

    def delete_document(self, document: Document) -> None:
        self.storage.delete_file(document.storage_path)
        self.documents.delete(document)

    def get_download_path(self, document: Document) -> tuple[Path, str]:
        file_path = self.storage.get_file_path(document.storage_path)
        if not file_path.exists():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stored file not found")
        content_type = document.file_type or mimetypes.guess_type(document.original_filename)[0] or "application/octet-stream"
        return file_path, content_type

    def transition_status(self, document: Document, next_status: DocumentStatus) -> Document:
        if next_status == DocumentStatus.FAILED and document.status in {DocumentStatus.PROCESSING, DocumentStatus.ANALYZING, DocumentStatus.UPLOADED}:
            return self.documents.update_status(document, next_status)
        allowed = self.ALLOWED_TRANSITIONS.get(document.status, set())
        if next_status not in allowed:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document status transition")
        return self.documents.update_status(document, next_status)
