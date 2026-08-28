# research.py
# Take the research plan and actually search the web for each question using Tavily.

from config import tavily_client
from plan import make_research_plan


def research_question(question):
    # Search the web for one question and keep the top few results.
    # search_depth="advanced" gives cleaner, more relevant results than the default.
    try:
        response = tavily_client.search(
            query=question,
            max_results=3,
            search_depth="advanced",
        )
    except Exception as e:
        # One failed search shouldn't kill the whole run, so skip it and keep going.
        print(f"  (search failed for '{question}': {e})")
        return []

    findings = []
    for result in response["results"]:
        findings.append({
            "title": result["title"],
            "url": result["url"],
            "snippet": result["content"],
        })
    return findings


def run_research(person, company, user_context=""):
    # First get the plan, then search every question in it.
    plan = make_research_plan(person, company, user_context)

    researched = {}
    for angle, questions in plan.items():
        # A value might come back as a single string, so wrap it in a list.
        if isinstance(questions, str):
            questions = [questions]

        angle_findings = []
        for question in questions:
            print(f"Searching: {question}")   # progress so you see it working
            results = research_question(question)
            angle_findings.append({
                "question": question,
                "results": results,
            })
        researched[angle] = angle_findings

    return researched


if __name__ == "__main__":
    person = input("Person: ")
    company = input("Company: ")

    data = run_research(person, company)

    print("\n\n===== RESEARCH DOSSIER =====")
    for angle, blocks in data.items():
        heading = angle.replace("_", " ").capitalize()
        print(f"\n\n## {heading}")
        for block in blocks:
            print(f"\nQ: {block['question']}")
            for r in block["results"]:
                print(f"  - {r['title']}")
                print(f"    {r['url']}")
                print(f"    {r['snippet'][:200]}...")