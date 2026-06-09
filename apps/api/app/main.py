from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.db.session import create_db_and_tables
from app.routers import auth, documents, qa


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_db_and_tables()
    yield


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content={"detail": "Internal server error", "error": str(exc)})


def health() -> dict:
    settings = get_settings()
    return {
        "status": "ok",
        "deepseek_configured": bool(settings.deepseek_api_key),
        "deepseek_endpoint": "https://api.deepseek.com/chat/completions",
        "deepseek_model": settings.deepseek_model,
    }


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title="Multimodal Personal Knowledge Base QA",
        description="Local-first document ingestion, retrieval, and question answering API.",
        version="0.1.0",
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.add_exception_handler(Exception, unhandled_exception_handler)
    application.add_api_route("/health", health, methods=["GET"])
    application.include_router(auth.router)
    application.include_router(documents.router)
    application.include_router(qa.router)
    return application


app = create_app()
