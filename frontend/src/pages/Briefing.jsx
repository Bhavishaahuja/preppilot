import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useBriefing, initialsFromName } from '../BriefingContext'

// Turn a full URL into a clean domain like "linkedin.com" for the little chips.
function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

// Build a plain-text version of the briefing (with source URLs) for the Copy button.
function briefingToText(b) {
  const lines = []
  lines.push(`Pre-Meeting Briefing: ${b.person} / ${b.company}`)
  if (b.person_linkedin) lines.push(b.person_linkedin)
  if (b.identity_note) lines.push(`Note: ${b.identity_note}`)
  lines.push("")
  lines.push("SNAPSHOT")
  lines.push(b.snapshot || "")
  lines.push("")
  lines.push("TALKING POINTS")
  ;(b.talking_points || []).forEach((tp) => {
    lines.push(`- ${tp.title}: ${tp.body}`)
    if (tp.sources && tp.sources.length) lines.push(`  sources: ${tp.sources.join(", ")}`)
  })
  lines.push("")
  lines.push("SMART QUESTIONS")
  ;(b.questions || []).forEach((q) => lines.push(`- ${q}`))
  lines.push("")
  lines.push("HOW YOU CAN HELP")
  ;(b.help_them || []).forEach((i) => lines.push(`- ${i}`))
  lines.push("")
  lines.push("HOW THEY CAN HELP")
  ;(b.help_me || []).forEach((i) => lines.push(`- ${i}`))
  lines.push("")
  lines.push("SOURCES")
  ;(b.sources || []).forEach((s, i) => lines.push(`[${i + 1}] ${s.title} — ${s.url}`))
  return lines.join("\n")
}

// The person's photo if we managed to fetch one (LinkedIn og:image), otherwise a grey
// blank avatar with their initials. `size` is the diameter in px.
function PersonAvatar({ photoUrl, name, size = 56 }) {
  const [failed, setFailed] = useState(false)
  const showPhoto = photoUrl && !failed
  const box = { width: size, height: size }
  if (showPhoto) {
    return (
      <img
        src={photoUrl}
        alt={name || "Contact"}
        onError={() => setFailed(true)}
        style={box}
        className="shrink-0 rounded-full border border-line object-cover"
      />
    )
  }
  return (
    <div
      style={{ ...box, fontSize: Math.round(size * 0.32) }}
      className="flex shrink-0 items-center justify-center rounded-full bg-[#EDE7DC] font-semibold text-faint"
    >
      {initialsFromName(name) || (
        <svg width={Math.round(size * 0.5)} height={Math.round(size * 0.5)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>
      )}
    </div>
  )
}

function SectionHeader({ number, title, small }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-soft font-serif text-[13px] font-semibold text-accent-ink">{number}</span>
      <h2 className={`font-serif font-semibold ${small ? "text-xl" : "text-[22px]"}`}>{title}</h2>
    </div>
  )
}

function Section({ number, title, children }) {
  return (
    <div className="briefing-card flex flex-col gap-3 rounded-2xl border border-line bg-card p-7">
      <SectionHeader number={number} title={title} />
      {children}
    </div>
  )
}

