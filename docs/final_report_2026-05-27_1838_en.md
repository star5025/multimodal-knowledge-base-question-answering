# Final Report: Multimodal Personal Knowledge Base Question Answering System

**Course:** JC3506 Software Design and Implementation\
**Assessment component:** Final Report\
**Project:** Multimodal Personal Knowledge Base Question Answering
System\
**Group:** \[Insert group number\]\
**Team members:** \[Insert team member names\]\
**Submission date:** \[Insert submission date\]

## Executive Summary

This report presents the design, implementation, development process,
and evaluation of a Multimodal Personal Knowledge Base Question
Answering System. The project addresses a practical problem faced by
students, researchers, and privacy-sensitive users: personal knowledge
is often distributed across PDF files, scanned images, handwritten or
photographed notes, and plain text files, while conventional file
systems provide only filename-level organisation and keyword search.
Users may know that a concept appears somewhere in their materials, but
locating the relevant page, paragraph, or image can be slow and
unreliable. At the same time, fully cloud-based knowledge tools
introduce privacy concerns because original documents may need to be
uploaded to external servers.

The implemented system is a local-first web application that supports
user authentication, document upload, document management, text
extraction from text files and PDFs, image OCR through Tesseract where
available, text cleaning, chunking, local metadata storage, retrieval,
question answering, and citation display. The backend is implemented
using FastAPI and SQLite, while the frontend is implemented using React,
Vite, and TypeScript. The retrieval layer is designed to use
SentenceTransformers and FAISS when the optional machine learning
dependencies are installed, and it also includes a local lexical
fallback to ensure that the proof-of-concept remains demonstrable in
restricted environments. Generated answers are produced through the
official DeepSeek API when a DeepSeek API key is configured. If the key
is absent or the external call fails, the system falls back to an
extractive answer based on retrieved local chunks, preserving the
end-to-end demonstration workflow.

The system was developed iteratively from the original project proposal
into a working proof-of-concept. The implementation prioritises
architectural clarity, local data ownership, demonstrability, and
traceable outputs. It does not attempt to become a commercial-scale
cloud platform or enterprise knowledge management suite. Instead, it
focuses on the core pipeline required by the project: upload, parse,
index, retrieve, answer, and cite. Evaluation shows that the implemented
proof-of-concept satisfies the central project objectives, while also
revealing limitations around OCR installation, semantic retrieval
dependency size, answer quality under fallback mode, and the need for
broader usability testing. The report concludes by identifying realistic
future improvements, including richer document viewers, background
processing, encrypted local storage, improved retrieval ranking, and
more complete evaluation datasets.

# 1. Introduction and System Overview

## 1.1 Problem Context

Modern study and professional work increasingly produce fragmented
personal knowledge. A single user may accumulate lecture notes, academic
papers, scanned handouts, project documents, meeting notes, screenshots,
photographs of whiteboards, technical manuals, and personal records.
These files often contain valuable information, but their value is
reduced when the user cannot quickly retrieve relevant content. Ordinary
file systems provide folders, filenames, dates, and sometimes basic
full-text search. However, they do not provide a natural language
interface that lets users ask questions such as “Which document explains
retrieval augmented generation?”, “Where is the privacy requirement
discussed?”, or “Which scanned note mentions the evaluation method?”

The problem becomes more complex when documents are multimodal. A PDF
may contain embedded text, scanned pages, tables, diagrams, or
references. An image may contain printed or handwritten text. A user may
not remember whether information came from a PDF, a screenshot, or a
text note. Keyword search is often insufficient because users ask in
different words from those used in the document. For example, a user may
ask about “local data protection” while the document uses
“privacy-preserving local storage”. This motivates a system that can
extract text from heterogeneous files, create searchable
representations, retrieve relevant content, and generate an answer
grounded in the user’s own documents.

Privacy is also a central consideration. Many existing AI knowledge-base
products rely on cloud document ingestion. This can be useful, but it is
not always acceptable for personal records, course materials, research
notes, financial documents, medical information, or private journals.
The project therefore adopts a local-first approach: original files,
extracted content, metadata, and retrieval indexes are stored locally.
Only selected retrieved text fragments are sent to an external large
language model when the user explicitly configures an API key. This
design balances the practicality of modern language models with the
privacy benefits of local storage and local retrieval.

## 1.2 Project Aim

The aim of the project is to design and implement a software-centric
proof-of-concept for a multimodal personal knowledge base question
answering system. The system should demonstrate that a user can upload
documents, have them processed locally, ask natural language questions,
and receive answers with citations to supporting document fragments. The
implementation is expected to reflect sound software design principles,
clear architectural separation, and practical development decisions.

The intended result is not a complete commercial product. Instead, the
result is a technically credible proof-of-concept that validates the
design direction. The implementation should be stable enough for
demonstration, easy enough for users to operate locally, and structured
enough to support future extension.

## 1.3 Target Users

The project targets three main user groups.

First, students need to manage course handouts, lecture notes, academic
articles, screenshots, and revision materials. A student may want to ask
where a concept appears, compare explanations across documents, or
retrieve a citation from an uploaded paper. For this group, the
important requirements are usability, quick upload, simple document
management, and answer traceability.

Second, researchers and knowledge workers need to manage project
documentation, meeting notes, technical manuals, papers, and
experimental records. They need cross-document retrieval, source
attribution, and the ability to ask follow-up questions without manually
re-reading large document collections. For this group, citation quality
and retrieval transparency are especially important.

