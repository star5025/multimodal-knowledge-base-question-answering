# API Contract

Base URL: `http://127.0.0.1:8000`

## Health

`GET /health`

```json
{ "status": "ok" }
```

## Authentication

`POST /auth/register`

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

`POST /auth/login`

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "access_token": "jwt-token",
  "token_type": "bearer"
}
```

`GET /auth/me` uses `Authorization: Bearer <token>`.

## Documents

`POST /documents/upload` accepts multipart form field `file`.

Supported formats: `.txt`, `.pdf`, `.png`, `.jpg`, `.jpeg`.

Document status values:

```text
uploaded | processing | indexed | failed
```

Other endpoints:

```text
GET    /documents
GET    /documents/{document_id}
DELETE /documents/{document_id}
POST   /documents/{document_id}/reprocess
```

## QA

`POST /qa/query`

```json
{
  "question": "Where does the system store original files?",
  "top_k": 5
}
```

Response:

```json
{
  "answer": "string",
  "citations": [
    {
      "document_id": "string",
      "document_name": "sample.txt",
      "page": 1,
      "chunk_id": "string",
      "text_preview": "string",
      "score": 0.82
    }
  ]
}
```

