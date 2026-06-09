from sqlmodel import Session

from app.db.models import User
from app.services.llm_service import generate_llm_answer
from app.services.vector_service import RetrievalHit, retrieve


def _preview(text: str, limit: int = 260) -> str:
    compact = " ".join(text.split())
    if len(compact) <= limit:
        return compact
    return compact[: limit - 3].rstrip() + "..."


def citations_from_hits(hits: list[RetrievalHit]) -> list[dict]:
    return [
        {
            "document_id": hit.document_id,
            "document_name": hit.document_name,
            "page": hit.page,
            "chunk_id": hit.chunk_id,
            "text_preview": _preview(hit.text),
            "score": hit.score,
        }
        for hit in hits
    ]


def fallback_answer(question: str, hits: list[RetrievalHit], llm_error: str | None = None) -> str:
    if not hits:
        if llm_error:
            return (
                "External LLM was not available, and no indexed document content was found.\n"
                f"LLM error: {llm_error}\n"
                "Upload and index at least one document before asking questions."
            )
        return "No indexed document content was found. Upload and index at least one document before asking questions."
    best = hits[:3]
    lines = [
        "No external LLM answer was generated, so this response is based on the most relevant local passages.",
        f"LLM error: {llm_error}" if llm_error else "",
        f"Question: {question}",
        "",
    ]
    for index, hit in enumerate(best, start=1):
        page = f", page {hit.page}" if hit.page else ""
        lines.append(f"[{index}] {hit.document_name}{page}: {_preview(hit.text, 420)}")
    return "\n".join(lines)


async def answer_question(session: Session, user: User, question: str, top_k: int = 5) -> dict:
    hits = retrieve(session, user, question, top_k)
    answer, llm_error = await generate_llm_answer(question, hits)
    if not answer:
        answer = fallback_answer(question, hits, llm_error)
    return {"answer": answer, "citations": citations_from_hits(hits)}
