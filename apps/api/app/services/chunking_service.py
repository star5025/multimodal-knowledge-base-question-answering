from dataclasses import dataclass

from app.services.document_processor import ExtractedPage


@dataclass(frozen=True)
class TextChunk:
    document_id: str
    document_name: str
    chunk_index: int
    page: int | None
    text: str


def chunk_pages(
    *,
    document_id: str,
    document_name: str,
    pages: list[ExtractedPage],
    chunk_size: int = 900,
    overlap: int = 150,
) -> list[TextChunk]:
    chunk_size = max(200, chunk_size)
    overlap = max(0, min(overlap, chunk_size // 2))
    chunks: list[TextChunk] = []

    for page in pages:
        text = page.text.strip()
        if not text:
            continue
        start = 0
        while start < len(text):
            end = min(len(text), start + chunk_size)
            if end < len(text):
                boundary = max(text.rfind("\n", start, end), text.rfind(". ", start, end), text.rfind(" ", start, end))
                if boundary > start + chunk_size * 0.55:
                    end = boundary + 1
            chunk_text = text[start:end].strip()
            if chunk_text:
                chunks.append(
                    TextChunk(
                        document_id=document_id,
                        document_name=document_name,
                        chunk_index=len(chunks),
                        page=page.page,
                        text=chunk_text,
                    )
                )
            if end >= len(text):
                break
            start = max(0, end - overlap)

    return chunks

