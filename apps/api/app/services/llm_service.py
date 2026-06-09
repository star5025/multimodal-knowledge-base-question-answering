from app.core.config import get_settings
from app.services.vector_service import RetrievalHit


DEEPSEEK_CHAT_COMPLETIONS_URL = "https://api.deepseek.com/chat/completions"


async def generate_llm_answer(question: str, hits: list[RetrievalHit]) -> tuple[str | None, str | None]:
    settings = get_settings()
    if not settings.deepseek_api_key:
        return None, "DEEPSEEK_API_KEY is not configured."

    try:
        import httpx
    except Exception as exc:
        return None, f"httpx is not installed: {exc}"

    context = "\n\n".join(
        f"[{index}] Source: {hit.document_name}, page {hit.page or 'N/A'}\n{hit.text}"
        for index, hit in enumerate(hits, start=1)
    )
    system_prompt = (
        "You answer questions using only the supplied local knowledge base excerpts. "
        "If the excerpts are insufficient, say what is missing. "
        "Cite sources inline with bracket numbers like [1]."
    )
    user_prompt = f"Question:\n{question}\n\nLocal excerpts:\n{context}"
    headers = {"Authorization": f"Bearer {settings.deepseek_api_key}", "Content-Type": "application/json"}
    payload = {
        "model": settings.deepseek_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "stream": False,
    }

    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(DEEPSEEK_CHAT_COMPLETIONS_URL, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip(), None
    except Exception as exc:
        return None, f"{type(exc).__name__}: {exc}"
