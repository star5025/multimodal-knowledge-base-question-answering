from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=12)


class CitationResponse(BaseModel):
    document_id: str
    document_name: str
    page: int | None
    chunk_id: str
    text_preview: str
    score: float


class QueryResponse(BaseModel):
    answer: str
    citations: list[CitationResponse]
