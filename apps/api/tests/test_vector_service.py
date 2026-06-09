from app.db.models import DocumentChunk
from app.services.vector_service import _try_bm25_search


def _chunk(text: str, index: int) -> DocumentChunk:
    return DocumentChunk(
        owner_id="user-1",
        document_id=f"doc-{index}",
        document_name=f"doc-{index}.txt",
        chunk_index=index,
        page=1,
        text=text,
    )


def test_bm25_ranks_specific_evidence_above_repeated_terms():
    chunks = [
        _chunk("Files files files files appear many times but no storage location is described.", 1),
        _chunk("Original files are stored in the local data uploads directory for privacy.", 2),
        _chunk("The chat interface displays citations after retrieval.", 3),
    ]

    hits = _try_bm25_search(chunks, "Where are original files stored?", top_k=2)

    assert hits is not None
    assert hits[0].document_name == "doc-2.txt"
    assert hits[0].score > hits[1].score
