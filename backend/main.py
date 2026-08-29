# main.py
# The FastAPI web server that puts PrepPilot's pipeline behind a simple API.
#
# Accounts note: profiles now live per-user in Supabase (the React app reads/writes
# them directly). This API is stateless -- it receives the caller's profile text in
# the /briefing request. If SUPABASE_URL + SUPABASE_ANON_KEY are set, every /briefing
# call must carry a valid Supabase login token; otherwise the API runs open (dev).

import requests
from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from api_pipeline import generate_briefing
from config import SUPABASE_URL, SUPABASE_ANON_KEY

app = FastAPI(title="PrepPilot API")

# Let the React app talk to this API. Localhost in dev, *.vercel.app in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)


class BriefingRequest(BaseModel):
    person: str = ""
    company: str
    goal: str = ""
    profile: str = ""
    person_linkedin: str = ""


def require_user(authorization: str = Header(default=None)):
    # If Supabase isn't configured on the backend, skip auth (handy for local dev).
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        return None

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing login token.")

    token = authorization.split(" ", 1)[1].strip()
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={"Authorization": f"Bearer {token}", "apikey": SUPABASE_ANON_KEY},
            timeout=6,
        )
    except Exception:
        raise HTTPException(status_code=503, detail="Could not verify login right now.")

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired login token.")
    return resp.json()


@app.get("/health")
def health():
    # A tiny endpoint just to confirm the server is up.
    return {"status": "ok"}


@app.post("/briefing")
def create_briefing(req: BriefingRequest, user=Depends(require_user)):
    briefing = generate_briefing(
        req.person, req.company, req.goal, req.profile, req.person_linkedin
    )
    return briefing
