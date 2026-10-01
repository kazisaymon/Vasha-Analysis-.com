import httpx
import edge_tts
from fastapi import HTTPException

from ..config import settings
from ..languages import detect_lang

GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
# Whisper has no Chittagonian: speech is transcribed as Bengali (closest supported language).
WHISPER_LANG = {"ctg": "bn"}

VOICES = {
    "bn": "bn-BD-NabanitaNeural", "ctg": "bn-BD-NabanitaNeural", "en": "en-US-AriaNeural",
    "hi": "hi-IN-SwaraNeural", "ur": "ur-PK-UzmaNeural", "ar": "ar-SA-ZariyahNeural",
    "zh": "zh-CN-XiaoxiaoNeural", "ja": "ja-JP-NanamiNeural", "ko": "ko-KR-SunHiNeural",
    "fr": "fr-FR-DeniseNeural", "es": "es-ES-ElviraNeural", "de": "de-DE-KatjaNeural",
    "ru": "ru-RU-SvetlanaNeural", "tr": "tr-TR-EmelNeural",
}


async def transcribe(data: bytes, filename: str, lang: str | None) -> str:
    if not settings.groq_key:
        raise HTTPException(503, "Voice input is not configured (GROQ_API_KEY missing).")
    form = {"model": "whisper-large-v3", "response_format": "json", "temperature": "0"}
    if lang and lang != "auto":
        form["language"] = WHISPER_LANG.get(lang, lang)
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(GROQ_URL, headers={"Authorization": f"Bearer {settings.groq_key}"},
                              data=form, files={"file": (filename, data)})
    if r.status_code != 200:
        raise HTTPException(502, f"Transcription failed: {r.text[:200]}")
    return r.json().get("text", "").strip()


async def synthesize(text: str, lang: str | None) -> bytes:
    code = lang if lang in VOICES else detect_lang(text)
    buf = bytearray()
    try:
        async for chunk in edge_tts.Communicate(text[:3000], VOICES[code]).stream():
            if chunk["type"] == "audio":
                buf += chunk["data"]
    except Exception as e:  # network/endpoint issues: frontend falls back to browser speech
        raise HTTPException(502, f"Speech synthesis failed: {e}")
    if not buf:
        raise HTTPException(502, "Speech synthesis returned no audio.")
    return bytes(buf)
