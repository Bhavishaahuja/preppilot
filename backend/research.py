# research.py
# Take the research plan and search the web for every question using Tavily.
# All searches run CONCURRENTLY (Tavily's client is blocking, so threads give us
# a big speedup) instead of one-at-a-time. This is the main fix for the ~90s wait.

from concurrent.futures import ThreadPoolExecutor, as_completed
from config import tavily_client
from plan import make_research_plan


def research_question(question):
    # Search the web for one question and keep the top few results.
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


def run_research(person, company, user_context="", person_linkedin=""):
    # First get the plan, then search every question in it -- all at once.
    plan = make_research_plan(person, company, user_context, person_linkedin)

    # Flatten the plan into a flat list of (angle, question) so we can fire
    # every search in parallel instead of looping through them sequentially.
    tasks = []
    for angle, questions in plan.items():
        if isinstance(questions, str):
            questions = [questions]
        for question in questions:
            tasks.append((angle, question))

    if not tasks:
        return {}

    results_by_angle = {}
    # ~12 questions -> a dozen workers means the whole research step takes about as
    # long as a single search (a few seconds) rather than the sum of all of them.
    with ThreadPoolExecutor(max_workers=min(12, len(tasks))) as pool:
        future_map = {
            pool.submit(research_question, question): (angle, question)
            for angle, question in tasks
        }
        for future in as_completed(future_map):
            angle, question = future_map[future]
            try:
                results = future.result()
            except Exception:
                results = []
            results_by_angle.setdefault(angle, []).append({
                "question": question,
                "results": results,
            })

    # Re-emit angles in the plan's original order so the dossier reads naturally.
    researched = {}
    for angle in plan.keys():
        if angle in results_by_angle:
            researched[angle] = results_by_angle[angle]
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
