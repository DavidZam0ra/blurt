# Blurt

A PWA that turns a spoken plan into a Google Calendar event: record a voice note, get it transcribed and extracted into an event, confirm it, done.

## Layout

- `apps/web` — Angular PWA. Captures audio, stores notes offline in IndexedDB, and syncs them once online.
- `apps/api` — NestJS backend. Holds the third-party API keys (Groq, later OpenAI/Claude/Google) so they never reach the browser.

The two projects are independent (no Nx, no shared library) and talk over a small REST API.

## Running locally

**apps/api**

```bash
cd apps/api
cp .env.example .env   # then set GROQ_API_KEY
npm install
npm run start:dev
```

Get a free Groq API key at [console.groq.com](https://console.groq.com).

**apps/web**

```bash
cd apps/web
npm install
npm start
```

The web app expects the API at `http://localhost:3000` (see `apps/web/src/app/core/api-config.ts`).

## Current phase

- Transcription and event extraction run on Groq's free tier (Whisper Large v3 Turbo + Llama 3.3).
- `CalendarPort` is an in-memory stub — it logs calls and returns a fake id. Real Google Calendar/OAuth integration is a later phase.
- Default calendar is always `"primary"`; there's no calendar-selection UI yet.
