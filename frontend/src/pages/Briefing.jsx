import { Link } from 'react-router-dom'
import { useBriefing } from '../BriefingContext'

// Turn a full URL into a clean domain like "linkedin.com" for the little chips.
function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
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
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-7">
      <SectionHeader number={number} title={title} />
      {children}
    </div>
  )
}

function Briefing() {
  const { briefing } = useBriefing()

  // If someone lands here without running a briefing, send them to start one.
  if (!briefing) {
    return (
      <div className="flex flex-col items-center gap-4 px-14 py-24 text-center">
        <h1 className="font-serif text-3xl font-medium">No briefing yet</h1>
        <p className="max-w-[420px] text-[15px] text-muted">Start a new meeting to generate a cited briefing.</p>
        <Link to="/" className="inline-flex h-11 items-center rounded-lg bg-accent px-6 text-[14.5px] font-medium text-white">New meeting</Link>
      </div>
    )
  }

  // Some fields can be missing depending on what the model returned, so default to empty lists.
  const talkingPoints = briefing.talking_points || []
  const questions = briefing.questions || []
  const helpThem = briefing.help_them || []
  const helpMe = briefing.help_me || []
  const sources = briefing.sources || []

  return (
    <div className="grid grid-cols-[1fr_360px] items-start gap-10 px-14 py-10">

      <div className="flex flex-col gap-8">

        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-2.5">
            <div className="text-[13px] font-medium uppercase tracking-wide text-faint">Pre-Meeting Briefing</div>
            <h1 className="font-serif text-4xl font-medium tracking-tight">
              {briefing.person} <span className="font-normal text-[#B4AFA6]">/</span> {briefing.company}
            </h1>
            <div className="flex items-center gap-3.5 text-[13.5px] text-muted">
              <span>Prepared today</span>
              <span className="text-[#D9D3C9]">•</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-verified">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
                {sources.length} sources
              </span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button className="h-10 rounded-lg border border-[#E0DAD0] bg-card px-4 text-[13.5px] font-medium text-[#4A4842]">Copy</button>
            <button className="h-10 rounded-lg border border-[#E0DAD0] bg-card px-4 text-[13.5px] font-medium text-[#4A4842]">Export</button>
          </div>
        </div>

        <Section number="1" title="Snapshot">
          <p className="text-[15px] leading-relaxed text-[#33312D]">{briefing.snapshot}</p>
        </Section>

        <div className="flex flex-col gap-3.5">
          <SectionHeader number="2" title="Talking points" />
          <div className="flex flex-col gap-3">
            {talkingPoints.map((tp, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-xl border border-line bg-card p-5">
                <div className="text-[14.5px] font-semibold text-ink">{tp.title}</div>
                <p className="text-[14.5px] leading-snug text-[#4A4842]">{tp.body}</p>
                {tp.sources && tp.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {tp.sources.map((url, j) => (
                      <a key={j} href={url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#C9E7DE] bg-verified-soft px-2 py-0.5 text-xs font-medium text-verified">
                        {domainOf(url)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Section number="3" title="Smart questions to ask">
          <div className="flex flex-col gap-3.5">
            {questions.map((q, i) => (
              <div key={i} className="flex gap-3">
                <svg className="mt-0.5 shrink-0 text-accent" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 10h8M8 14h5"/><path d="M21 12a9 9 0 1 1-3.5-7.1L21 5"/></svg>
                <span className="text-[14.5px] leading-snug text-[#33312D]">{q}</span>
              </div>
            ))}
          </div>
        </Section>

        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-3.5 rounded-2xl border border-line bg-card p-6">
            <SectionHeader number="4" title="How you can help" small />
            <ul className="flex flex-col gap-3">
              {helpThem.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-[14px] leading-snug text-[#4A4842]"><span className="font-bold text-accent">+</span><span>{item}</span></li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3.5 rounded-2xl border border-line bg-card p-6">
            <SectionHeader number="5" title="How they can help" small />
            <ul className="flex flex-col gap-3">
              {helpMe.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-[14px] leading-snug text-[#4A4842]"><span className="font-bold text-verified">→</span><span>{item}</span></li>
              ))}
            </ul>
          </div>
        </div>

      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="text-[15px] font-semibold">Sources</div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-verified-soft px-2.5 py-1 text-xs font-semibold text-verified">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              All verified
            </div>
          </div>
          <div className="h-px bg-[#EEE9E0]" />
          <div className="flex flex-col gap-3.5">
            {sources.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noreferrer" className="group flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent-soft text-xs font-semibold text-accent-ink">{i + 1}</span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13.5px] font-medium text-ink group-hover:text-accent">{s.title}</span>
                  <span className="text-xs text-faint">{domainOf(s.url)}</span>
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="flex gap-3 rounded-xl border border-[#E1E0F5] bg-[#F4F4FE] p-5">
          <svg className="mt-0.5 shrink-0 text-accent" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z"/><path d="M9.5 12l1.8 1.8 3.2-3.6"/></svg>
          <div className="text-[13px] leading-normal text-[#4A4842]">Built only from live search results. Nothing here is invented. If the research didn't support a claim, PrepPilot left it out.</div>
        </div>
      </div>

    </div>
  )
}

export default Briefing