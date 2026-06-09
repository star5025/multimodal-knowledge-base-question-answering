import pytest

from app.services.storage_service import get_file_type, sanitize_filename, validate_filename


def test_filename_validation_and_sanitization():
    validate_filename("lecture-notes.PDF")
    validate_filename("scan.jpeg")

    with pytest.raises(ValueError, match="Unsupported file format"):
        validate_filename("archive.zip")

    assert sanitize_filename("../weird name 中文.pdf") == "weird_name_.pdf"
    assert get_file_type("paper.pdf") == "pdf"
    assert get_file_type("photo.png") == "image"
    assert get_file_type("notes.txt") == "text"
