import re
from dataclasses import dataclass
from pathlib import Path

from app.services.ocr_service import OcrError, recognize_image_text


class ProcessingError(RuntimeError):
    pass


class UnsupportedFileError(ProcessingError):
    pass


@dataclass(frozen=True)
class ExtractedPage:
    page: int | None
    text: str


@dataclass(frozen=True)
class ProcessedDocument:
    pages: list[ExtractedPage]

    @property
    def text(self) -> str:
        return "\n\n".join(page.text for page in self.pages if page.text)


def clean_text(text: str) -> str:
    text = text.replace("\x00", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    lines = [line.strip() for line in text.splitlines()]
    return "\n".join(line for line in lines if line).strip()


def _read_text_file(path: Path) -> ProcessedDocument:
    data = path.read_bytes()
    for encoding in ("utf-8", "utf-8-sig", "gb18030", "latin-1"):
        try:
            text = data.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise ProcessingError("Could not decode text file.")
    text = clean_text(text)
    if not text:
        raise ProcessingError("The text file is empty after cleaning.")
    return ProcessedDocument(pages=[ExtractedPage(page=1, text=text)])


def _read_pdf(path: Path) -> ProcessedDocument:
    try:
        import fitz
    except Exception as exc:
        raise ProcessingError("PyMuPDF is not installed; PDF parsing is unavailable.") from exc

    pages: list[ExtractedPage] = []
    try:
        with fitz.open(path) as document:
            for index, page in enumerate(document, start=1):
                text = clean_text(page.get_text("text"))
                if text:
                    pages.append(ExtractedPage(page=index, text=text))
    except Exception as exc:
        raise ProcessingError(f"PDF parsing failed: {exc}") from exc
    if not pages:
        raise ProcessingError("No extractable text was found in the PDF. Try OCR on a scanned image.")
    return ProcessedDocument(pages=pages)


def _read_image(path: Path) -> ProcessedDocument:
    try:
        text = clean_text(recognize_image_text(path))
    except OcrError as exc:
        raise ProcessingError(str(exc)) from exc
    if not text:
        raise ProcessingError("Tencent Cloud OCR completed but no readable text was found.")
    return ProcessedDocument(pages=[ExtractedPage(page=1, text=text)])


def process_document(path: Path, filename: str) -> ProcessedDocument:
    suffix = Path(filename).suffix.lower()
    if suffix == ".txt":
        return _read_text_file(path)
    if suffix == ".pdf":
        return _read_pdf(path)
    if suffix in {".png", ".jpg", ".jpeg"}:
        return _read_image(path)
    raise UnsupportedFileError(f"Unsupported file format: {suffix or 'unknown'}")