Third, privacy-sensitive users need to manage documents that should not
be freely uploaded to cloud storage. These may include financial
records, medical reports, contracts, or private notes. For this group,
local storage, local retrieval, and controlled external transmission are
core design constraints rather than optional features.

## 1.4 Resulting System Overview

The implemented system is a browser-accessible local web application. It
consists of a React frontend and a FastAPI backend running on the user’s
machine. Users access the frontend through a local development URL,
typically `http://127.0.0.1:5173`, while the API runs at
`http://127.0.0.1:8000`. The backend stores data in local directories
and a local SQLite database.

The main capabilities are:

| Capability | Description |
|----|----|
| User authentication | Users can register, log in, and access protected document and QA endpoints through bearer tokens. |
| File upload | Users can upload TXT, PDF, PNG, JPG, and JPEG files. Unsupported formats are rejected. |
| Document management | Users can view document names, types, sizes, processing status, errors, and update times. |
| Text extraction | TXT files are decoded directly, PDFs are parsed with PyMuPDF, and images are OCR-processed with Tesseract where installed. |
| Text cleaning and chunking | Extracted text is normalised and split into smaller chunks with document and page metadata. |
| Retrieval | The system retrieves relevant chunks using optional semantic retrieval and a local lexical fallback. |
| Question answering | The backend constructs a prompt using retrieved chunks and calls DeepSeek when configured. |
| Citation display | Answers include citations containing document name, page number, chunk identifier, preview text, and score. |
| Graceful fallback | If the LLM key is missing or the external call fails, the system returns a local evidence-based answer rather than failing silently. |

The operating context is a local machine used for coursework
demonstration. The system is intentionally designed to work without
complex deployment infrastructure. It does not require cloud storage,
container orchestration, or third-party identity providers.

## 1.5 Scope

The proof-of-concept implements the core workflow described in the project proposal: a user registers, uploads a TXT/PDF/image file, the backend stores and processes it locally, text is cleaned and chunked, the user asks a natural language question, relevant chunks are retrieved, and the frontend displays an answer with citations. This end-to-end path is the main assessment target because it connects document ingestion, multimodal text extraction, retrieval, generation, and source traceability in one usable system.

The project intentionally excludes commercial cloud deployment, large-scale distributed storage, real-time collaborative editing, native mobile applications, self-trained large language models, and enterprise-grade authorisation. These exclusions keep the work aligned with the module timeframe and concentrate effort on design quality, implementation credibility, and demonstrable behaviour.

# 2. System Design

## 2.1 Design Goals

The system design is guided by six goals.

The first goal is local-first operation. Original documents should
remain on the user’s machine. The database, uploaded files, and
retrieval data should be stored in local project directories. External
services should only receive selected text fragments after retrieval,
and only if the user has configured a model API key.

The second goal is modularity. Document processing, storage, retrieval,
authentication, LLM generation, and frontend presentation should be
separated. This reduces coupling and allows parts of the system to be
replaced. For example, the OCR backend, embedding model, or LLM provider
can be changed without rewriting the document management UI.

The third goal is traceability. A generated answer is only useful if
users can verify where it came from. The system therefore preserves
document name, page number, chunk identifier, preview text, and
retrieval score. These citations are returned by the API and displayed
in the frontend.

The fourth goal is graceful degradation. In a student project
environment, external services, OCR engines, and heavy machine learning
dependencies may not always be available. The system should still
demonstrate the core workflow when optional components are missing. This
is why the retrieval layer includes a local lexical fallback and the
answer layer includes a local extractive fallback.

The fifth goal is simplicity of deployment. The proof-of-concept should
be easy to run on a development machine. It uses a local FastAPI
process, a Vite frontend server, SQLite, and file-system directories.
This avoids the need for Docker, managed databases, or remote
infrastructure during demonstration.

The sixth goal is extensibility. Although the proof-of-concept is
intentionally limited, the architecture should make realistic extensions
possible, including background processing, encrypted storage, better
semantic retrieval, richer document previews, or additional file
formats.

## 2.2 High-Level Architecture

The system uses a layered architecture. Each layer has a clear
responsibility and communicates through explicit interfaces.

| Layer | Main responsibility | Main technologies |
|----|----|----|
| Frontend layer | Login, upload, document management, chat, citations | React, TypeScript, Vite |
| API layer | HTTP endpoints, authentication, request validation, response formatting | FastAPI, Pydantic |
| Persistence layer | User, document, and chunk metadata | SQLite, SQLModel |
| File storage layer | Original uploaded files and retrieval manifests | Local file system |
| Processing layer | Text extraction, OCR, cleaning, and chunking | PyMuPDF, pytesseract, Tesseract |
| Retrieval layer | Chunk search and ranking | SentenceTransformers, FAISS, lexical fallback |
| Generation layer | Prompt construction and answer generation | DeepSeek API, fallback answer logic |

The main architectural flow is:

1.  The browser sends authenticated requests to the FastAPI backend.
2.  The backend validates the request and authorises the user.
3.  Uploaded files are stored in `data/uploads`.
4.  Metadata is recorded in SQLite.
5.  The processing service extracts and cleans text.
6.  The chunking service creates page-aware chunks.
7.  The retrieval service stores chunk metadata and retrieves relevant
    chunks during QA.
8.  The generation service sends only retrieved chunks to DeepSeek if
    configured.
9.  The backend returns an answer and citations.
10. The frontend renders the answer and expandable citation previews.

This architecture follows a separation-of-concerns principle. The
frontend does not know how text extraction or retrieval work. The
document router does not contain the low-level OCR logic. The LLM
service does not directly manipulate the database. Each component has a
focused responsibility.

## 2.3 Backend Component Design

