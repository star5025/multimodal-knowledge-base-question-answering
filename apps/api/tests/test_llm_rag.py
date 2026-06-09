from types import SimpleNamespace

import pytest

from app.services import llm_service
from app.services.rag_service import citations_from_hits, fallback_answer
from app.services.vector_service import RetrievalHit


def _hit(text: str = "Original files are stored on local disk.") -> RetrievalHit:
    return RetrievalHit(
        chunk_id="chunk-1",
        document_id="doc-1",
        document_name="notes.txt",
        page=2,
        text=text,
        score=0.87,
    )


def test_rag_citations_are_structured_and_previewed():
    long_text = " ".join(["local citation evidence"] * 40)

    citations = citations_from_hits([_hit(long_text)])
    answer = fallback_answer("Where are files stored?", [_hit()])

    assert citations == [
        {
            "document_id": "doc-1",
            "document_name": "notes.txt",
            "page": 2,
            "chunk_id": "chunk-1",
            "text_preview": citations[0]["text_preview"],
            "score": 0.87,
        }
    ]
    assert len(citations[0]["text_preview"]) <= 260
    assert "notes.txt, page 2" in answer


@pytest.mark.asyncio
async def test_generate_llm_answer_returns_configuration_error_without_key(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(
        llm_service,
        "get_settings",
        lambda: SimpleNamespace(deepseek_api_key="", deepseek_model="deepseek-test"),
    )

    answer, error = await llm_service.generate_llm_answer("What is local?", [_hit()])

    assert answer is None
    assert error == "DEEPSEEK_API_KEY is not configured."


@pytest.mark.asyncio
async def test_generate_llm_answer_calls_deepseek_with_retrieved_context(monkeypatch: pytest.MonkeyPatch):
    captured: dict = {}

    class DummyResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict:
            return {"choices": [{"message": {"content": "Files are stored locally [1]."}}]}

    class DummyClient:
        def __init__(self, timeout: int):
            captured["timeout"] = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb) -> None:
            return None

        async def post(self, url: str, headers: dict, json: dict):
            captured["url"] = url
            captured["headers"] = headers
            captured["payload"] = json
            return DummyResponse()

    monkeypatch.setattr(
        llm_service,
        "get_settings",
        lambda: SimpleNamespace(deepseek_api_key="test-key", deepseek_model="deepseek-test"),
    )
    import httpx

    monkeypatch.setattr(httpx, "AsyncClient", DummyClient)

    answer, error = await llm_service.generate_llm_answer("Where are files stored?", [_hit()])

    assert answer == "Files are stored locally [1]."
    assert error is None
    assert captured["url"] == llm_service.DEEPSEEK_CHAT_COMPLETIONS_URL
    assert captured["headers"]["Authorization"] == "Bearer test-key"
    assert captured["payload"]["model"] == "deepseek-test"
    assert "notes.txt" in captured["payload"]["messages"][1]["content"]
    assert "Original files are stored on local disk." in captured["payload"]["messages"][1]["content"]
