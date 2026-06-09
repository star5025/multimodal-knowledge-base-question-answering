---
title: "Final Report: Multimodal Personal Knowledge Base Question Answering System"
author: "JC3506 Software Design and Implementation Group Project"
date: "2026-05-27 17:55"
---

# Final Report: Multimodal Personal Knowledge Base Question Answering System

**Course:** JC3506 Software Design and Implementation  
**Assessment component:** Final Report  
**Project:** Multimodal Personal Knowledge Base Question Answering System  
**Group:** [Insert group number]  
**Team members:** [Insert team member names]  
**Generated timestamp:** 2026-05-27 17:55  
**Submission date:** [Insert submission date]

## Executive Summary

This report presents the design, implementation, development process, and evaluation of a multimodal personal knowledge base question answering system. The project addresses a practical problem faced by students, researchers, and privacy-conscious users: useful personal knowledge is often scattered across PDF files, scanned images, screenshots, notes, and plain text documents, while ordinary file systems provide only limited search and organisation. Users may remember that a concept exists somewhere in their materials, but locating the relevant page or passage can be slow and unreliable.

The implemented system is a local-first web application. It allows a user to register, log in, upload documents, extract text from supported files, create searchable chunks, retrieve relevant evidence, ask natural-language questions, and view answers with citations. The backend is implemented with FastAPI, SQLite, and service-oriented Python modules. The frontend is implemented with React, Vite, and TypeScript. The retrieval pipeline is designed around local processing and local storage, with optional semantic retrieval using SentenceTransformers and FAISS. Answer generation can use the official DeepSeek API when a key is configured. If no external model is available, the system still returns an extractive fallback answer based on the retrieved chunks, so the core workflow remains demonstrable.

The project evolved from a broad proposal into a working proof of concept. The final system does not attempt to be a production cloud platform. Instead, it focuses on the core software design challenge: connecting document ingestion, parsing, indexing, retrieval, answer generation, authentication, and a usable browser interface into one coherent application. Evaluation shows that the system meets the main project objectives, while also revealing realistic limitations around OCR setup, large dependency size, retrieval quality, background processing, and broader user testing.

# 1. Introduction and System Overview

## 1.1 Problem Being Addressed

Modern learning and professional work produce a growing amount of personal knowledge. A single user may accumulate lecture slides, journal papers, scanned handouts, project specifications, meeting notes, screenshots, manuals, and personal summaries. These files often contain valuable information, but the value is reduced when the user cannot quickly find the relevant part. Standard file systems offer folders, filenames, modification dates, and sometimes basic full-text search. They do not normally support questions such as “Which document explains retrieval augmented generation?”, “Where did I save the privacy requirement?”, or “Which page discusses evaluation criteria?”.

The problem becomes harder when documents are multimodal. A PDF may contain embedded text, scanned pages, diagrams, tables, and references. An image may contain printed text or a photographed note. A user may not remember whether a fact came from a PDF, a screenshot, or a text note. Keyword search is also limited because the user's question may use different wording from the original document. For example, a user may ask about “local data protection” while the document uses the phrase “privacy-preserving local storage”. This creates a need for a system that can extract information from heterogeneous files, organise it into searchable units, retrieve the most relevant content, and produce an answer grounded in the user's own documents.

Privacy is another important concern. Many existing AI knowledge tools require users to upload source documents to a cloud service. This may be acceptable for public information, but it is less appropriate for private notes, coursework, research drafts, financial records, or sensitive personal files. The project therefore adopts a local-first approach. Original files, extracted text, metadata, and retrieval indexes are stored locally. Only a small set of selected evidence chunks is sent to the external language model, and only when the user explicitly configures an API key.

## 1.2 Project Aim and Objectives

The aim of the project is to build a proof-of-concept multimodal personal knowledge base question answering system that demonstrates the complete flow from document upload to cited answer. The system is intended to be understandable, demonstrable, and extensible rather than feature-complete at commercial scale.

The main objectives are:

1. Provide a web interface for user login, document upload, document management, and question answering.
2. Store user documents and metadata locally to support privacy and repeatable local demonstrations.
3. Extract text from plain text files, PDFs, and images where possible.
4. Split extracted text into chunks that can be retrieved and cited.
5. Support local retrieval of relevant chunks for a user question.
6. Generate answers using a configurable DeepSeek model when available.
7. Provide a fallback answer based on retrieved chunks when no external model is configured.
8. Display citations including document name, page number, text preview, and relevance score.
9. Keep the architecture modular so that parsing, retrieval, generation, and user interface work can evolve independently.

These objectives align with the assessment expectation that the final report should cover the problem, design, implementation, development process, evaluation, and future work of the whole project.

## 1.3 Target Users and Operating Context

