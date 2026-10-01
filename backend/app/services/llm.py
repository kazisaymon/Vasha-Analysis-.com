import json
from typing import AsyncIterator

import httpx
from anthropic import APIStatusError, AsyncAnthropic
from fastapi import HTTPException

from ..config import settings
from ..languages import LANGS, has_bengali_script
from . import ctg

_client: AsyncAnthropic | None = None


def client() -> AsyncAnthropic:
    global _client
    if not settings.anthropic_key:
        raise HTTPException(503, "AI is not configured (ANTHROPIC_API_KEY missing).")
    if _client is None:
        _client = AsyncAnthropic(api_key=settings.anthropic_key)
    return _client


# ---------------------------------------------------------------- Gemini (free tier)

def _gemini_parts(blocks: list[dict]) -> list[dict]:
    """Convert the Anthropic-style blocks built in files.py into Gemini parts."""
    parts = []
    for b in blocks:
        if b["type"] == "text":
            parts.append({"text": b["text"]})
        elif b["type"] in ("image", "document"):
            src = b["source"]
            parts.append({"inline_data": {"mime_type": src["media_type"], "data": src["data"]}})
    return parts


def _gemini_error(status: int, body: str) -> HTTPException:
    low = body.lower()
    if status == 429 or "quota" in low or "resource_exhausted" in low:
        return HTTPException(429, "Free Gemini quota reached for now. Wait a minute (or until tomorrow) and try again, "
                                  "or set GEMINI_MODEL to another free model.")
    if status in (400, 403) and ("api key" in low or "api_key" in low or "permission" in low):
        return HTTPException(401, "Gemini API key is missing or invalid. Check GEMINI_API_KEY.")
    return HTTPException(502, f"Gemini error {status}: {body[:200]}")


def _gemini_models() -> list[str]:
    seen, out = set(), []
    for m in (settings.gemini_model, "gemini-flash-lite-latest", "gemini-flash-latest"):
        if m not in seen:
            seen.add(m)
            out.append(m)
    return out


def _gemini_body(system: str, contents: list[dict]) -> dict:
    return {"systemInstruction": {"parts": [{"text": system}]}, "contents": contents,
            "generationConfig": {"maxOutputTokens": 2048, "temperature": 0.3}}


def _gemini_headers() -> dict:
    if not settings.gemini_key:
        raise HTTPException(503, "AI is not configured (GEMINI_API_KEY missing).")
    return {"x-goog-api-key": settings.gemini_key, "Content-Type": "application/json"}


def _piece(data: dict) -> str:
    cands = data.get("candidates") or []
    if not cands:
        return ""
    parts = (cands[0].get("content") or {}).get("parts") or []
    return "".join(p.get("text", "") for p in parts if not p.get("thought"))


async def _gemini_stream(system: str, contents: list[dict]) -> AsyncIterator[str]:
    headers, body = _gemini_headers(), _gemini_body(system, contents)
    async with httpx.AsyncClient(timeout=httpx.Timeout(120, connect=15)) as http:
        for i, model in enumerate(_gemini_models()):
            url = f"{settings.gemini_base}/models/{model}:streamGenerateContent?alt=sse"
            async with http.stream("POST", url, headers=headers, json=body) as r:
                if r.status_code == 404 and i < len(_gemini_models()) - 1:
                    continue  # unknown model name: try the next candidate
                if r.status_code != 200:
                    raise _gemini_error(r.status_code, (await r.aread()).decode("utf-8", "replace"))
                got = False
                async for line in r.aiter_lines():
                    if line.startswith("data:"):
                        try:
                            text = _piece(json.loads(line[5:].strip()))
                        except ValueError:
                            continue
                        if text:
                            got = True
                            yield text
                if not got:
                    yield "(The model returned no text. The content may have been blocked; try rephrasing.)"
                return


async def _gemini_once(system: str, contents: list[dict]) -> str:
    headers, body = _gemini_headers(), _gemini_body(system, contents)
    async with httpx.AsyncClient(timeout=httpx.Timeout(120, connect=15)) as http:
        for i, model in enumerate(_gemini_models()):
            r = await http.post(f"{settings.gemini_base}/models/{model}:generateContent", headers=headers, json=body)
            if r.status_code == 404 and i < len(_gemini_models()) - 1:
                continue
            if r.status_code != 200:
                raise _gemini_error(r.status_code, r.text)
            return _piece(r.json()).strip()
    return ""


