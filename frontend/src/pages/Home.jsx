import { Link, useNavigate } from 'react-router-dom'
import { useBriefing } from '../BriefingContext'
import heroImg from '../assets/hero.png'

// Short, friendly date like "Aug 30" for the recent-briefing cards.
function shortDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" })
  } catch {
    return ""
  }
}

const angles = [
  "Their role",
  "Career history",
  "The company",
  "Connection points",
  "How you can help them",
  "How they can help you",
]

const valueProps = [
  {
    title: "Cited, never invented",
    body: "Every claim is built from live web results and linked to its source. If the research didn't support it, PrepPilot leaves it out.",
    icon: (
      <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z M9.5 12l1.8 1.8 3.2-3.6" />
    ),
  },
  {
    title: "Ready in about 20 seconds",
    body: "Six research angles run in parallel across the web, so a full briefing lands in the time it takes to refill your coffee.",
    icon: <path d="M12 7v5l3 2 M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />,
  },
  {
    title: "Built around you",
    body: "Your profile shapes every briefing — so the common ground and the \"how I can help\" angles are specific to you, not generic.",
    icon: <path d="M20 21a8 8 0 0 0-16 0 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />,
  },
  {
    title: "A two-way plan",
    body: "Not just talking points. PrepPilot shows how you can help them and how they can help you — so the meeting works both ways.",
    icon: <path d="M7 17 17 7 M8 7h9v9" />,
  },
]

const steps = [
  {
    n: "1",
    title: "Tell PrepPilot about you",
    body: "A one-time profile — who you are, what you're looking for, what you want from meetings.",
  },
  {
    n: "2",
    title: "Name who you're meeting",
    body: "The person and company, or just paste their LinkedIn. Add what you want out of the meeting.",
  },
  {
    n: "3",
    title: "Walk in ready",
    body: "Get a cited briefing: a snapshot, talking points, smart questions, and a two-way help plan.",
  },
]

function Home() {
  const { userName, history, historyLoaded, openBriefing } = useBriefing()
  const navigate = useNavigate()
  const recents = history.slice(0, 3)
  const firstName = (userName || "").trim().split(/\s+/)[0]

  function handleOpen(row) {
    openBriefing(row)
    navigate("/briefing")
  }

  return (
    <div className="flex flex-col items-center">

      {/* Hero */}
      <section className="flex w-full max-w-[860px] flex-col items-center gap-6 px-14 pt-20 pb-10 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1.5 text-[13px] font-medium text-accent-ink">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          Cited from live web research
        </span>
        <h1 className="font-serif text-[52px] leading-[1.05] font-medium tracking-tight">
          {firstName ? `Welcome back, ${firstName}.` : "Never walk into a meeting cold again."}
        </h1>
        <p className="max-w-[560px] text-[17px] leading-relaxed text-muted">
          PrepPilot researches anyone you're about to meet across six angles and hands you a
          cited, ready-to-use briefing in about twenty seconds — talking points, smart questions,
          and a plan for how you can help each other.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            onClick={() => navigate("/new")}
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-accent px-7 text-[15px] font-medium text-white hover:bg-accent-ink"
          >
            Build a briefing
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
          <Link
            to="/history"
            className="inline-flex h-12 items-center rounded-lg border border-[#E0DAD0] bg-card px-6 text-[15px] font-medium text-[#4A4842] hover:border-accent"
          >
            {history.length > 0 ? "Your past briefings" : "See how it works"}
          </Link>
        </div>
      </section>

      {/* Product preview */}
      <section className="w-full max-w-[900px] px-14 pb-4">
        <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_20px_60px_-30px_rgba(61,58,166,0.35)]">
          <img src={heroImg} alt="A PrepPilot briefing" className="w-full" />
        </div>
      </section>

      {/* Returning user: recent briefings */}
      {historyLoaded && recents.length > 0 && (
        <section className="w-full max-w-[900px] px-14 pt-12">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-serif text-[26px] font-medium tracking-tight">Pick up where you left off</h2>
            <Link to="/history" className="text-[14px] font-medium text-accent hover:text-accent-ink">View all →</Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {recents.map((row) => (
              <button
                key={row.id}
                onClick={() => handleOpen(row)}
                className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-5 text-left hover:border-accent"
              >
                <div className="text-[11px] font-medium uppercase tracking-wide text-faint">{shortDate(row.created_at)}</div>
                <div className="font-serif text-[19px] font-medium leading-tight text-ink">{row.person || "Contact"}</div>
                <div className="text-[13.5px] text-muted">{row.company}</div>
                <span className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent">
                  Open briefing
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Value props */}
      <section className="w-full max-w-[900px] px-14 pt-16">
        <div className="grid grid-cols-2 gap-4">
          {valueProps.map((v) => (
            <div key={v.title} className="flex flex-col gap-2.5 rounded-2xl border border-line bg-card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{v.icon}</svg>
              </span>
              <h3 className="text-[16px] font-semibold text-ink">{v.title}</h3>
              <p className="text-[14px] leading-relaxed text-muted">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="w-full max-w-[900px] px-14 pt-16">
        <h2 className="mb-6 text-center font-serif text-[30px] font-medium tracking-tight">How it works</h2>
        <div className="grid grid-cols-3 gap-5">
          {steps.map((s) => (
            <div key={s.n} className="flex flex-col gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[15px] font-semibold text-white">{s.n}</span>
              <h3 className="text-[16px] font-semibold text-ink">{s.title}</h3>
              <p className="text-[14px] leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The six angles */}
      <section className="w-full max-w-[900px] px-14 pt-16">
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-8">
          <div className="text-xs font-semibold uppercase tracking-wide text-faint">Every briefing researches</div>
          <div className="flex flex-wrap gap-2.5">
            {angles.map((a) => (
              <span key={a} className="rounded-lg border border-line bg-paper px-3.5 py-2 text-[14px] text-[#4A4842]">{a}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full max-w-[900px] px-14 py-20">
        <div className="flex flex-col items-center gap-5 rounded-3xl border border-[#E1E0F5] bg-[#F4F4FE] px-8 py-14 text-center">
          <h2 className="max-w-[520px] font-serif text-[34px] font-medium leading-tight tracking-tight">
            Your next meeting is worth twenty seconds of prep.
          </h2>
          <p className="max-w-[440px] text-[15px] leading-relaxed text-muted">
            Give PrepPilot a name and a company. Get a briefing you'd be glad to have read.
          </p>
          <button
            onClick={() => navigate("/new")}
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-accent px-7 text-[15px] font-medium text-white hover:bg-accent-ink"
          >
            Build a briefing
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </div>
      </section>

    </div>
  )
}

export default Home
