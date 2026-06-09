from datetime import datetime, timezone

from sqlmodel import Session

from app.core.config import get_settings
from app.db.models import Document, User
from app.services.chunking_service import chunk_pages
from app.services.document_processor import ProcessingError, process_document
from app.services.storage_service import delete_extracted_text, document_path, save_extracted_text
from app.services.vector_service import delete_document_chunks, index_document


def touch_document(document: Document) -> None:
    document.updated_at = datetime.now(timezone.utc)


def process_and_index_document(session: Session, user: User, document: Document) -> Document:
    settings = get_settings()
    document.status = "processing"
    document.error_message = None
    touch_document(document)
    session.add(document)
    session.commit()
    session.refresh(document)

    try:
        processed = process_document(document_path(document.stored_filename), document.filename)
        chunks = chunk_pages(
            document_id=document.id,
            document_name=document.filename,
            pages=processed.pages,
            chunk_size=settings.chunk_size,
            overlap=settings.chunk_overlap,
        )
        if not chunks:
            raise ProcessingError("No usable text chunks were produced.")
        save_extracted_text(document.id, processed.text)
        index_document(session, user, document, chunks)
        document.status = "indexed"
        document.error_message = None
    except Exception as exc:
        delete_document_chunks(session, document.id)
        delete_extracted_text(document.id)
        document.status = "failed"
        document.error_message = str(exc)

    touch_document(document)
    session.add(document)
    session.commit()
    session.refresh(document)
    return document