The backend is implemented as a FastAPI application under
`apps/api/app`. It is organised into routers, services, database models,
configuration, and security utilities.

The router layer exposes the public API:

| Router | Endpoints | Responsibility |
|----|----|----|
| Authentication router | Register, login, current user | Account creation, password verification, token issuing |
| Documents router | Upload, list, get, delete, reprocess | File management and processing orchestration |
| QA router | Query endpoint | Question validation and answer response |
| Health endpoint | Health/configuration status | Basic operational check |

The service layer implements reusable business logic:

| Service | Responsibility |
|----|----|
| Storage service | File type validation, filename sanitisation, upload saving, file deletion |
| Document processor | TXT decoding, PDF parsing, image OCR, text cleaning |
| Chunking service | Chunk generation with document, page, and index metadata |
| Vector service | Chunk persistence, retrieval, semantic search attempt, lexical fallback |
| LLM service | DeepSeek request construction and response extraction |
| RAG service | Retrieval orchestration, citation formatting, fallback answer generation |

The database model includes three main entities:

| Entity | Purpose |
|----|----|
| User | Stores user identity and hashed password |
| Document | Stores uploaded document metadata, owner, status, error message, and storage filename |
| DocumentChunk | Stores extracted chunks with owner, document, page, and text |

The design uses `owner_id` in document and chunk records to support
personal knowledge bases. The current proof-of-concept has basic user
isolation through authentication and ownership checks. This is not a
full enterprise authorisation model, but it provides a foundation for
private user workspaces.

## 2.4 Frontend Component Design

The frontend is implemented under `apps/web/src` using React and
TypeScript. It is intentionally focused on operational workflows rather
than a marketing-style landing page. The first screen is authentication,
followed by document management and question answering.

The main frontend modules are:

| Component or page | Responsibility |
|----|----|
| `App` | Authentication state, top-level navigation, session persistence |
| `LoginPage` | Register/login form and authentication feedback |
| `DocumentsPage` | Document list, search, refresh, delete and reprocess actions |
| `UploadPanel` | File selection, client-side format validation, upload status |
| `DocumentTable` | Document metadata, status badges, row actions |
| `ChatPage` | Chat state and QA request handling |
| `ChatWindow` | Message display, question input, loading state |
| `CitationList` | Expandable citation previews |
| `api.ts` | Typed HTTP client for backend endpoints |

The frontend keeps interface state simple. It stores the authentication
token in local storage, retrieves the current user on startup, and
routes the user between the document and chat views. The document view
emphasises processing status and error visibility, which is important
because document processing can fail for legitimate reasons such as
unsupported file formats or missing OCR binaries. The chat view
emphasises answer traceability through citations.

## 2.5 Data Flow: Document Upload

The upload flow begins when the user selects a file in the browser. The
frontend checks the extension against the supported formats and sends
the file as multipart form data to the backend. The backend validates
the filename again because client-side validation is not sufficient for
security or correctness.

The backend then sanitises the filename and stores the file in the local
upload directory using a generated unique stored filename. This avoids
collisions and reduces the risk of unsafe path usage. A document record
is created in SQLite with status `uploaded`, then processing begins. The
document status is set to `processing`, allowing the UI to communicate
progress. After processing succeeds, the system writes chunks and sets
the document status to `indexed`. If any error occurs, chunks for that
document are deleted, the status becomes `failed`, and the error message
is stored for display.

This design makes failures visible and recoverable. A failed document
can be reprocessed. A missing OCR engine, unreadable file, empty
document, or parsing exception does not crash the application. It
becomes a document-level failure that the user can inspect.

## 2.6 Data Flow: Question Answering

The question-answering flow begins when the user submits a natural
language question in the chat interface. The frontend sends the question
and `top_k` value to the backend. The backend verifies the user token
and retrieves chunks owned by that user.

The retrieval service first attempts semantic retrieval if the optional
SentenceTransformers and FAISS dependencies are available. It encodes
document chunks and the question, searches by vector similarity, and
returns ranked hits. If the semantic dependencies are unavailable, it
uses a lexical scoring fallback based on token overlap, phrase match,
and term density. This fallback is less semantically powerful, but it
keeps the demonstration operational without requiring heavy machine
learning installation.

The RAG service converts the retrieval hits into prompt context. Each
hit is numbered and includes the source document name, page number, and
text. The LLM service sends a system instruction and a user prompt to
DeepSeek’s official chat completions endpoint. The prompt instructs the
model to answer only from the supplied excerpts, to state when evidence
is insufficient, and to cite sources using bracket numbers. If DeepSeek
is unavailable, the RAG service constructs a local fallback answer from
the top retrieved chunks and still returns citations.

This flow supports answer traceability. The model does not receive the
entire knowledge base, only the selected chunks. The frontend separately
displays citation metadata, so the user can inspect the evidence even if
the generated answer is incomplete.

## 2.7 Interface Design

The API contract is deliberately small and stable. It covers health checking, registration, login, current-user retrieval, document upload, document listing, document deletion, reprocessing, and question answering. The QA response returns both an answer string and structured citation objects containing document name, page, chunk identifier, preview text, and retrieval score. Treating citations as first-class data is more reliable than asking the language model to format all evidence inside free text, and it lets the frontend render citations consistently.

## 2.8 Privacy and Security Design

The privacy design has three layers.

First, original files remain local. Uploaded files are stored under the
local data directory and are ignored by Git. Extracted chunks and SQLite
metadata are also stored locally. This prevents accidental submission of
user documents with the source code.

