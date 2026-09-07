# Chiang Mai AI — browser-voice demo backend

Django + Channels relay that lets the portfolio's `/demos/chiang-mai-ai` page
run the **real** Deepgram Voice Agent (Nova-3 STT · GPT-4o-mini · Aura TTS) from
the production repo (github.com/Brighter55/chiang-mai-ai-phone-ordering) — but
through the **browser mic** instead of a phone call.

Twilio / Clover / SMS / DB are deliberately out of scope. This is a
conversation-only demo: the agent takes an order over the three-item menu
(Pad Thai, Drunken Noodles, Chicken Noodle Soup) and nothing is persisted,
charged, or sent to a POS.

```
browser mic (16 kHz linear16) ──WS──▶ Django Channels relay ──WS──▶ Deepgram Voice Agent
```

## Run it (local dev)

Two processes, from two terminals:

```bash
# 1) Backend (this folder)
py -3.11 -m venv .venv            # once
.venv\Scripts\python -m pip install -r requirements.txt   # once
copy .env.example .env            # once — then put your DEEPGRAM_API_KEY in .env
.venv\Scripts\python -m daphne -b 127.0.0.1 -p 8000 config.asgi:application
```

```bash
# 2) Frontend (../frontend)
npm install        # once
npm run dev        # http://localhost:5173
```

Open **http://localhost:5173/demos/chiang-mai-ai**, allow the mic, and press
**Talk To Your Agent**. Vite proxies `/ws/*` to the backend on :8000, so the
browser connects same-origin (no CORS).

> Mic requires a secure context: `localhost` qualifies. A Deepgram key is
> required — without one the page shows a clear error and never calls Deepgram.
> Keys: https://console.deepgram.com (Voice Agent / Nova access). Each demo
> conversation costs normal Deepgram usage.

## Layout

- `config/` — minimal Django settings + ASGI (one WebSocket path
  `ws/demo/chiang-mai-ai`, plus a tiny HTTP probe).
- `agent/` — Deepgram Voice Agent wiring:
  - `agent_settings.py` — the Settings payload (linear16 @16 kHz; models from
    env) and the spoken greeting.
  - `functions.py` — `place_order` / `end_conversation` tool schemas.
  - `loader.py` — loads the vendored prompt/keyterms below.
  - `assets/_dg_va_prompt.txt` — the **real** production system prompt, trimmed
    to the three-item demo menu (kept verbatim in tone/rules).
  - `assets/_dg_keyterms.txt` — STT phonetic keyterms filtered to those items.
- `relay/consumers.py` — the thin browser ↔ Deepgram audio relay + event map to
  frontend control frames (phase, transcript, order, console, ended).

No migrations are used and the DB is never touched (declared sqlite only so the
settings loader is happy).

## Verifying the relay without a browser

With a `DEEPGRAM_API_KEY` set and Daphne running, a throwaway client can prove
audio + function-call flow. (No key: the socket returns
`{"type":"fatal","message":"DEEPGRAM_API_KEY is not set…"}`.)