The target users are individuals who maintain collections of learning or work materials and want to ask questions about them without uploading the full collection to a third-party knowledge platform. The most direct users are students revising course materials, researchers reading papers, and developers or analysts managing project notes. The operating context is a local machine used for coursework demonstration. The user runs a backend server, runs a frontend development server or production build, opens the browser interface, and interacts with the application locally.

Because the system is intended for a course project, the design favours clear behaviour over advanced infrastructure. It does not assume distributed deployment, multiple servers, cloud object storage, or enterprise identity management. It uses local file storage for uploaded documents, SQLite for metadata, and a simple API boundary between frontend and backend. This makes the system easier to inspect, run, and evaluate.

## 1.4 Resulting System Overview

The implemented system contains two main applications: a backend API and a frontend web interface. The backend exposes endpoints for health checks, authentication, document management, and question answering. It manages user records, password hashing, JWT-based access control, file storage, document status, text extraction, chunk creation, retrieval, and answer generation. The frontend provides the user-facing workflow: login, document upload, document list, document status display, reprocessing, deletion, chat input, answer output, and citation display.

The main user workflow is:

1. A user registers or logs in.
2. The user uploads a PDF, text file, or image.
3. The backend stores the file locally and records document metadata.
4. The backend extracts text, cleans it, creates chunks, and stores chunk metadata.
5. The user asks a question in the chat interface.
6. The backend retrieves the most relevant chunks belonging to that user.
7. The backend sends the question and selected chunks to DeepSeek if an API key is configured.
8. The backend returns an answer and citations.
9. The frontend displays the answer, source files, page numbers, previews, and scores.

This workflow demonstrates the central concept of retrieval augmented generation: the answer should be grounded in retrieved evidence rather than produced only from the model's general knowledge. The citation display is therefore not an optional decoration. It is a core feature because it allows the user to inspect where an answer came from and decide whether it should be trusted.

## 1.5 Scope

The project scope is deliberately limited to a proof-of-concept system. The implemented application supports the main flow required for a demonstration, but it does not include every feature expected in a production knowledge management system.

In scope:

1. Local web application with separate frontend and backend.
2. Authentication for separating user-owned documents.
3. Upload and management of supported document types.
4. Text extraction from TXT, PDF, PNG, JPG, and JPEG inputs.
5. Chunking with metadata for document id, page, chunk index, and text.
6. Local retrieval and citation generation.
7. Optional DeepSeek answer generation with fallback behaviour.
8. Basic automated backend tests and frontend build verification.

Out of scope:

1. Cloud deployment and public multi-tenant hosting.
2. Full document viewer with highlighted citation locations.
3. Enterprise permission models and organisation-level sharing.
4. Advanced OCR quality improvement and handwritten text recognition.
5. Large-scale performance optimisation for very large document collections.
6. Full user study with statistically meaningful results.

# 2. System Design

## 2.1 Design Goals

The system design was guided by five goals. First, the system should be local-first. The original documents should remain on the user's machine, and the system should still be useful when no external language model is available. Second, the system should be modular. Document parsing, chunking, retrieval, generation, authentication, and presentation should be separated so that one area can be improved without rewriting the whole application. Third, the system should be transparent. Answers should include citations, and document states should be visible. Fourth, the system should be simple enough to run in a course environment. The chosen architecture should avoid unnecessary infrastructure. Fifth, the system should be extensible. The proof of concept should leave clear routes for adding background workers, more document formats, better ranking, and a richer viewer.

These goals led to a client-server architecture. The frontend is responsible for interaction and presentation. The backend is responsible for trusted data operations, document processing, retrieval, and communication with the language model. The database stores structured metadata. The file system stores uploaded documents and derived local artefacts.

## 2.2 High-Level Architecture

The repository is organised as a small monorepo. The web application lives under `apps/web`, the backend lives under `apps/api`, and local runtime data lives under `data`. Documentation and reports live under `docs`.

```text
multimodal-kb-qa
  apps/
    web/        React + Vite + TypeScript frontend
    api/        FastAPI backend and services
  data/
    uploads/    local uploaded files
    extracted/  extracted text cache
    indexes/    local retrieval indexes
  docs/         architecture, API contract, and reports
  tools/        utility scripts
```

At runtime, the browser communicates with the FastAPI backend through HTTP. The backend reads and writes SQLite records, stores files under the local data directory, processes documents through service modules, retrieves chunks, and optionally calls the DeepSeek API for generation. The design keeps the public interface small and stable:

| Area | Responsibility |
| --- | --- |
| Frontend | User workflow, upload controls, document list, chat interface, citation display |
| API routers | HTTP endpoints, request validation, authentication dependency, response format |
| Services | Storage, document processing, chunking, retrieval, LLM calls, RAG orchestration |
| Database | Users, documents, chunks, statuses, ownership metadata |
| Local data folders | Uploaded originals, extracted text, indexes, runtime artefacts |
| External LLM | Optional answer generation from selected retrieved chunks |