Second, retrieval occurs locally. The system retrieves relevant chunks
before any LLM call. This limits external transmission to selected
passages rather than entire files. It also keeps the system usable when
no external API key is configured.

Third, authentication is used to separate user workspaces. Passwords are
hashed with a PBKDF2-based scheme. Authentication uses bearer tokens.
Document and chunk queries are scoped to the current user. This is
appropriate for a proof-of-concept local application. It is not
equivalent to enterprise security, but it demonstrates access-control
awareness and prepares the architecture for stronger isolation.

The security design also avoids storing secrets in tracked files. The
DeepSeek API key belongs in `.env`, which is ignored by Git. The
repository includes `.env.example` to show the required variable names
without including sensitive values.

## 2.9 Design Rationale

Several design decisions were made to balance technical quality and
project feasibility.

FastAPI was selected because it provides clear request validation,
automatic OpenAPI documentation, strong Python ecosystem compatibility,
and efficient development speed. Python is also suitable for document
processing, OCR integration, and machine learning libraries.

SQLite was selected because the system is local-first and
single-machine. A server database would add operational complexity
without improving the proof-of-concept. SQLite is sufficient for storing
users, documents, and chunks in a local demonstration environment.

React with Vite was selected because it provides a fast frontend
development experience and clear component separation. TypeScript adds
stronger client-side type checking for API responses and UI state.

DeepSeek’s official API was selected for answer generation because it
provides an external chat completion model while keeping the system
independent from cloud file storage. The backend uses a single dedicated
DeepSeek integration rather than a generic provider abstraction at the
current stage. This reduces configuration confusion and matches the
latest project decision.

The fallback retrieval and fallback answer paths were included because
proof-of-concept systems must be demonstrable under imperfect
conditions. The fallback path also supports evaluation of the local
retrieval pipeline independently from the external LLM.

# 3. Implementation

## 3.1 Technology Stack

The implemented technology stack is:

| Area | Technology |
|----|----|
| Frontend | React, TypeScript, Vite |
| Backend | FastAPI, Python |
| API validation | Pydantic models through FastAPI |
| Database | SQLite through SQLModel |
| File storage | Local file system |
| PDF processing | PyMuPDF |
| Image OCR | Tesseract through pytesseract |
| Retrieval | SentenceTransformers and FAISS when available, lexical fallback otherwise |
| LLM integration | DeepSeek official chat completions API |
| Testing | pytest, FastAPI TestClient, TypeScript build |
| Environment management | uv for backend, npm for frontend |

This stack supports the goals of rapid implementation, local operation,
and extensibility. It also keeps the project understandable for a
software design and implementation assessment.

## 3.2 Implementation Organization

The implementation is organised around a clear separation between backend services, frontend components, runtime data, documentation, and utility tooling. Application code is separated from uploaded files, extracted text, indexes, local databases, virtual environments, and secrets. This matters for a local-first knowledge system because runtime files may contain private documents or API keys and must not be submitted accidentally with source material.

The organization also supports parallel work. Backend API changes, frontend interface changes, retrieval experiments, and documentation updates can be made in focused areas as long as the shared API contract remains stable.

## 3.3 Backend Implementation

The backend application starts by loading configuration, creating
required data directories, initialising database tables, and registering
routers. The application exposes health information and protected
endpoints.

Authentication is implemented using a local user table, password
hashing, and bearer tokens. This gives the project an access-control
layer without requiring an external identity service. Registration
stores a lowercased email and a password hash. Login verifies the
password and issues a signed token. Protected endpoints depend on the
current user, which allows document and chunk queries to be scoped by
owner.

The document router implements the upload and management lifecycle.
Upload requests validate the file type and store the original file
locally. The processing routine updates status values as the document
progresses. The use of explicit statuses makes the UI clearer and also
helps debugging. The status values are `uploaded`, `processing`,
`indexed`, and `failed`.

The document processor handles three file categories. Text files are
decoded using a small sequence of likely encodings. PDFs are parsed
using PyMuPDF page by page. Images are passed to pytesseract if the
Tesseract executable is available on the system. Extracted text is
cleaned by removing null characters, reducing repeated spaces,
collapsing excessive blank lines, and discarding empty lines. This
simple normalisation improves chunk quality without creating a complex
natural language processing pipeline.

The chunking service splits each page’s text into chunks with a
configurable size and overlap. Chunking is page-aware, so the system can
preserve page numbers for citations. The implementation also attempts to
split near natural boundaries such as line breaks, sentence boundaries,
or spaces rather than cutting text blindly whenever possible.

The vector service stores chunks in SQLite and retrieves them during
question answering. It attempts semantic retrieval if
SentenceTransformers and FAISS are installed. If those packages are not
available, the service uses lexical scoring. This is an
implementation-specific design decision that increases robustness. A
classroom demonstration should not fail simply because optional machine
learning dependencies are heavy or slow to install.

The LLM service is intentionally narrow. It calls DeepSeek’s official
chat completions endpoint. The payload includes the selected model, a
system message, the user question, retrieved local excerpts,
temperature, and non-streaming mode. The service returns both the answer
and an error message if the call fails. This allows the RAG layer to
show a useful fallback message rather than hiding the cause.

## 3.4 Frontend Implementation

The frontend is a single-page React application. It is designed around
two main authenticated views: document management and question
answering. The UI is functional and restrained because the application
is a work-focused tool rather than a public marketing website.

The login page supports both account creation and login. Once a token is
received, it is stored locally and used for API requests. On application
startup, the frontend calls the current-user endpoint to check whether
the saved token is still valid.