def _anthropic_error(e: APIStatusError) -> HTTPException:
    if "credit balance" in str(e.message):
        return HTTPException(402, "Anthropic credits are too low. Add credits, or switch to the free Gemini provider.")
    return HTTPException(502, f"AI error: {e.message}")


CTG_RULES = """Chittagonian reference examples from a curated dataset (Chittagonian | Bengali | English):
{examples}

Rules for Chittagonian:
- Treat these examples as ground truth for vocabulary, spelling and grammar. Write Chittagonian in Bengali script.
- If you are not confident about a Chittagonian word or phrase, say so and give the Bengali equivalent instead of inventing one."""


def _ctg_context(text: str, force: bool) -> str:
    """Retrieve dataset examples when the text may be (or must become) Chittagonian."""
    if not ctg.index.ready or not (force or has_bengali_script(text)):
        return ""
    rows = ctg.index.search_text(text)
    return CTG_RULES.format(examples=ctg.index.format_examples(rows)) if rows else ""


def chat_system(reply_lang: str, user_text: str) -> str:
    if reply_lang == "auto":
        lang_rule = "Reply in the same language the user writes in. If they mix languages, follow the dominant one."
    else:
        lang_rule = f"Always reply in {LANGS.get(reply_lang, reply_lang)}."
    base = (
        "You are Bhasha, a multilingual assistant for people who speak Chittagonian, Bengali, English, Hindi, "
        "Chinese and many other languages. You can read text, images, PDFs, spreadsheets, documents and audio "
        "transcripts, and you analyse them accurately. Be clear and concise; use Markdown when it helps. "
        "When analysing a file, quote specific values or passages instead of speaking in generalities.\n"
        + lang_rule
    )
    extra = _ctg_context(user_text, force=reply_lang == "ctg")
    return base + ("\n\n" + extra if extra else "")


def _clean_history(history: list[dict]) -> list[dict]:
    msgs = [{"role": m["role"], "content": m["content"]} for m in history
            if m.get("role") in ("user", "assistant") and str(m.get("content", "")).strip()][-20:]
    while msgs and msgs[0]["role"] != "user":
        msgs.pop(0)
    return msgs


async def stream_chat(message: str, history: list[dict], reply_lang: str, blocks: list[dict]) -> AsyncIterator[str]:
    content = blocks + [{"type": "text", "text": message or "Please analyse the attached file(s)."}]
    hist = _clean_history(history)
    system = chat_system(reply_lang, message)

    if settings.provider == "gemini":
        contents = [{"role": "user" if m["role"] == "user" else "model", "parts": [{"text": m["content"]}]} for m in hist]
        contents.append({"role": "user", "parts": _gemini_parts(content)})
        async for piece in _gemini_stream(system, contents):
            yield piece
        return

    try:
        async with client().messages.stream(
            model=settings.model, max_tokens=2048, system=system, messages=hist + [{"role": "user", "content": content}],
        ) as stream:
            async for text in stream.text_stream:
                yield text
    except APIStatusError as e:
        raise _anthropic_error(e)


async def translate(text: str, source: str, target: str) -> str:
    src = "the source language (detect it)" if source == "auto" else LANGS.get(source, source)
    tgt = LANGS.get(target, target)
    involves_ctg = "ctg" in (source, target)
    extra = _ctg_context(text, force=involves_ctg)
    system = (
        f"You are a professional translator. Translate the user's text from {src} into {tgt}. "
        "Output only the translation: no notes, no quotes, no explanations. Preserve meaning, tone and formatting."
        + ("\n\n" + extra if extra else "")
    )
    if settings.provider == "gemini":
        return await _gemini_once(system, [{"role": "user", "parts": [{"text": text}]}])
    try:
        resp = await client().messages.create(
            model=settings.model, max_tokens=2048, system=system, messages=[{"role": "user", "content": text}],
        )
    except APIStatusError as e:
        raise _anthropic_error(e)
    return "".join(b.text for b in resp.content if b.type == "text").strip()