This separation reduces coupling. For example, the frontend does not need to know whether retrieval uses FAISS or a fallback lexical method. It only calls `POST /qa/query` and renders the answer and citations returned by the backend.

## 2.3 Backend Component Design

The backend is divided into routers, core configuration, database models, and services. The routers define the public API. The services implement business behaviour. This design keeps endpoint functions short and makes the processing pipeline easier to test.

The main backend components are:

| Component | Responsibility |
| --- | --- |
| `main.py` | Creates the FastAPI application, configures CORS, includes routers, and exposes health checks |
| `core/config.py` | Loads environment variables such as database path, data directory, JWT settings, and DeepSeek settings |
| `core/security.py` | Handles password hashing, token creation, and token verification |
| `db/models.py` | Defines SQLModel entities for users, documents, and chunks |
| `db/session.py` | Creates the SQLite engine and database sessions |
| `routers/auth.py` | Implements registration, login, and current-user lookup |
| `routers/documents.py` | Implements upload, list, detail, delete, and reprocess endpoints |
| `routers/qa.py` | Implements the question answering endpoint |
| `services/storage_service.py` | Saves uploaded files and resolves local file paths |
| `services/document_processor.py` | Extracts text from supported file formats |
| `services/chunking_service.py` | Cleans and splits extracted text into chunks |
| `services/vector_service.py` | Stores chunk metadata and retrieves relevant chunks |
| `services/llm_service.py` | Calls the DeepSeek chat completion API when configured |
| `services/rag_service.py` | Coordinates retrieval, prompt construction, answer generation, and fallback responses |

The service-oriented design provides a clear responsibility boundary. If PDF extraction fails, the issue belongs to the processor. If answer quality is weak, the retrieval and RAG services can be improved without changing authentication or document upload. If the frontend changes its layout, the backend contract can remain unchanged.

## 2.4 Frontend Component Design

The frontend is a React application with pages and reusable components. It is intentionally simple because the main value of the project is the document-to-answer workflow. The interface avoids a marketing-style landing page and opens directly into functional screens.

The main frontend parts are:

| Component or page | Responsibility |
| --- | --- |
| `LoginPage` | User login and registration flow |
| `DocumentsPage` | Upload, search, document list, status display, reprocess, and delete actions |
| `ChatPage` | Main question answering screen |
| `UploadPanel` | File selection, format validation, and upload state |
| `DocumentTable` | Document rows, status badges, actions, and search results |
| `ChatWindow` | Message list, input box, loading state, and error display |
| `CitationList` | Citation cards showing file name, page, preview, and score |
| `lib/api.ts` | Centralised API calls and TypeScript types |

This structure keeps feature areas separated. The document management page can evolve independently from the chat page, while both share the same API client layer and authentication state. The citation list is a separate component because citation rendering is central to trust and can later be extended into source preview or document highlighting.

## 2.5 Key Interactions

The upload interaction begins when the user chooses a supported file and submits it. The frontend sends a multipart request to the backend. The backend authenticates the user, saves the original file, creates a document record, and runs processing. During processing, the document status moves through the defined states: `uploaded`, `processing`, `indexed`, and `failed`. If extraction and chunking succeed, chunks are stored and the document becomes searchable. If any processing step fails, the document is marked as failed and an error message is stored so the frontend can display a readable failure.

The question answering interaction begins when the user submits a question and an optional `top_k` value. The backend authenticates the user, retrieves relevant chunks only from that user's documents, constructs citations, and asks the RAG service to generate an answer. If DeepSeek is configured and the request succeeds, the generated answer is returned. If the model is unavailable, the backend returns a fallback answer assembled from the most relevant local chunks. In both cases, citations are returned with the same shape, so the frontend does not need two separate rendering paths.

## 2.6 API Contract

The public API was kept intentionally small:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Check backend availability |
| `POST` | `/auth/register` | Create a user account |
| `POST` | `/auth/login` | Authenticate and return a bearer token |
| `GET` | `/auth/me` | Return the current authenticated user |
| `POST` | `/documents/upload` | Upload and process a document |
| `GET` | `/documents` | List the user's documents |
| `GET` | `/documents/{document_id}` | Get one document |
| `DELETE` | `/documents/{document_id}` | Delete one document |
| `POST` | `/documents/{document_id}/reprocess` | Re-run processing for one document |
| `POST` | `/qa/query` | Ask a question and return an answer with citations |

