# CampusAI Kiosk

The Next.js frontend for the CampusAI college reception kiosk. It runs separately from the read-only FastAPI backend.

## Run locally

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the welcome page or [http://localhost:3000/kiosk](http://localhost:3000/kiosk) for the kiosk.

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_BASE_URL` to the existing FastAPI server URL. The default is `http://localhost:8000`. Set `NEXT_PUBLIC_DEMO_MODE=true` to preview sample interactions without calling the backend. You can also open `/kiosk?demo=1` to enter demo mode.

## Backend integration

The frontend calls the existing `GET /health`, `POST /chat`, `POST /chat/reset`, `POST /voice/stt`, and `POST /voice/tts` endpoints. Voice interactions use the existing STT → chat → TTS flow so they can share the chat session. No API keys are stored in the browser.

The optional camera preview stays local to the browser. The frontend does not upload or store camera frames, and emotion status is explicitly demo-only; emotion recognition is not implemented.
