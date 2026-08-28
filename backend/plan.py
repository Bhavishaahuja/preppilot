# plan.py
# Given a person and company, ask Claude to plan what to research before the meeting.

import json
from config import anthropic_client, MODEL, TODAY


def make_research_plan(person, company, user_context=""):
    # If we know who the user is, tell Claude so the connection angles get specific.
    about_me = ""
    if user_context:
        about_me = f"""
Here is context about me, the person doing the research:
{user_context}
Use this so the connection_points, how_i_can_help_them, and how_they_can_benefit_me angles are specific to me, not generic.
"""

    prompt = f"""You are a meeting-prep research assistant.
Today's date is {TODAY}. I'm about to meet {person} from {company}.
{about_me}
Plan my research across these six angles:
- role: what this person actually owns day to day and is measured on
- career_history: their LinkedIn/career trajectory and past companies
- company: what {company} does, recent news, priorities, challenges
- connection_points: shared background or common ground to open with
- how_i_can_help_them: where I could add value to their work or goals
- how_they_can_benefit_me: what I'd want to learn or ask them

For each angle, give 2 to 3 specific, searchable questions.
Write each as something you could paste into a search engine, including the person's name or company where useful.
Do not hardcode old years like 2024. Use "latest" or "{TODAY}" so searches return current results.
Return ONLY a JSON object where each key is an angle above and each value is a list of short strings. Nothing else."""

    resp = anthropic_client.messages.create(
        model=MODEL,
        max_tokens=900,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = resp.content[0].text.strip()

    try:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        plan = json.loads(raw[start:end])
    except (ValueError, json.JSONDecodeError):
        print("Could not read the plan as JSON. Here's what Claude returned:")
        print(raw)
        return {}

    return plan


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