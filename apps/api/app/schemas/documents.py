from datetime import datetime

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: str
    filename: str
    content_type: str | None
    file_type: str
    size_bytes: int
    status: str
    error_message: str | None
    created_at: datetime
    updated_at: datetime