The QA response contains an answer and a list of citations. Each citation includes document id, document name, page, chunk id, text preview, and score. This stable response shape makes the frontend predictable and supports future features such as opening a document viewer at the cited page.

## 2.7 Privacy, Security, and Design Rationale

Privacy is addressed primarily through local storage and limited external disclosure. Uploaded files are stored under the local data directory and are ignored by Git. Extracted text and indexes are also local runtime artefacts. The external model receives only selected retrieved chunks, not the whole document collection. This design does not remove all privacy risk, because retrieved text can still contain sensitive information, but it significantly narrows what is sent outside the machine.

Security is addressed through password hashing, JWT bearer tokens, route-level authentication dependencies, and ownership checks on document and QA operations. Each document belongs to a user, and retrieval is scoped to that user's documents. This is important because even a local demonstration application should not expose one user's uploaded material to another account.

The architecture uses FastAPI because it provides a clear typed API, automatic request validation, and interactive documentation. SQLite is used because it is simple, local, and sufficient for the proof of concept. React and TypeScript are used because they support a maintainable interactive frontend. The local-first design also supports the course setting: evaluators can run the system without cloud infrastructure.

An important design decision was to make document status explicit rather than treating processing as an invisible internal action. The four status values, `uploaded`, `processing`, `indexed`, and `failed`, give both the frontend and the user a shared vocabulary for what has happened. This is especially useful because document processing is less predictable than ordinary form submission. A text file may finish immediately, a PDF may take longer, and an image may fail if OCR is not installed. Explicit status values make these differences understandable and reduce ambiguity during testing.

Another important decision was to keep citations as structured data. A less disciplined design could ask the model to include file names in the answer text, but that would make citation quality dependent on the model's formatting. The implemented design keeps citation metadata outside the free-form answer. This is more reliable for the frontend and prepares the system for later features such as source opening, filtering by document, or citation highlighting.

# 3. Implementation

## 3.1 Technology Stack

The implementation uses a practical stack selected for clarity, local execution, and compatibility with the project goals.

| Layer | Technology | Reason |
| --- | --- | --- |
| Frontend | React, Vite, TypeScript | Fast development, typed UI code, simple local build |
| Backend | FastAPI, Python | Typed API layer, good support for file uploads and service modules |
| Database | SQLite with SQLModel | Local persistence with typed models and minimal setup |
| Authentication | Password hashing and JWT | Standard approach for protected API routes |
| PDF processing | PyMuPDF | Reliable extraction from text-based PDFs |
| Image OCR | pytesseract and Tesseract | Common local OCR toolchain for image text extraction |
| Chunking | Custom service | Keeps chunk metadata aligned with project citation requirements |
| Retrieval | Local chunk retrieval, optional SentenceTransformers and FAISS path | Enables demonstration even when heavy ML dependencies are unavailable |
| LLM generation | Official DeepSeek API | Configurable external generation without sending original documents |
| Testing | Pytest and frontend build check | Verifies backend behaviour and frontend compile correctness |

The stack reflects the proof-of-concept goal. It avoids heavyweight deployment infrastructure and keeps most behaviour inspectable in the repository. It also allows fallback modes, which was important during implementation because OCR engines, embedding models, and network access can vary between machines.

## 3.2 Repository and Configuration

The repository is organised around application boundaries rather than technical layers only. Backend code is under `apps/api`, frontend code is under `apps/web`, and local runtime data is under `data`. This keeps the project easy to navigate and supports parallel development.

Configuration is loaded from environment variables. The most important runtime variables are the database URL, data directory, JWT secret, token expiry, CORS origins, `DEEPSEEK_API_KEY`, and `DEEPSEEK_MODEL`. The DeepSeek key is intentionally optional. If it is not set, the system still runs and produces fallback answers. This makes the demonstration more robust and avoids blocking every feature on an external account.

The `.env.example` file documents the expected variables without requiring secrets to be committed. Local `.env` files are ignored by Git. Uploaded documents, extracted text, indexes, and local database files are also ignored because they are runtime data rather than source artefacts.

## 3.3 Backend Implementation

The backend implementation follows a layered structure. API routers validate requests and handle HTTP-level concerns. Service modules implement the actual work. Database models represent persistent data.

Authentication starts with registration. A user submits an email and password. The backend validates uniqueness, hashes the password, and stores the user. During login, the backend verifies the password and returns a JWT bearer token. Protected routes use a dependency that validates the token and loads the current user. This keeps authentication logic consistent across document and QA endpoints.

Document upload accepts multipart files. The backend saves the original file to local storage, creates a document record, and processes the file. The document status provides a simple state machine. A new document begins as `uploaded`, changes to `processing`, becomes `indexed` when chunks are available, and becomes `failed` if extraction or indexing fails. This status model is visible in the frontend and is also useful for debugging.

