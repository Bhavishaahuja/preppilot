# plan.py
# Given a person and company, ask Claude to plan what to research before the meeting.
#
# Hardened (Day 3): instead of asking for JSON text and parsing it (which could fail
# silently and return an empty plan -> empty briefing), we force a tool call whose
# schema IS the plan. The answer always comes back as structured data. Same pattern
# that fixed the briefing step.

from config import anthropic_client, MODEL, TODAY

# The six angles, in the order we want them researched and shown.
ANGLES = [
    "role",
    "career_history",
    "company",
    "connection_points",
    "how_i_can_help_them",
    "how_they_can_benefit_me",
]

# What each angle means, used both in the prompt and as the tool-schema descriptions.
ANGLE_GUIDE = {
    "role": "what this person actually owns day to day and is measured on",
    "career_history": "their LinkedIn/career trajectory and past companies",
    "company": "what the company does, recent news, priorities, challenges",
    "connection_points": "shared background or common ground to open with",
    "how_i_can_help_them": "where I could add value to their work or goals",
    "how_they_can_benefit_me": "what I'd want to learn or ask them",
}


def make_research_plan(person, company, user_context="", person_linkedin=""):
    # If we know who the user is, tell Claude so the connection angles get specific.
    about_me = ""
    if user_context:
        about_me = f"""
Here is context about me, the person doing the research:
{user_context}
Use this so the connection_points, how_i_can_help_them, and how_they_can_benefit_me angles are specific to me, not generic.
"""

    # If the user pasted the person's LinkedIn URL, hand it over as an identity anchor.
    linkedin_hint = ""
    if person_linkedin:
        linkedin_hint = f"\nThe person's LinkedIn profile is: {person_linkedin}\nUse it to identify the right person and you may search that URL directly.\n"

    # Build the tool schema: one array of questions per angle, exactly the shape we want back.
    properties = {
        angle: {
            "type": "array",
            "items": {"type": "string"},
            "description": f"Exactly 2 specific, searchable questions about {ANGLE_GUIDE[angle]}.",
        }
        for angle in ANGLES
    }
    plan_tool = {
        "name": "save_research_plan",
        "description": "Save the meeting-prep research plan: exactly 2 searchable questions for each of the six angles.",
        "input_schema": {
            "type": "object",
            "properties": properties,
            "required": ANGLES,
        },
    }

    angle_lines = "\n".join(f"- {angle}: {ANGLE_GUIDE[angle]}" for angle in ANGLES)
    prompt = f"""You are a meeting-prep research assistant.
Today's date is {TODAY}. I'm about to meet {person} from {company}.
{about_me}{linkedin_hint}
Plan my research across these six angles:
{angle_lines}

For each angle, give EXACTLY 2 questions, each written so I could paste it straight into a search engine (include the person's name or company where useful).
Do not hardcode old years like 2024. Use "latest" or "{TODAY}" so searches return current results.
Call the save_research_plan tool with the finished plan."""

    resp = anthropic_client.messages.create(
        model=MODEL,
        max_tokens=1000,
        tools=[plan_tool],
        tool_choice={"type": "tool", "name": "save_research_plan"},
        messages=[{"role": "user", "content": prompt}],
    )

    # Because we forced the tool call, the plan comes back already structured.
    for block in resp.content:
        if block.type == "tool_use":
            return block.input

    # Extremely unlikely fallback so research never crashes on a missing tool block.
    return {}


if __name__ == "__main__":
    person = input("Person: ")
    company = input("Company: ")

    plan = make_research_plan(person, company)

    print("\nResearch plan:")
    for angle, items in plan.items():
        heading = angle.replace("_", " ").capitalize()
        print(f"\n{heading}:")
        if isinstance(items, str):
            print(f"  - {items}")
        else:
            for item in items:
                print(f"  - {item}")
