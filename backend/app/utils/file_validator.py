from io import BytesIO
from pathlib import Path
from zipfile import BadZipFile, ZipFile

from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings


ALLOWED_EXTENSIONS = {".pdf", ".docx", ".png", ".jpg", ".jpeg"}
MIME_BY_EXTENSION = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}


def _sniff_mime(upload_file: UploadFile) -> str:
    upload_file.file.seek(0)
    file_bytes = upload_file.file.read()
    upload_file.file.seek(0)
    head = file_bytes[:8192]

    if head.startswith(b"%PDF"):
        return MIME_BY_EXTENSION[".pdf"]
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return MIME_BY_EXTENSION[".png"]
    if head[:3] == b"\xff\xd8\xff":
        return MIME_BY_EXTENSION[".jpg"]
    try:
        with ZipFile(BytesIO(file_bytes)) as archive:
            names = archive.namelist()
            if "[Content_Types].xml" in names and any(name.startswith("word/") for name in names):
                return MIME_BY_EXTENSION[".docx"]
    except BadZipFile:
        pass
    finally:
        upload_file.file.seek(0)
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported or invalid file content")


def validate_upload_file(upload_file: UploadFile) -> tuple[str, int]:
    settings = get_settings()
    suffix = Path(upload_file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file extension")

    upload_file.file.seek(0, 2)
    size = upload_file.file.tell()
    upload_file.file.seek(0)
    if size > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File exceeds maximum size")

    mime_type = _sniff_mime(upload_file)
    expected_mime = MIME_BY_EXTENSION[suffix]
    if mime_type != expected_mime and not (suffix in {".jpg", ".jpeg"} and mime_type == "image/jpeg"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File type does not match extension")
    return mime_type, size