The document processing service selects extraction behaviour based on file type. Plain text files are decoded and normalised. PDFs are processed page by page using PyMuPDF so page metadata can be preserved. Images are passed through Tesseract OCR if the engine is installed. If OCR is not available, the service returns a clear error rather than failing silently. Preserving page numbers is important because citations should guide the user back to a source location.

The chunking service cleans text and splits it into overlapping chunks. The overlap reduces the chance that an important sentence is split away from its context. Each chunk stores document id, page number, chunk index, and text. This metadata makes retrieval results explainable and allows the answer to include useful citations.

The vector and retrieval service is responsible for storing chunks and finding relevant ones. The architecture supports semantic embeddings and FAISS, while the proof-of-concept implementation also supports a local fallback retrieval path. This is a practical choice because embedding model downloads can be large and may not always be available during evaluation. The fallback still demonstrates the full question-answer-citation loop.

The RAG service coordinates retrieval and answer generation. It retrieves top chunks, formats them as evidence, constructs a prompt, calls the DeepSeek service when possible, and packages the final answer with citations. The fallback answer uses the retrieved chunks directly and clearly states that no external LLM answer was generated. This behaviour is important because it prevents the user interface from appearing broken when the API key is missing.

The backend also keeps ownership checks close to the data operations that require them. Listing documents, reading one document, deleting a document, reprocessing, and question answering all depend on the authenticated user. This prevents accidental cross-user access and makes the behaviour easier to reason about. Even though the project is primarily a local demonstration, implementing ownership correctly is part of good system design because it prevents the proof of concept from relying on unsafe assumptions.

## 3.4 Frontend Implementation

The frontend implements the main user workflows with separate pages and components. The login page supports registration and login. The application stores the returned token and uses it for authenticated API requests. Error states are shown to the user rather than hidden in the console.

The documents page provides file selection, upload submission, format checks, document list display, search by name, status badges, delete actions, and reprocess actions. Status badges make the processing pipeline visible. For example, a failed OCR document should not look identical to an indexed document. This helps the user understand whether a file is ready for QA.

The chat page provides a question input, loading state, answer display, and citations. Citations show the source document name, page number, preview, and score. The citation component is designed so that future work can add expansion, source opening, or document highlighting without changing the QA endpoint.

The frontend API client centralises request logic and response types. This reduces duplication and makes it easier to keep the frontend aligned with the backend contract. TypeScript is useful here because the QA response has a structured shape and should be rendered consistently.

The visual design is intentionally restrained. The system is an operational tool rather than a marketing website. The interface prioritises upload, status scanning, question input, and citation reading. This matches the needs of a course demonstration: evaluators should be able to understand and use the system quickly.

The frontend also reflects the system's reliability goals. Long-running or failure-prone operations are given visible UI states. Uploads show progress or completion feedback. Documents show whether they are indexed or failed. QA requests show loading and error states. These behaviours are simple, but they are important because a retrieval and generation application can otherwise appear mysterious: the user may not know whether the system is thinking, broken, waiting for the network, or missing data.

## 3.5 RAG Prompt and Answer Generation

The generation prompt is designed to force grounding in retrieved evidence. The backend passes the user's question and a numbered list of retrieved chunks to the model. The model is instructed to answer using the provided context and to avoid unsupported claims. Citations are handled structurally by the backend response rather than relying only on the model to produce source labels in free text.

This design has two benefits. First, it reduces hallucination risk because the model is given a narrow context. Second, it separates answer text from citation metadata. The frontend can render citations reliably even if the model's wording changes. The model's job is to write a useful answer; the backend's job is to preserve traceability.

When the DeepSeek API is unavailable, the fallback answer is not presented as a model-generated conclusion. It explicitly explains that no external LLM answer was generated and then lists the most relevant chunks. This keeps the system honest and preserves useful behaviour.

The prompt design is intentionally conservative. It does not ask the model to invent missing information, infer hidden context, or answer from general knowledge when the retrieved passages are insufficient. This choice may make some answers shorter, but it better matches the purpose of a personal knowledge base. The user is normally asking what their own documents say, not requesting a general internet-style explanation.

## 3.6 Error Handling and User Feedback

The system handles errors at several levels. Backend validation errors are returned as readable API responses. Authentication failures return appropriate status codes. Document processing errors are stored on the document record and shown through the document status. OCR-related failures are especially important because Tesseract is an external system dependency; the user should know whether the problem is an unsupported image, a missing OCR engine, or another processing error.

The frontend displays loading states during upload and QA requests. It also shows failures for login, upload, deletion, reprocessing, and question answering. This is necessary because many operations can take longer than ordinary UI actions, especially PDF extraction and model calls.

## 3.7 Application of Design Principles

