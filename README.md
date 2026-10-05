# Event Lead Manager

A small full-stack app for keeping track of people you meet at business events and following up with them.
You can add/edit/delete leads, search and filter them, and use AI to summarize your notes or draft a follow-up email.

**Live demo:** _add link here_

## Features

- Add, edit and delete leads (name, company, email, event, notes, follow-up status)
- Search across name, company, email and notes, filter by event and status, sort by date or name
- Quick status change from the lead panel
- **AI summary** of interaction notes (saved to the db so it doesn't regenerate every time you open a lead)
- **AI follow-up email** draft with a tone option, editable before you copy it or open it in your mail app
- Works on mobile (table turns into cards, panels go full screen)

## Stack

| Part     | Tech                                        |
| -------- | ------------------------------------------- |
| Frontend | Next.js (App Router), TypeScript, Tailwind  |
| Backend  | FastAPI, SQLAlchemy, Pydantic               |
| Database | SQLite locally, PostgreSQL in production    |
| AI       | Google Gemini (`gemini-2.5-flash`) over REST |

## Running locally

You need Python 3.11+ and Node 20+.

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # put your GEMINI_API_KEY in here
python seed.py              # optional, adds a few sample leads
uvicorn app.main:app --reload
```

API runs on http://localhost:8000, docs at http://localhost:8000/docs.

You can get a free Gemini key from [Google AI Studio](https://aistudio.google.com/apikey). Everything except the two AI buttons works without one.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

### Tests

```bash
cd backend
pytest
```

The AI calls are mocked in the tests so they don't need a key.

## API

| Method | Endpoint              | Description                                         |
| ------ | --------------------- | --------------------------------------------------- |
| GET    | `/leads`              | List leads. Query params: `search`, `status`, `event`, `sort` |
| POST   | `/leads`              | Create a lead                                       |
| GET    | `/leads/{id}`         | Get one lead                                        |
| PATCH  | `/leads/{id}`         | Update some fields                                  |
| DELETE | `/leads/{id}`         | Delete a lead                                       |
| GET    | `/events`             | Distinct event names (used for the filter dropdown) |
| POST   | `/leads/{id}/summary` | Generate + save an AI summary of the notes          |
| POST   | `/leads/{id}/draft`   | Generate a follow-up email `{subject, body}`        |

Status is one of `new`, `contacted`, `follow_up`, `closed`.

## Key decisions

- **FastAPI + Next.js as separate apps.** Keeps the API usable on its own (and testable with pytest), and FastAPI gives request validation and the `/docs` page for free. The frontend is a single client-rendered page since everything is behind filters anyway.
- **SQLite for dev, Postgres for prod via `DATABASE_URL`.** SQLAlchemy makes switching just an env var, so there's no need to run Postgres locally. Tables are created on startup; for a bigger project I'd add Alembic migrations.
- **Event is a plain text field, not its own table.** For this size an `events` table felt like overkill. The form suggests existing event names so people don't create "TechSparks" and "Tech Sparks" by accident, and `/events` just does a `DISTINCT`.
- **Search/filter happens on the server.** It's a couple of `ILIKE`s and `WHERE`s, and it'd still work if the list got big. The search box is debounced so it doesn't fire a request per keystroke.
- **Summary is stored, draft is not.** A summary is something you'd want to see every time you open the lead, so it's saved and cleared automatically when the notes change. Email drafts are one-off, so they're just returned and editable in the UI.
- **AI calls go through the backend.** The API key stays on the server, and the prompts live in one place (`backend/app/ai.py`). The draft endpoint asks Gemini for JSON output so the subject and body come back separately.
- **Gemini** because the free tier is enough for this and it supports a JSON response mode. The model name is configurable with `GEMINI_MODEL`.
- **Errors from the AI show up in the UI** (502 from the API with a message) instead of failing silently.

## Deployment

- **Backend:** Render (see `render.yaml`), with a Postgres database from Neon. Set `DATABASE_URL`, `GEMINI_API_KEY` and `CORS_ORIGINS` (the frontend URL).
- **Frontend:** Vercel with the root directory set to `frontend` and `NEXT_PUBLIC_API_URL` pointing at the backend.

## What I'd add with more time

- Auth + teams, so each team only sees its own leads
- Pagination on the leads list
- Importing leads from a CSV or a badge scan
- Reminders for follow-up dates
