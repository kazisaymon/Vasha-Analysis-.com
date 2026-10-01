import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")  # optional: put keys in backend/.env instead of typing `set` every time


class Settings:
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
    model = os.getenv("CLAUDE_MODEL", "claude-sonnet-5-5")
    groq_key = os.getenv("GROQ_API_KEY", "")
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    # Free-tier friendly default: the "latest" alias of Flash-Lite (highest free daily quota).
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")
    gemini_base = os.getenv("GEMINI_BASE", "https://generativelanguage.googleapis.com/v1beta")
    # "gemini" (free) or "anthropic" (paid). Default: gemini if a Gemini key exists.
    provider = os.getenv("LLM_PROVIDER") or ("gemini" if os.getenv("GEMINI_API_KEY") else "anthropic")
    origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
    data_path = Path(os.getenv("CTG_DATA", ROOT / "data" / "clean" / "ctg_pairs.csv"))
    max_file_bytes = 20 * 1024 * 1024
    max_files = 5
    max_text_chars = 60_000
    rate_per_min = int(os.getenv("RATE_LIMIT_PER_MIN", "30"))


settings = Settings()
