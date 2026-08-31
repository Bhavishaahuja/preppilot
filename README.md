# PrepPilot

**Meeting prep, on autopilot.** PrepPilot researches whoever you're about to meet and hands you a sourced, structured briefing in about twenty seconds — talking points, sharp questions to ask, and how the two of you can help each other.

🔗 **Live:** [preppilot-alpha.vercel.app](https://preppilot-alpha.vercel.app)

---

## What it does

You give PrepPilot a name and a company (or paste a LinkedIn URL) and tell it what you want out of the meeting. It plans the research, searches the live web across six angles in parallel, verifies it's looking at the *right* person, and writes you a cited briefing you can walk in with:

- **Snapshot** — who they are and what they're focused on right now.
- **Talking points** — the few things worth raising, each carrying its sources.
- **Smart questions** — specific enough to show you did the work.
- **How you help each other** — what you can offer them, and what they can do for you.
- **Sources** — every claim links back to where it came from.

It's built for the high-stakes conversations: final-round interviews, recruiter screens, networking coffees, referral asks, sales and investor calls.

## Why it's more than a search box

PrepPilot is an agentic pipeline, not a single prompt:

1. **Plan** — Claude breaks the person and company into six research angles (their role, career history, the company, connection points, how you can help them, how they can help you) and writes searchable questions for each. The plan is produced with a forced tool call, so it always comes back as clean structured data.
2. **Research** — every question is searched against the live web with Tavily, **all in parallel** (a ~90s sequential loop became ~20s).
3. **Disambiguate** — a dedicated identity step reads every result and keeps only the ones that clearly refer to the target person: same employer, one coherent role, career history, and pronouns. Same-name strangers are dropped before anything is written, so the briefing — and its source list — only ever describe the right person.
4. **Brief** — Claude assembles the final briefing (again via a forced tool call for reliable structured output), using **only** the researched, identity-matched material. If a claim isn't supported, it's left out.

## Features

- 🔎 Six-angle, parallel, live-web research with cited sources
- 🧭 Identity disambiguation so common names don't pull in the wrong person
- 👤 Per-user accounts (Supabase magic-link sign-in, row-level security)
- 📝 One-time profile that personalizes every briefing's "how I can help" angles
- 🗂️ Saved briefing history you can reopen and delete
- 📋 Copy to clipboard and Export to PDF
- 🎬 Animated marketing home page with a live "briefing builder" demo

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 19 + Vite, Tailwind CSS v4, React Router, `@supabase/supabase-js` — deployed on **Vercel** |
| Backend | FastAPI (Python), Anthropic **Claude** (planning + writing), **Tavily** (web search) — deployed on **Render** |
| Auth & data | **Supabase** (Postgres + magic-link auth, row-level security) |
| Email | **Resend** custom SMTP on a verified domain |
| Fonts | Newsreader (serif) + IBM Plex Sans |

## Repository layout

```
backend/
  main.py           FastAPI app + Supabase token check
  plan.py           builds the six-angle research plan (forced tool call)
  research.py       runs every question through Tavily, in parallel
  identity.py       identity disambiguation — keeps only the right person
  api_pipeline.py   ties research + identity + briefing together, returns JSON
  config.py         API clients, model, env
frontend/
  src/pages/        MarketingHome, Login, Profile, NewMeeting, Working, Briefing, History
  src/components/   Layout, BriefingBuilder (the animated demo)
db/                 Supabase SQL (profiles, briefings tables + RLS)
```

## Running locally

**Backend** (from `backend/`):

```bash
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
# set ANTHROPIC_API_KEY and TAVILY_API_KEY (in a .env or your shell)
uvicorn main:app --reload            # http://127.0.0.1:8000  (docs at /docs)
```

Leave `SUPABASE_URL` / `SUPABASE_ANON_KEY` unset locally and the API runs open (no auth check).

**Frontend** (from `frontend/`):

```bash
npm install
# frontend/.env:
#   VITE_API_URL=http://127.0.0.1:8000
#   VITE_SUPABASE_URL=<your project url>
#   VITE_SUPABASE_ANON_KEY=<your anon key>
npm run dev                          # http://localhost:5173
```

## Deploy

- **Frontend → Vercel.** Root `frontend`, build `npm run build`, output `dist`. Env: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- **Backend → Render.** Root `backend`, start `uvicorn main:app --host 0.0.0.0 --port $PORT`. Env: `ANTHROPIC_API_KEY`, `TAVILY_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- **Supabase.** Run the SQL in `db/` (profiles + briefings tables with row-level security), set the auth redirect URLs, and add custom SMTP (Resend) for reliable magic-link delivery.

## Known limitations & roadmap

- **Profile photos.** PrepPilot makes a best-effort read of the person's LinkedIn preview image, but LinkedIn blocks server-side requests, so most briefings show a clean grey avatar. Reliable photos would need a paid enrichment API.
- **Research speed.** Parallelized to ~20s; the identity step adds one more model call. Further tuning (lighter search depth, fewer angles) is possible.
- **Deeper LinkedIn data** would need a paid enrichment provider (deferred by choice — no scraping).

---

Built by Bhavisha Ahuja. Briefings are researched from public web sources and cited.