Several software design principles shaped the implementation. Separation of concerns is visible in the router-service-database split. Information hiding is visible in the frontend's use of API functions rather than direct knowledge of backend internals. Single responsibility is visible in services such as storage, chunking, and LLM calls. Progressive enhancement is visible in the optional external LLM and optional semantic retrieval path. Fail-safe behaviour is visible in the fallback answer path.

The project also uses a stable contract approach. The frontend depends on endpoint shapes and response types, not on how retrieval is implemented. This allows future backend improvements without forcing large frontend changes. Similarly, document processing can add more formats without changing the QA page.

## 3.8 Significant Technical Challenges

The first challenge was multimodal extraction. Text files are simple, but PDFs and images are not. PDF pages can contain selectable text, scanned images, or a mixture. Image OCR depends on an installed external engine. The implementation addresses this by using clear processing paths and explicit failure states.

The second challenge was balancing local-first behaviour with LLM generation. Sending whole documents to a model would be easier, but it would contradict the privacy goal. The final design sends only retrieved chunks, which is more controlled and also more efficient.

The third challenge was keeping the demonstration robust. External APIs can fail, keys can be missing, and machine learning packages can be heavy. The fallback retrieval and answer path ensures that the application still demonstrates the core concept even in a restricted environment.

The fourth challenge was preserving citations. A QA system without citations may sound useful but is hard to trust. The implementation therefore carries document name, page, chunk id, preview, and score through the pipeline. This requires more careful data modelling than simply sending text to a model and displaying a response.

## 3.9 Testing and Operation

Backend tests cover authentication, upload behaviour, processing, chunking, and QA fallback behaviour. These tests focus on the most important risks: protected endpoints should require authentication, uploaded files should produce records, processing should create usable chunks, and QA should still work without an external model.

Frontend verification includes a production build check. This confirms that TypeScript types, imports, and component integration compile successfully. Manual checks remain important for the browser workflow because upload, document state, and chat behaviour are interactive.

The system is operated locally. The backend is started from the API directory, and the frontend is started from the web directory. The user opens the frontend URL in a browser, registers or logs in, uploads documents, and asks questions. For generated answers, the user configures `DEEPSEEK_API_KEY` in the local environment. Without the key, the fallback mode still works.

# 4. Development Process

## 4.1 Development Approach

The project followed an iterative proof-of-concept approach. The first priority was to create a coherent architecture and stable API contract. The second priority was to implement vertical slices of functionality: authentication, upload, processing, retrieval, QA, and frontend display. The final priority was integration, testing, documentation, and report preparation.

This approach was appropriate because the system crosses several technical areas. A purely frontend-first or backend-first process would have delayed integration risks. By defining the API contract early and building features around it, the project could progress in parallel while still converging into one application.

## 4.2 Iteration Strategy

The work was organised into milestones:

| Milestone | Main outcome |
| --- | --- |
| Architecture setup | Monorepo structure, dependency files, environment template, API contract, documentation skeleton |
| Backend foundation | FastAPI app, configuration, database setup, authentication, protected routes |
| Document management | Upload, storage, metadata, document status, list, delete, and reprocess endpoints |
| Processing pipeline | Text extraction for supported formats, chunk creation, page metadata preservation |
| QA pipeline | Retrieval, prompt construction, DeepSeek integration, fallback response, citations |
| Frontend workflow | Login, document management page, chat page, citation display |
| Integration and testing | Backend tests, frontend build, documentation, report preparation |

Each milestone produced a working increment. This reduced the risk of discovering integration issues only at the end. It also made the system easier to demonstrate throughout development.

## 4.3 Adaptations During Development

Several adaptations were made as implementation progressed. The first was the decision to keep fallback behaviour as a first-class path rather than a temporary debugging aid. This was necessary because external LLM configuration should improve the system but should not be required for every demonstration.

The second adaptation was to simplify model configuration to the official DeepSeek API. Earlier plans allowed a more general OpenAI-compatible configuration. That flexibility added confusion during setup. The final project uses explicit `DEEPSEEK_API_KEY` and `DEEPSEEK_MODEL` variables. This is easier for a user to understand and reduces configuration mistakes.

The third adaptation was to keep runtime artefacts out of source control. Uploaded documents, indexes, extracted text, and local database files can contain personal information or machine-specific state. Keeping them ignored by Git supports the local-first privacy goal.

The fourth adaptation was to prioritise visible status and citations. A technically working pipeline is not enough if the user cannot tell whether a document has failed or where an answer came from. The frontend therefore exposes document status and citation details.

These adaptations show that the project process was not only a matter of implementing the initial plan. Some design choices became clearer after the team saw the system running. In particular, configuration simplicity, failure visibility, and citation traceability became more important once the frontend and backend were connected. This is a common characteristic of software design: requirements that look secondary in a proposal may become central when users interact with a working system.

