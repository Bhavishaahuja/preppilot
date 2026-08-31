# api_pipeline.py
# Runs the full research + briefing pipeline and returns structured data the UI can render.

import re
from concurrent.futures import ThreadPoolExecutor

import requests

from config import anthropic_client, MODEL
from research import run_research
from identity import resolve_identity


def filter_research_to_matched(research_data, matched_urls):
    # Keep only the search results whose URL was confirmed to be the target person.
    # Drops same-name-stranger results before we write the briefing or list sources.
    filtered = {}
    for angle, blocks in research_data.items():
        new_blocks = []
        for block in blocks:
            kept = [r for r in block["results"] if r["url"] in matched_urls]
            if kept:
                new_blocks.append({"question": block["question"], "results": kept})
        if new_blocks:
            filtered[angle] = new_blocks
    return filtered


def collect_sources(research_data):
    # Pull every source we actually gathered, de-duplicated by URL, so the UI can list them.
    seen_urls = set()
    sources = []
    for angle, blocks in research_data.items():
        for block in blocks:
            for result in block["results"]:
                url = result["url"]
                if url not in seen_urls:
                    seen_urls.add(url)
                    sources.append({"title": result["title"], "url": url})
    return sources


def fetch_target_photo(person_linkedin):
    # Best-effort: try to read the LinkedIn profile's preview image (og:image) from the
    # URL the user pasted. LinkedIn blocks bots aggressively, so this frequently returns
    # nothing -- that's expected, and the UI falls back to a grey initials avatar.
    # We only trust real profile media (media.licdn.com) so we never show LinkedIn's
    # generic banner as if it were the person's face.
    if not person_linkedin or "linkedin.com" not in person_linkedin:
        return None
    try:
        resp = requests.get(
            person_linkedin,
            timeout=6,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                ),
                "Accept-Language": "en-US,en;q=0.9",
            },
        )
        if resp.status_code != 200:
            return None
        html = resp.text
        match = re.search(
            r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
            html, re.I,
        ) or re.search(
            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
            html, re.I,
        )
        if not match:
            return None
        image_url = match.group(1).replace("&amp;", "&")
        if "media.licdn.com" in image_url:
            return image_url
        return None
    except Exception:
        return None


def dossier_to_text(research_data):
    # Flatten the research into plain text Claude can read, keeping URLs so it can cite them.
    lines = []
    for angle, blocks in research_data.items():
        heading = angle.replace("_", " ").capitalize()
        lines.append(f"\n## {heading}")
        for block in blocks:
            lines.append(f"\nQuestion: {block['question']}")
            for result in block["results"]:
                lines.append(f"- {result['title']} ({result['url']})")
                lines.append(f"  {result['snippet']}")
    return "\n".join(lines)


def write_briefing_json(person, company, dossier_text, user_context, identity_summary=""):
    # We hand Claude a "tool" whose shape is exactly the briefing we want back.
    # Forcing the tool call means the answer is always valid structured data,
    # so we never have to parse loose JSON text that might be malformed.
    briefing_tool = {
        "name": "save_briefing",
        "description": "Save the finished pre-meeting briefing in a structured form.",
        "input_schema": {
            "type": "object",
            "properties": {
                "snapshot": {
                    "type": "string",
                    "description": "3 to 4 sentences on who they are and what they focus on now.",
                },
                "talking_points": {
                    "type": "array",
                    "description": "3 to 5 talking points I can bring up.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string", "description": "short label"},
                            "body": {"type": "string", "description": "1 to 2 sentences"},
                            "sources": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "source URLs that back this point up",
                            },
                        },
                        "required": ["title", "body", "sources"],
                    },
                },
                "questions": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "3 to 5 thoughtful questions I could ask them.",
                },
                "help_them": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "2 to 3 points on how I can help them.",
                },
                "help_me": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "2 to 3 points on what I want from this meeting.",
                },
            },
            "required": ["snapshot", "talking_points", "questions", "help_them", "help_me"],
        },
    }

    identity_block = ""
    if identity_summary:
        identity_block = f"""
CONFIRMED IDENTITY of the person I'm meeting:
{identity_summary}
"""

    prompt = f"""You are a meeting-prep assistant. I'm about to meet {person} from {company}.

Here is context about me, the person you're prepping:
{user_context}
{identity_block}
IDENTITY RULE (critical): This briefing is about ONE specific person — {person} at {company}. The research has already been filtered to them, but stay strict: use a fact only if it clearly belongs to THIS person. Ignore anything that would fit a different person of the same name — a different employer, or a conflicting role, career history, or pronouns. Never blend two people's biographies. If a detail can't be tied to this specific person with confidence, leave it out. Every source URL you attach must be about this person.

Below is raw research gathered from the web, grouped by angle. Each item has a source URL.
Use ONLY this research (plus what you know about me above). Do not invent anything the research does not support.
Call the save_briefing tool with the finished briefing. Put the real source URLs in each talking point's sources.

RESEARCH:
{dossier_text}"""

    resp = anthropic_client.messages.create(
        model=MODEL,
        max_tokens=2000,
        tools=[briefing_tool],
        tool_choice={"type": "tool", "name": "save_briefing"},
        messages=[{"role": "user", "content": prompt}],
    )

    # Because we forced the tool call, Claude's answer comes back already structured.
    for block in resp.content:
        if block.type == "tool_use":
            return block.input

    # Very unlikely fallback so the app never crashes if no tool block comes back.
    return {
        "snapshot": "",
        "talking_points": [],
        "questions": [],
        "help_them": [],
        "help_me": [],
    }


def generate_briefing(person, company, goal, profile, person_linkedin=""):
    # The whole pipeline in one call: research, then structured briefing, then attach sources.
    user_context = f"My background: {profile}\nWhat I want from this meeting: {goal}"

    # Kick off the (best-effort) photo fetch in the background so it overlaps with the
    # research and costs us basically no extra wall-clock time.
    photo_pool = ThreadPoolExecutor(max_workers=1)
    photo_future = photo_pool.submit(fetch_target_photo, person_linkedin)

    research_data = run_research(person, company, user_context, person_linkedin)

    # Disambiguation: figure out which results are actually about the target person
    # (same employer, coherent role/history/pronouns) and drop same-name strangers.
    identity = resolve_identity(person, company, goal, person_linkedin, research_data)
    matched = identity["matched_urls"]
    # If at least one result was confirmed, brief only on those. If nothing could be
    # confirmed, keep everything but flag low confidence so we still return something.
    research_used = filter_research_to_matched(research_data, matched) if matched else research_data

    dossier_text = dossier_to_text(research_used)

    briefing = write_briefing_json(
        person, company, dossier_text, user_context, identity["summary"]
    )

    # Add the metadata and the source list the UI needs -- only the confirmed-person sources.
    briefing["person"] = person
    briefing["company"] = company
    briefing["person_linkedin"] = person_linkedin
    briefing["sources"] = collect_sources(research_used)
    briefing["confidence"] = identity["confidence"]
    briefing["identity_note"] = identity["note"]

    try:
        briefing["photo_url"] = photo_future.result(timeout=8)
    except Exception:
        briefing["photo_url"] = None
    finally:
        photo_pool.shutdown(wait=False)

    return briefing