The document page contains the upload panel and document list. Uploading
triggers backend processing, and the returned document status is
displayed immediately. The table shows filenames, file type, size,
status, updated time, and error messages. Users can delete a document or
reprocess it. A search box filters by filename, which is useful when a
knowledge base contains many files.

The chat page keeps a local message list. When the user asks a question,
the frontend sends it to the QA endpoint and displays the returned
answer. If citations are present, they are shown below the assistant
response. Each citation can be expanded to show the text preview. This
design makes it possible to verify the answer without opening the raw
document.

The API client is centralised in a single TypeScript file. This reduces
duplication and keeps endpoint paths, request formats, and response
types in one place. If the backend contract changes, the frontend
changes can be made in a predictable location.

## 3.5 RAG Prompt and Answer Generation

The generation prompt is deliberately conservative. The system prompt
instructs the model to answer only using the supplied local knowledge
base excerpts, to say what is missing if the excerpts are insufficient,
and to cite sources using bracket numbers. The user prompt contains the
user’s question followed by numbered excerpts. Each excerpt includes the
document name, page, and chunk text.

This prompt design supports the project’s traceability requirement. It
does not guarantee perfect factual grounding because language models can
still make mistakes, but it reduces the opportunity for unsupported
answers. The separate structured citation list further supports
verification.

The current prompt does not include advanced features such as query
rewriting, multi-step reasoning instructions, or answer format
templates. This is an intentional proof-of-concept choice. It keeps the
model interaction understandable and makes evaluation easier. Future
work could add more sophisticated prompt templates for summarisation,
comparison, or study revision modes.

## 3.6 Error Handling

The implementation includes several error-handling mechanisms.

Unsupported file formats are rejected with a clear message. Empty or
unreadable documents become failed documents rather than crashing the
backend. Missing Tesseract installation produces a clear OCR error.
DeepSeek API failures produce a local fallback answer that includes the
LLM error string. Authentication failures return appropriate error
responses. The frontend displays errors in visible banners or document
rows.

This approach improves user experience and demonstrability. In an
academic project, it is important not only that the happy path works,
but also that common failure cases are handled predictably.

## 3.7 Configuration

The system uses environment variables for local configuration, including the token signing secret, DeepSeek API key, selected DeepSeek model, optional embedding model, chunk size, chunk overlap, and allowed frontend origins. The example environment file documents the expected names without exposing secrets, while the real environment file is ignored by version control. This keeps the setup reproducible and protects credentials during coursework submission.

## 3.8 Application of Design Principles

The project applies several design principles.

Separation of concerns is visible in the split between routers,
services, models, and frontend components. The storage service is not
responsible for LLM calls. The LLM service is not responsible for
database queries. The frontend API client is separate from UI
components.

Single responsibility is applied at the module level. Each service has a
clear purpose. This makes the code easier to test and modify. For
example, the document processor can be improved without changing the
authentication router.

Graceful degradation is built into retrieval and generation. Semantic
retrieval and DeepSeek generation improve quality when available, but
local fallback paths preserve basic functionality when external or
optional dependencies are unavailable.

Explicit interfaces are used through API contracts and typed frontend
models. The QA endpoint returns structured citations rather than
requiring the frontend to parse citations from natural language.

Local-first privacy is applied through data placement and processing
flow. Files are stored locally, and retrieval happens before any
external request. Only selected chunks are sent to DeepSeek.

## 3.9 Significant Technical Challenges

One challenge was balancing semantic retrieval quality with installation
complexity. SentenceTransformers and FAISS are suitable for semantic
retrieval, but they add large dependencies and can be difficult to
install in restricted environments. The implemented solution makes these
dependencies optional and provides a lexical fallback. This preserves
extensibility while keeping the proof-of-concept demonstrable.

A second challenge was handling OCR realistically. Image OCR depends not
only on Python libraries but also on the Tesseract executable being
installed on the system path. The system cannot fully control that
external installation. The implementation therefore detects missing
Tesseract and reports a clear failure. This is preferable to silently
producing empty text or crashing.

A third challenge was managing LLM provider configuration. During
development, an intermediate API gateway was considered, but the final
implementation uses DeepSeek’s official API directly. This reduced
configuration complexity and removed ambiguous base URL settings. The
final design has a dedicated DeepSeek key and model variable.

A fourth challenge was maintaining citation metadata through the
pipeline. Page numbers and document names must survive extraction,
chunking, storage, retrieval, answer generation, and frontend rendering.
The design addresses this by treating citation metadata as structured
data stored with chunks and returned separately from the generated
answer.

A fifth challenge was ensuring the system remains useful when the
external LLM fails. A system that fails entirely when the model API is
unavailable would be fragile. The fallback answer path provides a
lower-quality but still informative response based on retrieved chunks.

## 3.10 Data Model and Persistence Details

The data model is intentionally small but captures the relationships needed for ownership, processing state, retrieval, and citation. The `User` entity stores identity and hashed authentication material. The `Document` entity stores owner, original filename, generated stored filename, type, size, processing status, error message, and timestamps. The `DocumentChunk` entity stores owner, document, page number, chunk index, and chunk text so that retrieved evidence can be traced back to its source.

SQLite is appropriate for this proof-of-concept because it is local, reliable, simple to inspect, and requires no separate database service. The design does not target high-concurrency SaaS workloads, which are explicitly outside the project scope. Runtime files and databases are kept out of tracked source files to reduce privacy and submission risks.

## 3.11 API and Contract Stability

The API contract allows frontend and backend work to proceed independently. Authentication follows a register-login-current-user pattern, document endpoints expose upload and management actions, and the QA endpoint accepts a question plus retrieval count and returns an answer with citations. This predictable contract was important for team coordination because UI work and backend RAG work could progress in parallel.

