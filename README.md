# Bhasha (ভাষা): multilingual AI web app

Chat, translate and analyse files (image, PDF, DOCX, CSV/XLSX, audio) in Chittagonian, Bengali, English, Hindi, Chinese and more.

```
bhasha/
  backend/    FastAPI  -> deploy on Render
  frontend/   Next.js  -> deploy on Vercel
```

## Run locally
```bash
# backend
cd backend && pip install -r requirements.txt
cp .env.example .env    # fill GEMINI_API_KEY (free) and optionally GROQ_API_KEY (free, voice input)
python -m uvicorn app.main:app --reload   # keys are auto-loaded from backend/.env

# frontend (new terminal)
cd frontend && npm install && cp .env.example .env.local && npm run dev
```
Open http://localhost:3000. Check the API at http://localhost:8000/health.

## Deploy
**Render (backend):** New > Blueprint > pick this repo (`render.yaml` is included). Set `GEMINI_API_KEY`, `GROQ_API_KEY`, and `ALLOWED_ORIGINS=https://<your-app>.vercel.app`.

**Vercel (frontend):** Import the repo, set Root Directory to `frontend`, add env `NEXT_PUBLIC_API_URL=https://<your-api>.onrender.com`.

## Chittagonian dataset
`python backend/scripts/prepare_dataset.py [raw.csv]` cleans the CSV and writes `backend/data/clean/`:
`ctg_pairs.csv` (used by the app for retrieval), `train/val/test.jsonl` (for fine-tuning).
Expected columns: `Bengali, Chattogram, English, Sentiment, Source of Data`.

## Notes
- Voice input uses Groq Whisper, which has no Chittagonian model: Chittagonian speech is transcribed as Bengali.
- Voice output uses Edge-TTS with a Bengali voice for Chittagonian. If the backend voice fails, the browser's speech is used.
- Chats are stored in the browser (localStorage) only.
- Render free plan sleeps after inactivity; the first request can take ~30-60 s.

## Free setup
- **Chat / translate / file analysis:** Google Gemini free tier. Get a key at https://aistudio.google.com/apikey (no card). Set `GEMINI_API_KEY`.
- **Voice input:** Groq free tier, key at https://console.groq.com/keys. Set `GROQ_API_KEY`.
- **Voice output:** Edge-TTS, no key.
- Free-tier limits change and are per Google project; if you hit the daily limit, set `GEMINI_MODEL` to another free model shown in AI Studio.
- Google may use free-tier requests to improve its products, so do not upload private or sensitive files.
- To use Claude instead (paid): `LLM_PROVIDER=anthropic` and `ANTHROPIC_API_KEY`.
