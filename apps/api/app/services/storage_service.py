import re
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import get_settings


ALLOWED_EXTENSIONS = {".txt", ".pdf", ".png", ".jpg", ".jpeg"}


def get_file_type(filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix == ".txt":
        return "text"
    if suffix == ".pdf":
        return "pdf"
    if suffix in {".png", ".jpg", ".jpeg"}:
        return "image"
    return "unsupported"


def validate_filename(filename: str) -> None:
    if Path(filename).suffix.lower() not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise ValueError(f"Unsupported file format. Allowed formats: {allowed}")


def sanitize_filename(filename: str) -> str:
    name = Path(filename).name
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", name).strip("._")
    return name or "document"


async def save_upload_file(upload: UploadFile, owner_id: str) -> tuple[str, int]:
    settings = get_settings()
    validate_filename(upload.filename or "")
    safe_name = sanitize_filename(upload.filename or "document")
    stored_filename = f"{owner_id}_{uuid4().hex}_{safe_name}"
    destination = settings.uploads_dir / stored_filename
    size = 0
    with destination.open("wb") as out:
        while True:
            chunk = await upload.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            out.write(chunk)
    await upload.seek(0)
    return stored_filename, size


def document_path(stored_filename: str) -> Path:
    return get_settings().uploads_dir / stored_filename


def extracted_text_path(document_id: str) -> Path:
    return get_settings().extracted_dir / f"{document_id}.txt"


def save_extracted_text(document_id: str, text: str) -> Path:
    path = extracted_text_path(document_id)
    path.write_text(text, encoding="utf-8")
    return path


def delete_extracted_text(document_id: str) -> None:
    path = extracted_text_path(document_id)
    if path.exists():
        path.unlink()


def delete_stored_file(stored_filename: str) -> None:
    path = document_path(stored_filename)
    if path.exists():
        path.unlink()