Returning citations as structured data is the most important contract decision. It avoids fragile parsing of generated prose and makes the evidence visible even when the generated answer is short, incomplete, or produced by the local fallback path. The health endpoint also helps diagnose whether DeepSeek is configured without exposing the API key.

## 3.12 Testing Strategy

Testing focuses on the behaviours with the highest proof-of-concept risk. Backend tests use FastAPI's test client to verify registration, login, token use, text processing, chunk creation, document upload, and QA fallback behaviour. Frontend verification uses the production build to check TypeScript compilation, module resolution, and bundling. Ruff is used for backend static checking.

This strategy is proportionate to the project stage. It provides evidence that the main workflow is stable enough for demonstration, while leaving broader future work such as OCR-specific tests, retrieval ranking tests, browser interaction tests, and user-based evaluation.

## 3.13 Deployment and Operation

The system runs as two local processes: a FastAPI backend and a Vite frontend. This operation model supports the privacy goal because documents remain on the user's machine and no remote hosting is required. The main prerequisites are a backend environment, a Node.js frontend environment, optional Tesseract installation for OCR, and an optional DeepSeek key for generated answers. Without the key, the system still demonstrates local retrieval and citation output.

For non-technical users, running two processes is only acceptable as a proof-of-concept. A later version should provide a single launcher that checks dependencies, starts both services, verifies ports, and opens the browser automatically.

# 4. Development Process

## 4.1 Methodology

The project followed an agile, iterative development approach inspired
by Scrum. The original proposal divided the work into front-end,
back-end, algorithm/RAG, integration, and documentation
responsibilities. The implementation process reflected this by building
the system in functional slices rather than attempting to complete each
layer in isolation.

The development approach prioritised a working end-to-end flow early. A
proof-of-concept is most valuable when the core workflow can be
demonstrated. Therefore, the first implementation target was not a
complete user interface or perfect retrieval model, but the smallest
meaningful pipeline: register, upload, extract, chunk, ask, retrieve,
answer, and cite. Once that path existed, the design could be refined
and error handling improved.

## 4.2 Iteration Strategy

The development process can be described as six iterations.

The first iteration established the repository structure and
architecture. The monorepo layout was created with separate frontend,
backend, data, and documentation directories. The API contract and
architecture documents were added to keep the implementation aligned
with the proposal.

The second iteration implemented backend foundations. This included
FastAPI application setup, configuration loading, SQLite models,
database sessions, authentication, password hashing, bearer tokens, and
basic routers. This created the foundation for protected workflows.

The third iteration implemented document ingestion. File upload, format
validation, local storage, metadata creation, status transitions, and
document listing were added. TXT and PDF text extraction were
implemented, and OCR support was prepared through pytesseract and
Tesseract detection.

The fourth iteration implemented retrieval and QA. Text cleaning,
chunking, chunk persistence, retrieval, DeepSeek integration, prompt
construction, citation formatting, and fallback answering were
implemented. This completed the core RAG pipeline.

The fifth iteration implemented the frontend. The login page, document
management page, upload panel, document table, chat page, chat window,
and citation display were added. The UI was connected to the backend
through a typed API client.

The sixth iteration focused on integration, testing, documentation, and
configuration cleanup. Tests were added for authentication, document
upload, QA fallback, text processing, and chunking. Frontend builds and
backend linting were run. The LLM configuration was simplified to
DeepSeek official API variables only. Documentation was updated to match
the implementation.

## 4.3 Milestone Progression

The project progressed from proposal to implementation as follows:

| Milestone | Outcome |
|----|----|
| Requirements and proposal | Defined target users, local-first RAG scope, technologies, and exclusions |
| Architecture design | Established layered architecture and local data model |
| Backend foundation | Implemented authentication, configuration, database, and router structure |
| Document processing | Added file upload, PDF parsing, text extraction, OCR path, and status handling |
| Retrieval and RAG | Added chunking, retrieval, DeepSeek generation, and fallback answers |
| Frontend workflow | Added login, upload, document list, chat, and citation UI |
| Verification | Added automated tests and build checks |
| Documentation | Created API contract, architecture notes, README, utility script, and final report |

The milestones show a progression from design to operational
proof-of-concept. Each milestone produced a usable improvement rather
than only internal code changes.

## 4.4 Adaptations During Development

Several adaptations were made during development.

The original proposal allowed either OpenAI-compatible external LLM
services or other comparable providers. During implementation, the
project first supported a configurable OpenAI-compatible base URL.
However, this created configuration confusion when an intermediate
gateway was used. The design was then simplified to DeepSeek official
API only. This reduced the risk of incorrect base URLs and made the
configuration clearer for demonstration.

The retrieval design was also adapted. The proposal named
SentenceTransformers and FAISS as proposed technologies. The
implementation keeps these as the preferred semantic retrieval path but
provides a lexical fallback. This adaptation was necessary because
optional machine learning dependencies can create installation issues in
restricted local environments. The fallback does not replace semantic
retrieval as the ideal path, but it protects the proof-of-concept
workflow.

Testing was adapted to the local environment. Temporary directories and
cache locations were configured inside the project to avoid permission
problems. This made automated checks more reliable in the development
environment.

The frontend design also adapted to the proof-of-concept focus. Instead
of building a broad dashboard or landing page, the interface focuses on
the workflows that matter for evaluation: uploading, seeing processing
status, asking questions, and verifying citations.

## 4.5 Teamwork and Role Reflection

