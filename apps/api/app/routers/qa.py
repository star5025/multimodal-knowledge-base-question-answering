from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.security import get_current_user
from app.db.models import User
from app.db.session import get_session
from app.schemas.qa import QueryRequest, QueryResponse
from app.services.rag_service import answer_question


router = APIRouter(prefix="/qa", tags=["qa"])


@router.post("/query", response_model=QueryResponse)
async def query(payload: QueryRequest, user: User = Depends(get_current_user), session: Session = Depends(get_session)) -> dict:
    return await answer_question(session, user, payload.question, payload.top_k)
