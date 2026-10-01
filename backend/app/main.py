import json
import time
from collections import defaultdict, deque

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel

from .config import settings
from .languages import LANGS
from .services import ctg, files, llm, speech

app = FastAPI(title="Bhasha API")
app.add_middleware(CORSMiddleware, allow_origins=settings.origins, allow_methods=["*"], allow_headers=["*"])

_hits: dict[str, deque] = defaultdict(deque)


@app.middleware("http")
async def rate_limit(request: Request, call_next):
    """Tiny per-IP limiter so a public backend can't burn your API credits."""
    if request.url.path.startswith("/api/") and request.method == "POST":
        ip = (request.headers.get("x-forwarded-for") or request.client.host or "?").split(",")[0].strip()
        q, now = _hits[ip], time.time()
        while q and now - q[0] > 60:
            q.popleft()
        if len(q) >= settings.rate_per_min:
            return Response("Too many requests, please wait a minute.", status_code=429)
        q.append(now)
    return await call_next(request)


@app.get("/health")
def health():
    return {"ok": True, "chittagonian_examples": len(ctg.index.df) if ctg.index.ready else 0,
            "provider": settings.provider,
            "llm": bool(settings.gemini_key if settings.provider == "gemini" else settings.anthropic_key), "voice_in": bool(settings.groq_key)}


@app.get("/api/languages")
def languages():
    return LANGS


@app.post("/api/chat")
async def chat(message: str = Form(""), history: str = Form("[]"), reply_lang: str = Form("auto"),
               attachments: list[UploadFile] = File(default=[])):
    if not message.strip() and not attachments:
        raise HTTPException(400, "Empty message.")
    try:
        hist = json.loads(history)
    except ValueError:
        hist = []
    blocks = await files.to_blocks(attachments)

    async def gen():
        try:
            async for piece in llm.stream_chat(message, hist, reply_lang, blocks):
                yield piece
        except HTTPException as e:
            yield f"\n\n⚠️ {e.detail}"
        except Exception as e:
            yield f"\n\n⚠️ AI request failed: {type(e).__name__}"

    return StreamingResponse(gen(), media_type="text/plain; charset=utf-8")


class TranslateIn(BaseModel):
    text: str
    source: str = "auto"
    target: str = "en"


@app.post("/api/translate")
async def translate(body: TranslateIn):
    if not body.text.strip():
        raise HTTPException(400, "Empty text.")
    return {"translation": await llm.translate(body.text[:6000], body.source, body.target)}


@app.post("/api/transcribe")
async def transcribe(audio: UploadFile = File(...), lang: str = Form("auto")):
    data = await audio.read()
    if len(data) > settings.max_file_bytes:
        raise HTTPException(413, "Audio too large.")
    return {"text": await speech.transcribe(data, audio.filename or "voice.webm", lang)}


class TtsIn(BaseModel):
    text: str
    lang: str | None = None


@app.post("/api/tts")
async def tts(body: TtsIn):
    return Response(await speech.synthesize(body.text, body.lang), media_type="audio/mpeg")
