# api_pipeline.py
# Runs the full research + briefing pipeline and returns structured data the UI can render.

import json
from config import anthropic_client, MODEL
from research import run_research


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


def write_briefing_json(person, company, dossier_text, user_context):
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

    prompt = f"""You are a meeting-prep assistant. I'm about to meet {person} from {company}.

Here is context about me, the person you're prepping:
{user_context}

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


def generate_briefing(person, company, goal, profile):
    # The whole pipeline in one call: research, then structured briefing, then attach sources.
    user_context = f"My background: {profile}\nWhat I want from this meeting: {goal}"

    research_data = run_research(person, company, user_context)
    dossier_text = dossier_to_text(research_data)

    briefing = write_briefing_json(person, company, dossier_text, user_context)

    # Add the metadata and the full source list the UI needs.
    briefing["person"] = person
    briefing["company"] = company
    briefing["sources"] = collect_sources(research_data)

    return briefing