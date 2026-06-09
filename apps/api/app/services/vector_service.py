import json
import re
from dataclasses import dataclass
from typing import Iterable

from sqlmodel import Session, delete, select

from app.core.config import get_settings
from app.db.models import Document, DocumentChunk, User
from app.services.chunking_service import TextChunk


_TOKEN_PATTERN = re.compile(r"[A-Za-z0-9_]+")
_EMBEDDER = None


@dataclass(frozen=True)
class RetrievalHit:
    chunk_id: str
    document_id: str
    document_name: str
    page: int | None
    text: str
    score: float


def _tokens(text: str) -> list[str]:
    return [token.lower() for token in _TOKEN_PATTERN.findall(text)]


def _lexical_score(query: str, text: str) -> float:
    query_terms = set(_tokens(query))
    if not query_terms:
        return 0.0
    text_terms = _tokens(text)
    if not text_terms:
        return 0.0
    text_set = set(text_terms)
    overlap = len(query_terms & text_set) / len(query_terms)
    phrase_bonus = 0.25 if query.lower() in text.lower() else 0.0
    density = min(0.2, sum(1 for term in text_terms if term in query_terms) / max(len(text_terms), 1))
    return min(1.0, overlap + phrase_bonus + density)


def _load_embedder():
    global _EMBEDDER
    if _EMBEDDER is not None:
        return _EMBEDDER
    try:
        from sentence_transformers import SentenceTransformer

        _EMBEDDER = SentenceTransformer(get_settings().embedding_model)
    except Exception:
        _EMBEDDER = False
    return _EMBEDDER


def _try_faiss_search(chunks: list[DocumentChunk], question: str, top_k: int) -> list[RetrievalHit] | None:
    embedder = _load_embedder()
    if not embedder or not chunks:
        return None
    try:
        import faiss

        texts = [chunk.text for chunk in chunks]
        embeddings = embedder.encode(texts, convert_to_numpy=True, normalize_embeddings=True).astype("float32")
        query_embedding = embedder.encode([question], convert_to_numpy=True, normalize_embeddings=True).astype("float32")
        index = faiss.IndexFlatIP(int(embeddings.shape[1]))
        index.add(embeddings)
        scores, positions = index.search(query_embedding, min(top_k, len(chunks)))
        hits: list[RetrievalHit] = []
        for score, position in zip(scores[0], positions[0]):
            if int(position) < 0:
                continue
            chunk = chunks[int(position)]
            hits.append(
                RetrievalHit(
                    chunk_id=chunk.id,
                    document_id=chunk.document_id,
                    document_name=chunk.document_name,
                    page=chunk.page,
                    text=chunk.text,
                    score=round(float(score), 4),
                )
            )
        return hits
    except Exception:
        return None


def _try_bm25_search(chunks: list[DocumentChunk], question: str, top_k: int) -> list[RetrievalHit] | None:
    query_tokens = _tokens(question)
    tokenized_chunks = [_tokens(chunk.text) for chunk in chunks]
    if not query_tokens or not any(tokenized_chunks):
        return None

    try:
        from rank_bm25 import BM25Okapi

        bm25 = BM25Okapi(tokenized_chunks)
        raw_scores = bm25.get_scores(query_tokens)
    except Exception:
        return None

    max_score = max((float(score) for score in raw_scores), default=0.0)
    if max_score <= 0:
        return None

    ranked = []
    for chunk, raw_score in zip(chunks, raw_scores):
        bm25_score = max(0.0, float(raw_score)) / max_score
        lexical_score = _lexical_score(question, chunk.text)
        score = min(1.0, bm25_score * 0.85 + lexical_score * 0.15)
        ranked.append(
            RetrievalHit(
                chunk_id=chunk.id,
                document_id=chunk.document_id,
                document_name=chunk.document_name,
                page=chunk.page,
                text=chunk.text,
                score=round(score, 4),
            )
        )
    ranked.sort(key=lambda hit: (hit.score, -len(hit.text)), reverse=True)
    return ranked[:top_k]


def _persist_index_manifest(owner_id: str, chunks: Iterable[DocumentChunk]) -> None:
    settings = get_settings()
    manifest = settings.indexes_dir / f"{owner_id}_chunks.jsonl"
    with manifest.open("w", encoding="utf-8") as out:
        for chunk in chunks:
            out.write(
                json.dumps(
                    {
                        "chunk_id": chunk.id,
                        "document_id": chunk.document_id,
                        "document_name": chunk.document_name,
                        "page": chunk.page,
                        "chunk_index": chunk.chunk_index,
                    },
                    ensure_ascii=True,
                )
                + "\n"
            )


def delete_document_chunks(session: Session, document_id: str) -> None:
    session.exec(delete(DocumentChunk).where(DocumentChunk.document_id == document_id))
    session.commit()


def index_document(session: Session, user: User, document: Document, chunks: list[TextChunk]) -> list[DocumentChunk]:
    delete_document_chunks(session, document.id)
    records = [
        DocumentChunk(
            owner_id=user.id,
            document_id=document.id,
            document_name=document.filename,
            chunk_index=chunk.chunk_index,
            page=chunk.page,
            text=chunk.text,
        )
        for chunk in chunks
    ]
    for record in records:
        session.add(record)
    session.commit()
    for record in records:
        session.refresh(record)
    all_chunks = session.exec(select(DocumentChunk).where(DocumentChunk.owner_id == user.id)).all()
    _persist_index_manifest(user.id, all_chunks)
    return records


def retrieve(session: Session, user: User, question: str, top_k: int = 5) -> list[RetrievalHit]:
    top_k = max(1, min(top_k, 12))
    chunks = session.exec(select(DocumentChunk).where(DocumentChunk.owner_id == user.id)).all()
    if not chunks:
        return []

    faiss_hits = _try_faiss_search(chunks, question, top_k)
    if faiss_hits is not None:
        return faiss_hits

    bm25_hits = _try_bm25_search(chunks, question, top_k)
    if bm25_hits is not None:
        return bm25_hits

    ranked = [
        RetrievalHit(
            chunk_id=chunk.id,
            document_id=chunk.document_id,
            document_name=chunk.document_name,
            page=chunk.page,
            text=chunk.text,
            score=round(_lexical_score(question, chunk.text), 4),
        )
        for chunk in chunks
    ]
    ranked.sort(key=lambda hit: (hit.score, -len(hit.text)), reverse=True)
    return ranked[:top_k]
