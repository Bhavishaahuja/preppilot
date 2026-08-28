# briefing.py
# Turn the raw research dossier into a finished, cited pre-meeting briefing.

from config import anthropic_client, MODEL
from research import run_research


def get_user_profile():
    # Read your background from me.txt. If it's not there yet, ask once and save it.
    try:
        with open("me.txt", "r", encoding="utf-8") as f:
            profile = f.read().strip()
            if profile:
                return profile
    except FileNotFoundError:
        pass

    print("First-time setup: tell me about you, so briefings can find real common ground.")
    print("(Paste your LinkedIn About section, or just write a few sentences.)")
    profile = input("About you: ").strip()

    # Save it so you never have to type it again.
    with open("me.txt", "w", encoding="utf-8") as f:
        f.write(profile)

    return profile


def dossier_to_text(data):
    # Flatten the research into plain text Claude can read, keeping URLs so it can cite them.
    lines = []
    for angle, blocks in data.items():
        heading = angle.replace("_", " ").capitalize()
        lines.append(f"\n## {heading}")
        for block in blocks:
            lines.append(f"\nQuestion: {block['question']}")
            for r in block["results"]:
                lines.append(f"- {r['title']} ({r['url']})")
                lines.append(f"  {r['snippet']}")
    return "\n".join(lines)


def write_briefing(person, company, dossier_text, user_context=""):
    prompt = f"""You are a meeting-prep assistant. I'm about to meet {person} from {company}.

Here is context about me, the person you're prepping:
{user_context}

Below is raw research I gathered from the web, grouped by angle. Each item has a source URL.

Using ONLY this research (plus what you know about me above), write me a tight pre-meeting briefing in markdown with these sections:

1. Snapshot: 3 to 4 sentences on who they are and what they're focused on right now.
2. Talking points: 3 to 5 bullets I can bring up. Call out genuine common ground between me and them (shared city, field, background, interests) where the research supports it. Put the source URL in parentheses after each.
3. Smart questions: 3 to 5 thoughtful questions I could ask them.
4. How I can help them: base this on MY background and skills versus what they need. 2 to 3 bullets.
5. How they can help me: base this on what I want out of this meeting. 2 to 3 bullets.

Start directly with the "## 1. Snapshot" section. Do not add a title at the top.
Be specific and use real facts from the research. Do not make up anything the research doesn't support."""

    prompt = prompt + f"\n\nRESEARCH:\n{dossier_text}"

    try:
        resp = anthropic_client.messages.create(
            model=MODEL,
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
        return resp.content[0].text
    except Exception as e:
        print(f"Briefing generation failed: {e}")
        return ""


if __name__ == "__main__":
    profile = get_user_profile()

    person = input("Person: ")
    company = input("Company: ")
    goal = input("What do you want out of this meeting? ").strip()

    # Bundle who you are and what you want into one block of context.
    user_context = f"My background: {profile}\nWhat I want from this meeting: {goal}"

    print("\nResearching, this takes a minute...\n")
    data = run_research(person, company, user_context)

    dossier_text = dossier_to_text(data)
    briefing = write_briefing(person, company, dossier_text, user_context)

    if not briefing:
        print("No briefing was generated, stopping.")
    else:
        print("\n\n===== BRIEFING =====\n")
        print(briefing)

        filename = f"briefing_{person.replace(' ', '_')}.md"
        with open(filename, "w", encoding="utf-8") as f:
            f.write(f"# Pre-Meeting Briefing: {person} ({company})\n\n")
            f.write(briefing)

        print(f"\n\nSaved to {filename}")