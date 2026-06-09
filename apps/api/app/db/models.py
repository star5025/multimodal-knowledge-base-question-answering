from datetime import datetime, timezone
from uuid import uuid4

from sqlmodel import Field, SQLModel


def new_id() -> str:
    return uuid4().hex


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=utc_now)


class Document(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    owner_id: str = Field(index=True, foreign_key="user.id")
    filename: str
    stored_filename: str
    content_type: str | None = None
    file_type: str
    size_bytes: int
    status: str = Field(default="uploaded", index=True)
    error_message: str | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class DocumentChunk(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    owner_id: str = Field(index=True, foreign_key="user.id")
    document_id: str = Field(index=True, foreign_key="document.id")
    document_name: str
    chunk_index: int
    page: int | None = None
    text: str
    created_at: datetime = Field(default_factory=utc_now)

