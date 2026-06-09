# Submission Guide

Use this guide when preparing the Proof-of-Concept source-code submission.

## Submit These Source Files

```text
apps/api/              FastAPI backend source, tests, pyproject.toml, uv.lock
apps/web/              React frontend source, package.json, package-lock.json
docs/architecture.md   Architecture overview
docs/api-contract.md   Backend API contract
docs/poc_feature_audit.md
scripts/test-all.ps1   One-command verification script
.env.example           Safe configuration template
.gitignore
README.md
```

## Do Not Submit These Runtime Or Private Files

```text
.env                   Contains real API keys
data/uploads/          Uploaded private source files
data/extracted/        Extracted runtime text
data/indexes/          Runtime retrieval manifests
data/app.db            Local SQLite database
.venv/, .uv-cache/, .uv-python/, .npm-cache/, node_modules/
apps/web/dist/
code/                  Old duplicated copy of the project
code.zip               Old duplicated project archive
```

## Verification Before Submission

From the repository root:

```powershell
.\scripts\test-all.ps1
```

Expected result:

```text
Backend tests: 12 passed
Frontend build: built successfully
```

## Recommended Screenshots

- Registration or login page.
- Document upload page showing TXT, PDF, or image document status as `indexed`.
- `data/extracted/{document_id}.txt` showing OCR/extracted text.
- Chat answer with citations.
- Expanded citation preview.
- `.\scripts\test-all.ps1` output showing tests and build passed.