function Briefing() {
  const { briefing } = useBriefing()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  // If someone lands here without running a briefing, send them to start one.
  if (!briefing) {
    return (
      <div className="flex flex-col items-center gap-4 px-14 py-24 text-center">
        <h1 className="font-serif text-3xl font-medium">No briefing yet</h1>
        <p className="max-w-[420px] text-[15px] text-muted">Start a new meeting to generate a cited briefing.</p>
        <Link to="/new" className="inline-flex h-11 items-center rounded-lg bg-accent px-6 text-[14.5px] font-medium text-white">New meeting</Link>
      </div>
    )
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(briefingToText(briefing))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  function handleExport() {
    // Opens the browser print dialog -> choose "Save as PDF". Keeps text selectable
    // and links clickable, and the print CSS hides the nav/buttons.
    window.print()
  }

  const talkingPoints = briefing.talking_points || []
  const questions = briefing.questions || []
  const helpThem = briefing.help_them || []
  const helpMe = briefing.help_me || []
  const sources = briefing.sources || []

  return (
    <>
    <div className="mx-auto flex max-w-[1180px] flex-col gap-8 px-6 py-10 sm:px-14">

      {/* Hero — photo on the left, snapshot on the right */}
      <div className="briefing-card flex flex-col gap-5 rounded-2xl border border-line bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-[260px] flex-1 items-start gap-5">
            <PersonAvatar photoUrl={briefing.photo_url} name={briefing.person} size={112} />
            <div className="flex flex-1 flex-col gap-2.5">
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-faint2">Pre-Meeting Briefing</div>
              <h1 className="font-serif text-[32px] leading-[1.08] font-light tracking-[-0.02em] text-ink">
                {briefing.person} <span className="font-light text-[#A29B90]">/</span> {briefing.company}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-[13.5px] text-muted">
                <span>Prepared today</span>
                <span className="text-[#C9C2B5]">•</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-verified">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
                  {sources.length} sources
                </span>
                {briefing.person_linkedin && (
                  <>
                    <span className="text-[#C9C2B5]">•</span>
                    <a href={briefing.person_linkedin} target="_blank" rel="noreferrer" className="font-medium text-accent hover:text-accent-ink">LinkedIn</a>
                  </>
                )}
              </div>
              <p className="mt-1 text-[15px] leading-relaxed text-[#3B3833]">{briefing.snapshot}</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2 no-print">
            <button onClick={handleCopy} className="h-10 rounded-lg border border-[#D9D2C6] bg-card px-4 text-[13.5px] font-medium text-[#3B3833] hover:border-accent">{copied ? "Copied!" : "Copy"}</button>
            <button onClick={handleExport} className="h-10 rounded-lg bg-accent px-4 text-[13.5px] font-medium text-white">Export PDF</button>
          </div>
        </div>
      </div>

      {/* Identity caution — only when the name was ambiguous or unconfirmed */}
      {(briefing.identity_note || briefing.confidence === "low") && (
        <div className="flex gap-3 rounded-xl border border-[#E8C7A0] bg-[#FBF1E3] p-4 no-print">
          <svg className="mt-0.5 shrink-0 text-[#B5852F]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>
          <div className="text-[13px] leading-normal text-[#7A5A2E]">
            {briefing.identity_note ||
              "We couldn't fully confirm this is the right person — some sources may not match. Add their LinkedIn URL or exact job title and re-run for a tighter match."}
          </div>
        </div>
      )}

      {/* Body — everything else, below the hero */}
      <div className="briefing-grid grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_360px]">

        <div className="flex flex-col gap-8">

          <div className="briefing-card flex flex-col gap-3.5">
            <SectionHeader number="1" title="Talking points" />
            <div className="flex flex-col gap-3">
              {talkingPoints.map((tp, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-xl border border-line bg-card p-5">
                  <div className="text-[14.5px] font-semibold text-ink">{tp.title}</div>
                  <p className="text-[14.5px] leading-snug text-[#3B3833]">{tp.body}</p>
                  {tp.sources && tp.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {tp.sources.map((url, j) => (
                        <a key={j} href={url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#C9DCD0] bg-verified-soft px-2 py-0.5 text-xs font-medium text-verified">
                          {domainOf(url)}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Section number="2" title="Smart questions to ask">
            <div className="flex flex-col gap-3.5">
              {questions.map((q, i) => (
                <div key={i} className="flex gap-3">
                  <svg className="mt-0.5 shrink-0 text-accent" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 10h8M8 14h5"/><path d="M21 12a9 9 0 1 1-3.5-7.1L21 5"/></svg>
                  <span className="text-[14.5px] leading-snug text-[#3B3833]">{q}</span>
                </div>
              ))}
            </div>
          </Section>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="briefing-card flex flex-col gap-3.5 rounded-2xl border border-line bg-card p-6">
              <SectionHeader number="3" title="How you can help" small />
              <ul className="flex flex-col gap-3">
                {helpThem.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-[14px] leading-snug text-[#3B3833]"><span className="font-bold text-accent">+</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
            <div className="briefing-card flex flex-col gap-3.5 rounded-2xl border border-line bg-card p-6">
              <SectionHeader number="4" title="How they can help" small />
              <ul className="flex flex-col gap-3">
                {helpMe.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-[14px] leading-snug text-[#3B3833]"><span className="font-bold text-verified">&rarr;</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        <div className="flex flex-col gap-4">
          <div className="briefing-card flex flex-col gap-4 rounded-2xl border border-line bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-semibold">Sources</div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-verified-soft px-2.5 py-1 text-xs font-semibold text-verified">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                All verified
              </div>
            </div>
            <div className="h-px bg-[#EDE7DC]" />
            <div className="flex flex-col gap-3.5">
              {sources.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noreferrer" className="group flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent-soft text-xs font-semibold text-accent-ink">{i + 1}</span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[13.5px] font-medium text-ink group-hover:text-accent">{s.title}</span>
                    <span className="text-xs text-faint">{domainOf(s.url)}</span>
                    <span className="print-url text-[10px] text-faint break-all">{s.url}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-[#D3DDEA] bg-[#E7ECF3] p-5 no-print">
            <svg className="mt-0.5 shrink-0 text-accent" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z"/><path d="M9.5 12l1.8 1.8 3.2-3.6"/></svg>
            <div className="text-[13px] leading-normal text-[#3B3833]">Built only from live search results. Nothing here is invented. If the research didn't support a claim, PrepPilot left it out.</div>
          </div>
        </div>

      </div>
    </div>

    {/* Bottom action: move on to the next person you're prepping for. */}
    <div className="flex flex-col items-center gap-3 border-t border-line px-14 pb-16 pt-10 no-print">
      <p className="text-[14px] text-muted">Done here? Prep for your next meeting.</p>
      <button
        onClick={() => navigate("/new")}
        className="inline-flex h-12 items-center gap-2 rounded-lg bg-accent px-7 text-[15px] font-medium text-white hover:bg-accent-ink"
      >
        Start a new briefing
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>
    </div>
    </>
  )
}

export default Briefing
