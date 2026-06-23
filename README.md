# Multimodal Personal Knowledge Base Question Answering System

[中文](./README.zh.md) | **English**

## 📚 Quick Navigation

- **[Core Technology Tutorial](./TUTORIAL.md)** - Deep dive into RAG, OCR, BM25, and system architecture
- **Project Structure:**
  - [`apps/api/`](./apps/api/) - FastAPI backend with document processing, RAG retrieval, and LLM integration
  - [`apps/web/`](./apps/web/) - React + TypeScript frontend with document management and chat interface
  - [`docs/`](./docs/) - API contracts, architecture design, and project reports
  - [`scripts/`](./scripts/) - Automated testing and verification scripts
  - [`tools/`](./tools/) - Utility scripts for development

## Important Configuration Notice

Before running this project, create a local `.env` file from `.env.example` and configure the required API keys.

```powershell
copy .env.example .env
```

Then edit `.env` and fill in:

```text
DEEPSEEK_API_KEY=your_deepseek_api_key
TENCENTCLOUD_SECRET_ID=your_tencentcloud_secret_id
TENCENTCLOUD_SECRET_KEY=your_tencentcloud_secret_key
TENCENTCLOUD_REGION=
```

The DeepSeek API key is used for LLM answer generation. Tencent Cloud SecretId and SecretKey are used for image OCR through GeneralBasicOCR.


## Project Overview

This project is a local-first multimodal personal knowledge base question answering system. Users can upload TXT, PDF, PNG, JPG, and JPEG files. The backend extracts text from documents, uses Tencent Cloud OCR for images, stores extracted text locally, builds searchable document chunks, retrieves relevant passages with BM25/RAG, and generates answers with citations through an external LLM.

The system contains:

```text
apps/api     FastAPI backend
apps/web     React + Vite frontend
docs         Project documentation
scripts      Test and verification scripts
tools        Utility scripts
```

## How to Run

Open two PowerShell terminals.

### 1. Start the Backend

From the project root:

```powershell
cd apps\api
uv sync --extra dev
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend health check:

```text
http://127.0.0.1:8000/health
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### 2. Start the Frontend

From the project root:

```powershell
cd apps\web
npm install
npm run dev
```

Open the web application:

```text
http://127.0.0.1:5173/
```

## Basic Usage

1. Register or log in.
2. Upload a TXT, PDF, PNG, JPG, or JPEG file.
3. Wait until the document status becomes `indexed`.
4. Ask a question in the chat page.
5. Review the generated answer and its source citations.

## Verification

Run the full local verification script from the project root:

```powershell
.\scripts\test-all.ps1
```

This runs the backend tests and frontend production build.