The proposed team structure divided responsibilities into frontend,
backend, algorithm/RAG, project leadership, and documentation. The
implemented repository reflects these boundaries. Frontend work is
isolated in `apps/web`; backend API and service work is in `apps/api`;
documentation is in `docs`; utility scripts are in `tools`.

This structure supports parallel development. A frontend developer can
work on the chat interface while a backend developer works on QA
endpoint behaviour, as long as the API contract remains stable. A
processing-focused developer can improve OCR or chunking without
modifying the login UI. A documentation-focused member can update
architecture and user manual materials without touching runtime code.

The development process also highlights the importance of integration
ownership. Even when tasks are divided, the value of the system depends
on the complete workflow. Upload, processing, retrieval, generation, and
citation display must work together. Integration testing and shared API
contracts are therefore essential for this kind of project.

# 5. Evaluation of Outcomes

## 5.1 Evaluation Approach

The system was evaluated against the original objectives and the course
assessment expectations. The evaluation considers functional
completeness, architectural alignment, implementation quality,
usability, privacy, stability, and limitations. Evidence includes
implemented features, repository structure, automated tests, build
results, and observed behaviour during local testing.

The evaluation is not a large-scale user study. That would require more
participants, prepared task sets, quantitative timing data, and
controlled comparison with alternative tools. For a proof-of-concept
project, the evaluation focuses on whether the system convincingly
demonstrates the proposed design and whether the implementation is
technically credible and extendable.

## 5.2 Requirement Satisfaction

The implemented system satisfies the central requirements from the
proposal.

| Requirement | Outcome |
|----|----|
| Upload PDFs, images, and text files | Implemented for TXT, PDF, PNG, JPG, and JPEG |
| Local storage | Implemented through local data directories and SQLite |
| Document parsing | Implemented for TXT and PDF; image OCR supported when Tesseract is installed |
| Text cleaning | Implemented with whitespace, null-character, and line normalisation |
| Chunking | Implemented with configurable chunk size and overlap |
| Vector retrieval | Designed with optional SentenceTransformers and FAISS, with lexical fallback |
| Natural language QA | Implemented through QA endpoint and chat UI |
| Source traceability | Implemented through structured citations |
| Basic web interface | Implemented with login, document management, and chat views |
| Error handling | Implemented for common upload, processing, OCR, and LLM failures |
| Authentication | Implemented with registration, login, bearer token, and ownership checks |
| Local-first privacy | Implemented for files, metadata, retrieval, and optional external generation |

The strongest outcome is the complete end-to-end flow. The user can
upload a document, have it processed, ask a question, and receive an
answer with citations. This directly demonstrates the viability of the
project concept.

## 5.3 Automated Verification

The project includes automated backend tests and frontend build checks.
The backend tests currently cover:

| Test area       | Evidence                                              |
|-----------------|-------------------------------------------------------|
| Authentication  | Register, login, token use, and current-user endpoint |
| Text processing | TXT processing and cleaned text output                |
| Chunking        | Chunk creation with document and page metadata        |
| Document upload | Uploading a text file and receiving indexed status    |
| QA fallback     | Asking a question and receiving answer plus citations |

The latest verification results were:

| Check                                    | Result         |
|------------------------------------------|----------------|
| Backend pytest suite                     | 3 tests passed |
| Backend static check                     | Passed         |
| Frontend TypeScript and production build | Passed         |

These tests do not prove full correctness, but they provide evidence
that the main workflow and build process are stable.

## 5.4 Functional Strengths

The main functional strength is the complete proof-of-concept workflow. The system does not stop at isolated parsing, retrieval, or UI modules; it connects registration, upload, processing, question answering, and citation display in one usable application. Citation support is also a strong outcome because users can inspect document names, pages, previews, and scores instead of trusting an unsupported answer. The local-first design and fallback behaviour make the system demonstrable even when cloud storage, LLM credentials, or optional semantic retrieval dependencies are unavailable.

## 5.5 Technical Strengths

Technically, the system benefits from modular backend services, focused frontend components, explicit API responses, SQLite persistence, and a narrow configuration model. FastAPI provides request validation and API documentation, while TypeScript improves the frontend contract. The retrieval design is realistic for a coursework environment because it supports semantic retrieval when dependencies are installed but preserves a lexical fallback for restricted machines.

## 5.6 Limitations

The first limitation is OCR dependency management. Image OCR requires
Tesseract to be installed separately and available on the system path.
If Tesseract is missing, image processing fails with a clear error. This
is acceptable for a proof-of-concept but should be improved in a
packaged product through installation checks or bundled setup guidance.

The second limitation is retrieval quality. The lexical fallback is
useful but cannot fully match semantic retrieval. It may retrieve chunks
with overlapping words rather than the truly most relevant meaning.
Installing the ML extra improves this, but a full evaluation would
require benchmark questions and relevance judgements.

The third limitation is synchronous processing. Upload processing
currently occurs during the request. This is simple, but large PDFs or
slow OCR could make the user wait. A production-ready design should use
background jobs and progress updates.

The fourth limitation is document viewing. The frontend displays
citation previews but does not yet provide an integrated PDF or image
viewer that jumps directly to the cited page. This limits source
verification convenience.

The fifth limitation is security depth. The system has basic
authentication and local user separation, but it does not implement
encrypted local storage, role-based access control, refresh tokens,
audit logs, or hardened production deployment settings.

The sixth limitation is evaluation scope. Automated tests validate basic
behaviour, but broader user testing and retrieval quality measurement
have not yet been performed.

## 5.7 Outcome Against Course Objectives

