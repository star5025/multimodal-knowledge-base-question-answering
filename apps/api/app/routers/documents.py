from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlmodel import Session, select

from app.core.security import get_current_user
from app.db.models import Document, User
from app.db.session import get_session
from app.schemas.documents import DocumentResponse
from app.services.document_ingestion_service import process_and_index_document, touch_document
from app.services.storage_service import (
    delete_extracted_text,
    delete_stored_file,
    document_path,
    get_file_type,
    save_upload_file,
    validate_filename,
)
from app.services.vector_service import delete_document_chunks


router = APIRouter(prefix="/documents", tags=["documents"])


def load_owned_document(session: Session, user: User, document_id: str) -> Document:
    document = session.get(Document, document_id)
    if not document or document.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return document


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Document:
    try:
        validate_filename(file.filename or "")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    stored_filename, size = await save_upload_file(file, user.id)
    document = Document(
        owner_id=user.id,
        filename=file.filename or stored_filename,
        stored_filename=stored_filename,
        content_type=file.content_type,
        file_type=get_file_type(file.filename or stored_filename),
        size_bytes=size,
        status="uploaded",
    )
    session.add(document)
    session.commit()
    session.refresh(document)
    return process_and_index_document(session, user, document)


@router.get("", response_model=list[DocumentResponse])
def list_documents(user: User = Depends(get_current_user), session: Session = Depends(get_session)) -> list[Document]:
    statement = select(Document).where(Document.owner_id == user.id).order_by(Document.created_at.desc())
    return session.exec(statement).all()


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str, user: User = Depends(get_current_user), session: Session = Depends(get_session)) -> Document:
    return load_owned_document(session, user, document_id)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: str, user: User = Depends(get_current_user), session: Session = Depends(get_session)) -> None:
    document = load_owned_document(session, user, document_id)
    delete_document_chunks(session, document.id)
    delete_extracted_text(document.id)
    delete_stored_file(document.stored_filename)
    session.delete(document)
    session.commit()


@router.post("/{document_id}/reprocess", response_model=DocumentResponse)
def reprocess_document(document_id: str, user: User = Depends(get_current_user), session: Session = Depends(get_session)) -> Document:
    document = load_owned_document(session, user, document_id)
    if not document_path(document.stored_filename).exists():
        delete_extracted_text(document.id)
        document.status = "failed"
        document.error_message = "Original file is missing from local storage."
        touch_document(document)
        session.add(document)
        session.commit()
        session.refresh(document)
        return document
    return process_and_index_document(session, user, document)
