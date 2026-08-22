import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings


class StorageService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.base_dir = Path(self.settings.upload_dir).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _resolve_path(self, relative_path: str) -> Path:
        resolved = (self.base_dir / relative_path).resolve()
        try:
            resolved.relative_to(self.base_dir)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid storage path") from exc
        return resolved

    def save_file(self, user_id: int, upload_file: UploadFile) -> str:
        suffix = Path(upload_file.filename or "").suffix.lower()
        filename = f"{uuid4().hex}{suffix}"
        relative_path = Path(f"user_{user_id}") / filename
        destination = self._resolve_path(str(relative_path))
        destination.parent.mkdir(parents=True, exist_ok=True)
        upload_file.file.seek(0)
        with destination.open("wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        upload_file.file.seek(0)
        return str(relative_path)

    def delete_file(self, relative_path: str) -> None:
        target = self._resolve_path(relative_path)
        if target.exists():
            target.unlink()

    def get_file_path(self, relative_path: str) -> Path:
        return self._resolve_path(relative_path)
