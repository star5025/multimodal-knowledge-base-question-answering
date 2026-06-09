from pathlib import Path
from types import SimpleNamespace

import pytest

from app.services.chunking_service import chunk_pages
from app.services.document_processor import ExtractedPage, ProcessingError, process_document


def test_text_processing_and_chunking(tmp_path: Path):
    source = tmp_path / "notes.txt"
    source.write_text("Alpha beta gamma.\n\nPrivacy local storage retrieval citations.", encoding="utf-8")

    processed = process_document(source, "notes.txt")
    assert "Privacy" in processed.text

    chunks = chunk_pages(
        document_id="doc1",
        document_name="notes.txt",
        pages=[ExtractedPage(page=1, text=processed.text)],
        chunk_size=220,
        overlap=20,
    )
    assert chunks
    assert chunks[0].page == 1
    assert chunks[0].document_id == "doc1"


def test_pdf_processing_preserves_page_numbers(tmp_path: Path):
    import fitz

    source = tmp_path / "paper.pdf"
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), "PDF extraction keeps source pages for citation checks.")
    document.save(source)
    document.close()

    processed = process_document(source, "paper.pdf")

    assert processed.pages[0].page == 1
    assert "source pages" in processed.text


def test_image_processing_reports_missing_tencent_credentials(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    source = tmp_path / "scan.png"
    source.write_bytes(b"not a real image")
    monkeypatch.setattr(
        "app.services.ocr_service.get_settings",
        lambda: SimpleNamespace(tencentcloud_secret_id="", tencentcloud_secret_key="", tencentcloud_region=""),
    )

    with pytest.raises(ProcessingError, match="Tencent Cloud OCR credentials"):
        process_document(source, "scan.png")


def test_tencent_general_basic_ocr_extracts_image_text(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    from app.services import ocr_service

    source = tmp_path / "scan.png"
    source.write_bytes(b"fake image bytes")
    captured: dict = {}

    class FakeRequest:
        def from_json_string(self, payload: str) -> None:
            captured["payload"] = payload

    class FakeModels:
        GeneralBasicOCRRequest = FakeRequest

    class FakeResponse:
        def to_json_string(self) -> str:
            return '{"TextDetections": [{"DetectedText": "English ebook line one."}, {"DetectedText": "Second line."}]}'

    class FakeClient:
        def GeneralBasicOCR(self, request: FakeRequest) -> FakeResponse:
            captured["request_type"] = type(request).__name__
            return FakeResponse()

    monkeypatch.setattr(
        "app.services.ocr_service.get_settings",
        lambda: SimpleNamespace(tencentcloud_secret_id="123", tencentcloud_secret_key="234", tencentcloud_region=""),
    )
    monkeypatch.setattr(ocr_service, "_create_tencent_ocr_client", lambda *_: (FakeClient(), FakeModels))

    processed = process_document(source, "scan.png")

    assert processed.text == "English ebook line one.\nSecond line."
    assert captured["request_type"] == "FakeRequest"
    assert "ImageBase64" in captured["payload"]
