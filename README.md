# PrepPilot
 
Meeting prep, on autopilot. PrepPilot researches whoever you're about to meet and hands you a sourced, structured briefing in about twenty seconds: talking points, sharp questions to ask, and how the two of you can help each other.
 
🔗 Live: [www.preppilot.site](https://www.preppilot.site)
 
## What it does
 
You give PrepPilot a name and a company (or paste a LinkedIn URL) and tell it what you want out of the meeting. It plans the research, searches the live web across six angles in parallel, verifies it's looking at the right person, and writes you a cited briefing you can walk in with:
 
- **Snapshot:** who they are and what they're focused on right now.
- **Talking points:** the few things worth raising, each carrying its sources.
- **Smart questions:** specific enough to show you did the work.
- **How you help each other:** what you can offer them, and what they can do for you.
- **Sources:** every claim links back to where it came from.
It's built for the high-stakes conversations: final-round interviews, recruiter screens, networking coffees, referral asks, sales and investor calls.
 
## Why it's more than a search box
 
PrepPilot is an agentic pipeline, not a single prompt:
 
1. **Plan.** Claude breaks the person and company into six research angles (their role, career history, the company, connection points, how you can help them, how they can help you) and writes searchable questions for each. The plan is produced with a forced tool call, so it always comes back as clean structured data.
2. **Research.** Every question is searched against the live web with Tavily, all in parallel (a ~90s sequential loop became ~20s).
3. **Disambiguate.** A dedicated identity step reads every result and keeps only the ones that clearly refer to the target person: same employer, one coherent role, career history, and pronouns. Same-name strangers are dropped before anything is written, so the briefing and its source list only ever describe the right person.
4. **Brief.** Claude assembles the final briefing (again via a forced tool call for reliable structured output), using only the researched, identity-matched material. If a claim isn't supported, it's left out.
## Features
 
- 🔎 Six-angle, parallel, live-web research with cited sources
- 🧭 Identity disambiguation so common names don't pull in the wrong person
- 👤 Per-user accounts (Supabase magic-link sign-in, row-level security)
- 📝 One-time profile that personalizes every briefing's "how I can help" angles
- 🗂️ Saved briefing history you can reopen and delete
- 📋 Copy to clipboard and Export to PDF
- 🎬 Animated marketing home page with a live "briefing builder" demo
- 🐳 Containerized backend with Kubernetes manifests for self-hosting
## Tech stack
 
| Layer | Stack |
|---|---|
| Frontend | React 19 + Vite, Tailwind CSS v4, React Router, @supabase/supabase-js |
| Backend | FastAPI (Python), Uvicorn, Anthropic Claude (planning, identity, writing), Tavily (web search) |
| Auth & data | Supabase (Postgres + magic-link auth, row-level security) |
| Email | Resend custom SMTP on a verified domain |
| Containers | Docker (python:3.12-slim, non-root user, uvicorn as PID 1) |
| Orchestration | Kubernetes: Deployment (2 replicas, resource requests/limits), ClusterIP Service, Secret, readiness + liveness probes |
| Hosting | Vercel (frontend, preppilot.site), Render (backend, api.preppilot.site) |
| Domain & DNS | preppilot.site on Namecheap DNS (web, API subdomain, and email records) |
| Fonts | Newsreader (serif) + IBM Plex Sans |
 
## Repository layout
 
```
backend/
  main.py           FastAPI app, /health route, Supabase token check
  plan.py           builds the six-angle research plan (forced tool call)
  research.py       runs every question through Tavily, in parallel
  identity.py       identity disambiguation, keeps only the right person
  api_pipeline.py   ties research + identity + briefing together, returns JSON
  config.py         API clients, model, env
  Dockerfile        container image for the backend
  .dockerignore     keeps .env and local junk out of the image
k8s/                Kubernetes Deployment + Service for the backend
frontend/
  src/pages/        MarketingHome, Login, Profile, NewMeeting, Working, Briefing, History
  src/components/   Layout, BriefingBuilder (the animated demo)
db/                 Supabase SQL (profiles, briefings tables + RLS)
docs/               build decisions log for the Kubernetes path
```
 
## Running locally
 
Backend (from `backend/`):
 
```bash
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
# set ANTHROPIC_API_KEY and TAVILY_API_KEY (in a .env or your shell)
uvicorn main:app --reload            # http://127.0.0.1:8000  (docs at /docs)
```
 
Leave `SUPABASE_URL` / `SUPABASE_ANON_KEY` unset locally and the API runs open (no auth check).
 
Frontend (from `frontend/`):
 
```bash
npm install
# frontend/.env:
#   VITE_API_URL=http://127.0.0.1:8000
#   VITE_SUPABASE_URL=<your project url>
#   VITE_SUPABASE_ANON_KEY=<your anon key>
npm run dev                          # http://localhost:5173
```
 
## Deploy
 
- **Frontend → Vercel.** Root `frontend`, build `npm run build`, output `dist`. Env: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Served at `preppilot.site` and `www.preppilot.site`.
- **Backend → Render.** Root `backend`, start `uvicorn main:app --host 0.0.0.0 --port $PORT`. Env: `ANTHROPIC_API_KEY`, `TAVILY_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Served at `api.preppilot.site`. CORS allows the preppilot.site origins plus `*.vercel.app` previews.
- **Supabase.** Run the SQL in `db/` (profiles + briefings tables with row-level security), set the auth Site URL and redirect URLs to the preppilot.site domains, and add custom SMTP (Resend) for reliable magic-link delivery.
- **DNS.** Apex A record and `www` CNAME point to Vercel, an `api` CNAME points to Render, and Resend's DKIM/DMARC/send records stay in place for email.
## Running on Kubernetes (optional)
 
Production stays on Render + Vercel. The backend also ships as a container with Kubernetes manifests, so it can run on any cluster. Tested on Docker Desktop's built-in Kubernetes (kubeadm).
 
Build and run the container (from the repo root):
 
```bash
docker build -t preppilot-backend:local ./backend
docker run --rm -p 8000:8000 --env-file backend/.env preppilot-backend:local
curl http://localhost:8000/health        # {"status":"ok"}
```
 
Deploy to the cluster:
 
```bash
# API keys go in as a Secret built from your .env, never baked into the image or committed
kubectl create secret generic preppilot-secrets --from-env-file=backend/.env
kubectl apply -f k8s/
kubectl rollout status deployment/preppilot-backend
kubectl port-forward svc/preppilot-backend 8080:80
curl http://localhost:8080/health        # {"status":"ok"}, docs at http://localhost:8080/docs
```
 
How it's set up:
 
- **Image.** `python:3.12-slim`, dependencies installed before code is copied (fast rebuilds), runs as a non-root user. uvicorn runs as PID 1 so it receives SIGTERM and shuts down cleanly. The port reads `$PORT` (Render) and falls back to 8000, so one image works on both.
- **Deployment.** 2 replicas with CPU/memory requests and limits. Readiness and liveness probes hit `GET /health`, which has no auth and no external calls, so probes never spend Anthropic or Tavily credits.
- **Service.** A ClusterIP Service gives the pods one stable address and load-balances between them.
- **Secret.** API keys are loaded from `backend/.env` into a Kubernetes Secret at deploy time and injected as env vars.
- **Local images.** `imagePullPolicy: Never` uses the locally built image. This works with Docker Desktop's kubeadm cluster, which shares Docker's images. A kind cluster can't see local images, so there you'd load the image into the cluster or push it to a registry first.
## Known limitations & roadmap
 
- **Profile photos.** PrepPilot makes a best-effort read of the person's LinkedIn preview image, but LinkedIn blocks server-side requests, so most briefings show a clean grey avatar. Reliable photos would need a paid enrichment API.
- **Research speed.** Parallelized to ~20s; the identity step adds one more model call. Further tuning (lighter search depth, fewer angles) is possible.
- **Deeper LinkedIn data** would need a paid enrichment provider (deferred by choice, no scraping).
- **Kubernetes extras.** A HorizontalPodAutoscaler and a ConfigMap for non-secret settings are natural next additions.
Built by Bhavisha Ahuja. Briefings are researched from public web sources and cited.
 