## 4.4 Teamwork and Role Reflection

The project can be divided naturally into parallel roles: frontend document management, frontend chat, backend authentication, backend document storage, processing pipeline, retrieval and LLM integration, and integration testing. This decomposition matches the architecture and reduces conflict because each role has a clear boundary.

The most important collaboration mechanism is the API contract. Once endpoints, request shapes, response shapes, and document statuses are agreed, frontend and backend work can proceed independently. Documentation also supports collaboration because it records architectural decisions and expected behaviour.

A key lesson is that parallel development only works when the shared boundaries are stable. If the QA response shape changes frequently, the chat interface becomes fragile. If document status values are inconsistent, the document list becomes confusing. The project therefore benefits from fixed status values, typed API calls, and documented endpoint contracts.

## 4.5 Process Reflection

The development process was effective for a proof-of-concept system because it focused on end-to-end behaviour early. The most valuable progress came from connecting upload, processing, retrieval, and answer display into one flow. Once that path worked, individual parts could be improved without losing the whole system.

The main weakness of the process was that broader evaluation and user testing came late. Functional tests and build checks provide confidence in core behaviour, but they do not fully measure usability, answer quality, or performance on diverse documents. A future version should include a small evaluation dataset and structured user tasks earlier in the process.

# 5. Evaluation of Outcomes

## 5.1 Evaluation Approach

The system was evaluated against the original project objectives and the expected course report categories. The evaluation considered functional completeness, architecture quality, implementation quality, development process, limitations, and evidence from testing. Because this is a proof-of-concept project, the evaluation focuses on whether the system demonstrates the intended design and workflow rather than whether it is production-ready.

The main forms of evidence are:

1. Implemented endpoints and frontend workflows.
2. Local upload, processing, retrieval, and QA behaviour.
3. Document status and citation outputs.
4. Backend automated tests.
5. Frontend production build verification.
6. Clear documentation of limitations and future improvements.

## 5.2 Requirement Satisfaction

| Objective | Outcome |
| --- | --- |
| User authentication | Achieved through registration, login, bearer token, and protected routes |
| Local document upload | Achieved through backend storage and frontend upload UI |
| Supported file extraction | Achieved for TXT and PDF; image OCR works when Tesseract is installed |
| Chunking and metadata | Achieved through chunk service and SQLite chunk records |
| Retrieval | Achieved through local retrieval path with support for semantic retrieval architecture |
| External LLM generation | Achieved through DeepSeek configuration |
| Fallback without API key | Achieved through extractive answer using retrieved chunks |
| Citations | Achieved with document name, page, preview, chunk id, and score |
| Frontend usability | Achieved for core upload, document list, chat, and citation workflows |
| Testing | Achieved at proof-of-concept level with backend tests and frontend build check |

The core requirement was not merely to upload files or call a model. The important outcome was the complete chain from personal document to cited answer. That chain is implemented and demonstrable.

## 5.3 Verification Evidence

The backend tests verify important behaviours. Authentication tests check that users can register and log in and that protected routes require valid credentials. Upload tests check that files can be accepted and recorded. Processing and chunking tests check that text can be converted into retrievable chunks. QA fallback tests check that the system still responds when no external LLM key is configured.

Frontend build verification checks that the React application compiles successfully. This catches broken imports, type mismatches, and integration mistakes. It does not replace manual browser testing, but it provides a useful baseline.

Manual verification can follow a simple demonstration script:

1. Start the backend.
2. Start the frontend.
3. Register a user.
4. Upload a text file, PDF, and image.
5. Confirm that successful files become indexed and failed files show readable errors.
6. Ask a question related to the uploaded content.
7. Confirm that the answer includes citations.
8. Configure DeepSeek and repeat the question.
9. Remove or disable the key and confirm that fallback mode still answers from local chunks.

This script directly reflects the project objectives and provides evidence for both functionality and usability.

## 5.4 Strengths

The first strength is architectural clarity. The system has clear boundaries between frontend, backend, database, storage, processing, retrieval, and generation. This makes the project easier to understand and maintain.

The second strength is local-first operation. The system does not require source documents to be uploaded to a cloud knowledge base. Runtime data is local and ignored by source control. This matches the privacy motivation of the project.

The third strength is graceful degradation. A missing DeepSeek key does not break the whole application. The fallback answer path keeps the user workflow available and makes the system easier to demonstrate.

The fourth strength is citation visibility. The system does not simply display an answer. It also displays source information, which improves trust and supports verification.

The fifth strength is suitability for parallel development. The architecture maps naturally to independent work areas. This is useful for a group project because team members can own different layers without constant file conflicts.