The project demonstrates software-centric system creation through a
working full-stack application. It applies current software design
practices such as layered architecture, API contracts, component-based
frontend design, local-first data handling, and retrieval-augmented
generation. It also demonstrates project management and teamwork
principles through the structured repository, milestones, and separation
of responsibilities.

The proof-of-concept is technically credible. It implements the central
features from the proposal and leaves realistic paths for extension. The
final design is aligned with the course objective of building a
software-centric system rather than merely describing one.

## 5.8 Reflection on Project Process

The main lesson from the project process is that integration risk should
be addressed early. In a RAG system, document parsing, retrieval, prompt
construction, LLM calls, and frontend display all depend on each other.
Waiting too long to integrate these parts would make late-stage
debugging difficult. Building a minimal end-to-end path early made later
changes safer.

A second lesson is that local-first systems still have external
dependency risks. Even if documents are local, OCR engines, model APIs,
and machine learning packages can introduce setup complexity. The
project addressed this through fallback paths and clear error messages.

A third lesson is that configuration simplicity matters. The
intermediate API gateway configuration introduced uncertainty around
base URLs and model names. Moving to DeepSeek official API variables
made the system easier to explain and operate.

A fourth lesson is that citations need to be designed from the
beginning. If page and document metadata are not preserved through
chunking and retrieval, source attribution becomes difficult later. The
implemented data model preserved this metadata early.

## 5.9 Evaluation of Non-Functional Qualities

Usability is supported by focused document and chat screens, visible processing states, and expandable citations, although the absence of an integrated PDF/image viewer still limits source verification. Maintainability is supported by separation between routers, services, models, API client code, and UI components. Privacy is supported by local file storage, local retrieval, and controlled external transmission of only selected chunks when DeepSeek is configured.

Reliability is supported by explicit error states and fallback paths for missing API keys, unsupported formats, OCR failures, and LLM failures. Performance is adequate for small proof-of-concept datasets, but synchronous processing and fallback scanning would need background jobs and persistent vector indexes for larger collections. Portability is reasonable because the system uses common web and local database technologies, but Tesseract and optional ML packages remain system-level dependencies.

## 5.10 Risk Analysis

The main technical risks are dependency availability, retrieval accuracy, and LLM reliability. OCR depends on Tesseract, semantic retrieval depends on optional machine learning packages, and generated answers can still be incomplete or phrased inaccurately. The project mitigates these risks through clear errors, fallback retrieval, conservative prompts, and visible citations.

There are also privacy and scope risks. Users may misunderstand local-first operation and assume that no content ever leaves the machine, even though selected chunks are sent to DeepSeek when an API key is configured. The system therefore needs clear documentation of data flow. Scope expansion is another risk because document viewers, knowledge graphs, collaboration, mobile apps, and cloud deployment are attractive but outside the approved project scope.

## 5.11 Ethical and Professional Considerations

The system handles personal documents, so transparency and user control are essential. Original files remain local, retrieval runs locally, and external generation is optional. When DeepSeek is enabled, only retrieved excerpts are sent, but those excerpts may still contain sensitive content. Users should therefore understand the data flow before enabling generated answers.

The system should also avoid overstating reliability. Generated answers are helpful but not authoritative, especially for academic, medical, legal, or financial documents. Citations and source previews are included so users can verify important claims.

## 5.12 Overall Outcome

Overall, the project achieved its main objective. It produced a working
local-first multimodal personal knowledge base QA proof-of-concept. The
system is coherent, demonstrable, and aligned with the proposed scope.
It implements document upload, local processing, chunking, retrieval,
answer generation, and citation display.

The project also demonstrates design maturity. It includes fallback
paths, clear status values, modular services, typed frontend API calls,
and documentation. It does not hide limitations. Instead, it makes them
explicit and identifies realistic future improvements.

The final outcome is therefore successful for the intended assessment
context. It is not a finished product, but it is a strong foundation for
continued development and a credible demonstration of software design
and implementation capability.

# 6. Conclusion and Future Work

## 6.1 Conclusion

The Multimodal Personal Knowledge Base Question Answering System
successfully demonstrates the proposed local-first RAG workflow. It
allows users to upload personal documents, process them locally,
retrieve relevant chunks, ask natural language questions, and view
answers with citations. The implementation uses a clear layered
architecture, separates frontend and backend responsibilities, stores
data locally, and integrates DeepSeek official API for generated answers
when configured.

The system is not a complete commercial knowledge management product,
but it is a credible proof-of-concept. It implements the core
functionality from the proposal and aligns with the course requirement
to demonstrate software design and implementation capability. Its
strongest features are the end-to-end workflow, local-first data
handling, structured citations, modular backend services, and graceful
fallback behaviour.

The project also reveals realistic limitations. OCR depends on external
installation, retrieval quality needs broader evaluation, large document
processing should move to background jobs, and source verification would
benefit from richer document viewers. These limitations do not undermine
the proof-of-concept; rather, they identify clear next steps.

## 6.2 Future Work

Future work should focus on realistic improvements that extend the current design rather than changing its scope. The first priority is background processing, so large PDFs and OCR-heavy images do not block upload requests. The second is a richer citation viewer that opens the exact PDF page or image region associated with a citation. The third is stronger retrieval, including full semantic setup, hybrid lexical-semantic ranking, reranking, and benchmark question sets.

Further extensions include encrypted local storage, broader file support for Markdown, DOCX, PPTX, CSV, and HTML, improved prompt templates for study summaries or document comparison, representative usability testing, and a packaged launcher for non-technical users. These improvements follow naturally from the current proof-of-concept while preserving the local-first principle.
