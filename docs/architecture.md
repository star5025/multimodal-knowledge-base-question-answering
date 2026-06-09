# Architecture

The project is a local-first web application for personal document question answering.

## Layers

- Frontend: React and Vite. It handles authentication, uploads, document status, chat, and citation display.
- Backend API: FastAPI. It handles auth, file upload, metadata, processing orchestration, retrieval, and QA.
- Processing: Text files are decoded directly, PDFs use PyMuPDF, and image OCR uses Tencent Cloud GeneralBasicOCR.
- Retrieval: Documents are cleaned, chunked, stored in SQLite, and searched with BM25 local ranking. Optional SentenceTransformers plus FAISS can still be used when available, and a simple lexical fallback keeps the demo working if optional ranking dependencies are missing.
- Generation: DeepSeek's official chat completion endpoint is used when `DEEPSEEK_API_KEY` is set. Without a key, the API returns a local extractive fallback answer with citations.

## Backend Module Structure

```text
app/main.py                         FastAPI application factory and global middleware
app/core/config.py                  Environment-driven settings and data-directory setup
app/core/security.py                Password hashing and signed bearer token handling
app/db/models.py                    SQLModel user, document, and chunk tables
app/db/session.py                   SQLite engine and session dependency
app/schemas/                        Pydantic request and response contracts
app/routers/                        HTTP endpoints only
app/services/document_processor.py  TXT, PDF, and image text extraction orchestration
app/services/ocr_service.py         Tencent Cloud GeneralBasicOCR integration
app/services/document_ingestion_service.py
                                    Process, save extracted text, chunk, index, and set status
app/services/vector_service.py      BM25 retrieval, optional FAISS retrieval, lexical fallback
app/services/rag_service.py         Retrieval-to-answer orchestration and citation formatting
app/services/llm_service.py         DeepSeek chat completion client
app/services/storage_service.py     Local file, extracted text, and filename utilities
```

## Data Storage

- `data/uploads`: original local files.
- `data/extracted`: extracted plain text files saved as `{document_id}.txt`.
- `data/indexes`: retrieval manifests and future FAISS artifacts.
- `data/app.db`: SQLite database for users, documents, and chunks.

All data directories are ignored by Git except `.gitkeep` files.

## Privacy Model

Original documents remain on local disk. Text/PDF parsing, chunking, indexing, and retrieval run in the local backend. Image OCR sends image content to Tencent Cloud GeneralBasicOCR when image files are uploaded. Only the retrieved text snippets are sent to DeepSeek, and only when the user configures `DEEPSEEK_API_KEY`.