## 5.5 Limitations

The most important limitation is OCR dependency. Image extraction depends on Tesseract being installed correctly on the machine. If it is missing, image processing fails. The system reports the failure, but the user must still install and configure OCR support.

The second limitation is retrieval quality. The fallback retrieval path is useful for robustness, but semantic embeddings and FAISS are expected to produce better results for paraphrased questions. In a constrained environment, the fallback may miss relevant chunks if wording differs significantly.

The third limitation is synchronous processing. Large PDFs or OCR-heavy files can take time. A production version should use background jobs and progress updates rather than tying processing closely to the request flow.

The fourth limitation is the lack of an integrated source viewer. Citations show file names, pages, previews, and scores, but the user cannot yet click into a rendered PDF page with highlighted text. This limits verification convenience.

The fifth limitation is evaluation scale. The system has been tested with representative scenarios, but it has not been evaluated on a large benchmark collection or through a structured user study.

## 5.6 Non-Functional Quality Evaluation

Maintainability is reasonably strong because the code is modular and the API contract is explicit. The backend service structure makes it possible to replace or improve individual processing stages. The frontend component structure separates document management from chat.

Usability is sufficient for a course demonstration. The main workflows are visible and direct. However, production usability would require better onboarding, progress indicators for long processing tasks, richer document previews, and clearer recovery suggestions.

Performance is acceptable for small to moderate local document sets. The design is not optimised for very large collections. Future improvements should include background processing, incremental indexing, better caching, and pagination.

Security is appropriate for a local proof of concept but not complete for a production deployment. Password hashing, JWT authentication, and ownership checks are implemented. Further work would be needed for rate limiting, audit logs, refresh token rotation, stronger secret management, and encrypted local storage.

Reliability is improved by fallback behaviour and readable failure states. However, external dependencies such as OCR and LLM APIs remain sources of failure. The system handles these failures in a demonstrable way, but production reliability would require monitoring and retry strategies.

## 5.7 Overall Outcome

The implemented system meets the central project goal: it demonstrates a working multimodal personal knowledge base QA pipeline. A user can upload supported documents, process them locally, ask questions, receive answers, and inspect citations. The design is coherent, modular, and aligned with the local-first motivation.

The project also achieved a useful balance between ambition and feasibility. It includes enough real functionality to be meaningful while avoiding excessive infrastructure that would not be necessary for a course proof of concept. The main remaining work concerns quality, scale, and user experience rather than the basic architecture.

From an educational perspective, the outcome is also valuable because it demonstrates multiple software design concerns in one coherent system. It includes user authentication, data ownership, file handling, external tool integration, service boundaries, typed frontend integration, error handling, and evaluation. The result is therefore not only a small AI demo, but also a realistic example of how modern application features must be connected through disciplined software structure.

# 6. Conclusion and Future Work

## 6.1 Conclusion

This project designed and implemented a local-first multimodal personal knowledge base question answering system. The problem addressed is practical: users often own many useful documents but lack an efficient way to ask natural-language questions across them while preserving privacy. The resulting system combines document upload, text extraction, chunking, retrieval, optional DeepSeek generation, fallback answering, and citation display in a working web application.

The main design insight is that a useful personal QA system must be both generative and verifiable. A fluent answer is not enough if the user cannot see where it came from. The system therefore treats citations as a core output. Another important insight is that robust local-first software should degrade gracefully. External language models improve answer quality, but the system should still demonstrate retrieval and evidence when the external model is unavailable.

The final implementation satisfies the main objectives of the project and provides a clear foundation for future development. It is not a finished commercial product, but it is a coherent proof of concept with meaningful architecture, working features, and documented limitations.

## 6.2 Future Work

Future work should focus on improvements that directly extend the current design. The first priority is a richer document viewer. Users should be able to click a citation and open the relevant PDF page or image region, ideally with highlighted text. This would make verification much faster.

The second priority is background processing. Uploading a large PDF or OCR-heavy image should create a job and return immediately. The frontend could then show progress, queued state, and completion status.

The third priority is stronger retrieval. Semantic embeddings, FAISS indexing, hybrid lexical-semantic search, and reranking could improve answer relevance. Evaluation with a small labelled dataset would help measure these improvements.

The fourth priority is better local privacy controls. Local database encryption, configurable data directories, and clearer controls for what text is sent to the external model would strengthen user trust.

The fifth priority is broader format support. DOCX, PPTX, Markdown, CSV, and HTML are realistic extensions for personal knowledge collections. Each format should preserve source metadata as much as possible.

The sixth priority is more systematic evaluation. A future iteration should include representative user tasks, answer quality scoring, retrieval accuracy checks, and usability feedback. This would move the project from a functional proof of concept toward a more mature personal knowledge tool.
