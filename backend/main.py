# main.py
# The FastAPI web server that puts PrepPilot's pipeline behind a simple API.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from api_pipeline import generate_briefing

app = FastAPI(title="PrepPilot API")

# Let the React app (running on a different port) talk to this API during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PROFILE_FILE = "me.txt"


# This describes the JSON the frontend sends when it asks for a briefing.
class BriefingRequest(BaseModel):
    person: str
    company: str
    goal: str = ""
    profile: str = ""


class ProfileRequest(BaseModel):
    profile: str


def read_profile():
    # Read me.txt if it exists, otherwise return an empty string.
    try:
        with open(PROFILE_FILE, "r", encoding="utf-8") as f:
            return f.read().strip()
    except FileNotFoundError:
        return ""


@app.get("/health")
def health():
    # A tiny endpoint just to confirm the server is up.
    return {"status": "ok"}


@app.get("/profile")
def get_profile():
    return {"profile": read_profile()}


@app.post("/profile")
def save_profile(req: ProfileRequest):
    with open(PROFILE_FILE, "w", encoding="utf-8") as f:
        f.write(req.profile.strip())
    return {"status": "saved"}


@app.post("/briefing")
def create_briefing(req: BriefingRequest):
    # If the frontend did not send a profile, fall back to whatever is in me.txt.
    profile = req.profile.strip() or read_profile()

    briefing = generate_briefing(req.person, req.company, req.goal, profile)
    return briefing