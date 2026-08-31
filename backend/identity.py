# identity.py
# Disambiguation harness. Common names mean a web search for "Jordan Ellis" pulls back
# pages about several DIFFERENT Jordan Ellises. This step looks at every result we
# gathered and decides which ones actually refer to the specific person being met --
# the one who works at the given company, with one coherent role, career history and
# set of pronouns. Everything else (a same-name stranger) is dropped before we write
# the briefing, so the briefing and its sources only ever describe the right person.

from config import anthropic_client, MODEL


def _unique_results(research_data):
    # Flatten the dossier into a de-duplicated list of results, preserving order.
    seen = set()
    items = []
    for angle, blocks in research_data.items():
        for block in blocks:
            for r in block["results"]:
                url = r["url"]
                if url in seen:
                    continue
                seen.add(url)
                items.append({"url": url, "title": r["title"], "snippet": r.get("snippet", "")})
    return items


def resolve_identity(person, company, goal, person_linkedin, research_data):
    """Return {summary, confidence, note, matched_urls:set}.

    matched_urls is the set of source URLs that clearly refer to the target person.
    If empty, the caller should treat identity as unconfirmed (keep everything but warn).
    """
    items = _unique_results(research_data)
    if not person or not items:
        return {"summary": "", "confidence": "low", "note": "", "matched_urls": set()}

    catalog = "\n\n".join(
        f"[{i}] {it['title']} ({it['url']})\n{(it['snippet'] or '')[:320]}"
        for i, it in enumerate(items)
    )

    anchor = f"Name: {person}\nEmployer / company they work at: {company or '(unknown)'}"
    if goal:
        anchor += f"\nWhat the meeting is about: {goal}"
    if person_linkedin:
        anchor += f"\nTheir LinkedIn URL (a strong identity anchor): {person_linkedin}"

    tool = {
        "name": "resolve_identity",
        "description": "Decide which search results are about the specific target person, and summarize that person's confirmed identity.",
        "input_schema": {
            "type": "object",
            "properties": {
                "identity_summary": {
                    "type": "string",
                    "description": "1-2 sentences describing the target's CONFIRMED identity (role, employer, location, key career facts), using ONLY results that clearly refer to them. Empty string if you cannot confidently identify them.",
                },
                "confidence": {
                    "type": "string",
                    "enum": ["high", "medium", "low"],
                    "description": "high = the person is clearly identified and most results are about them; medium = identified but several results are ambiguous or about others; low = could not confidently tell which same-named person is the target.",
                },
                "note": {
                    "type": "string",
                    "description": "A single short sentence for the user ONLY IF several clearly different people share this name in the results (e.g., 'Several people share this name online — this briefing is limited to the one at Acme.'). Empty string when there is no real ambiguity.",
                },
                "matching_indices": {
                    "type": "array",
                    "items": {"type": "integer"},
                    "description": "Indices of the results that clearly refer to THIS person: consistent with the given employer AND with one coherent role, one career history, and consistent pronouns. EXCLUDE any result about a different same-named person (different employer, or conflicting role/seniority/career history/pronouns) and any result you cannot confidently attribute to the target.",
                },
            },
            "required": ["identity_summary", "confidence", "note", "matching_indices"],
        },
    }

    prompt = f"""I'm about to meet a specific person, and I gathered the web search results below. Because names are often shared, some results may be about DIFFERENT people who happen to have the same name.

TARGET PERSON (the only one this briefing is about):
{anchor}

Your job: decide which of the results clearly refer to THIS person — the one who works at {company or 'the stated company'}. A result only matches if it is consistent with that employer and with a single coherent identity: one role/seniority, one career history, and consistent pronouns across the sources. If a result is about someone at a different employer, or contradicts the role / career history / pronouns of the target, it is a DIFFERENT person — exclude it. If you cannot tell who a result is about, exclude it. Be strict: it is far better to drop a borderline result than to describe the wrong person.

Then summarize the target's confirmed identity from the matching results only, set a confidence level, and — only if the results clearly contain more than one distinct person with this name — write a one-line note the user should see.

RESULTS:
{catalog}

Call the resolve_identity tool."""

    try:
        resp = anthropic_client.messages.create(
            model=MODEL,
            max_tokens=900,
            tools=[tool],
            tool_choice={"type": "tool", "name": "resolve_identity"},
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as e:
        # If the disambiguation call fails, don't block the briefing -- fall back to
        # "keep everything, unconfirmed" so the pipeline still returns a result.
        print(f"  (identity resolution failed: {e})")
        return {"summary": "", "confidence": "low", "note": "", "matched_urls": set()}

    data = {}
    for block in resp.content:
        if block.type == "tool_use":
            data = block.input
            break

    matched = set()
    for i in data.get("matching_indices") or []:
        if isinstance(i, int) and 0 <= i < len(items):
            matched.add(items[i]["url"])

    return {
        "summary": (data.get("identity_summary") or "").strip(),
        "confidence": data.get("confidence") or "medium",
        "note": (data.get("note") or "").strip(),
        "matched_urls": matched,
    }
