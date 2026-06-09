from io import BytesIO
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app
from app.services.storage_service import extracted_text_path


client = TestClient(app)


def _token(email: str | None = None) -> str:
    email = email or f"flow-{uuid4().hex}@example.com"
    password = "password123"
    client.post("/auth/register", json={"email": email, "password": password})
    response = client.post("/auth/login", json={"email": email, "password": password})
    return response.json()["access_token"]


def test_upload_text_and_query_fallback():
    token = _token()
    headers = {"Authorization": f"Bearer {token}"}
    body = b"Local-first knowledge base systems keep original files on disk and return citations."

    upload = client.post(
        "/documents/upload",
        files={"file": ("sample.txt", BytesIO(body), "text/plain")},
        headers=headers,
    )
    assert upload.status_code == 201
    upload_data = upload.json()
    assert upload_data["status"] == "indexed"

    extracted = extracted_text_path(upload_data["id"])
    assert extracted.exists()
    assert extracted.read_text(encoding="utf-8") == body.decode("utf-8")

    query = client.post("/qa/query", json={"question": "Where are original files kept?", "top_k": 3}, headers=headers)
    assert query.status_code == 200
    data = query.json()
    assert data["answer"]
    assert data["citations"]
    assert data["citations"][0]["document_name"] == "sample.txt"

    delete = client.delete(f"/documents/{upload_data['id']}", headers=headers)
    assert delete.status_code == 204
    assert not extracted.exists()


def test_documents_are_isolated_by_owner():
    owner_token = _token()
    other_token = _token()
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    other_headers = {"Authorization": f"Bearer {other_token}"}

    upload = client.post(
        "/documents/upload",
        files={"file": ("private.txt", BytesIO(b"Private owner-only citation text."), "text/plain")},
        headers=owner_headers,
    )
    assert upload.status_code == 201
    document_id = upload.json()["id"]

    other_list = client.get("/documents", headers=other_headers)
    assert other_list.status_code == 200
    assert document_id not in {document["id"] for document in other_list.json()}

    other_get = client.get(f"/documents/{document_id}", headers=other_headers)
    assert other_get.status_code == 404

    other_delete = client.delete(f"/documents/{document_id}", headers=other_headers)
    assert other_delete.status_code == 404
