import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useBriefing } from '../BriefingContext'

const inputClass =
  "w-full h-12 rounded-lg border border-field bg-raised px-3.5 text-[15.5px] text-ink outline-none transition-colors focus:border-accent"
const labelClass = "text-[13px] font-medium text-ink2"
const microLabel = "text-[10px] font-medium uppercase tracking-[0.16em] text-faint2"

const angles = [
  "Their role",
  "Career history",
  "The company",
  "Connection points",
  "How you can help them",
  "How they can help you",
]

// If they gave a LinkedIn URL but no name, make a readable name out of the /in/ slug
// (e.g. linkedin.com/in/jordan-ellis-1a2b -> "Jordan Ellis").
function nameFromLinkedin(url) {
  try {
    const m = url.match(/linkedin\.com\/in\/([^/?#]+)/i)
    if (!m) return ""
    let slug = decodeURIComponent(m[1])
      .replace(/-[0-9a-z]{6,}$/i, "")   // strip a trailing hash segment
      .replace(/-?\d+$/,"")              // strip trailing numbers
    return slug.split("-").filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  } catch {
    return ""
  }
}

function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 py-0.5">
      <div className="h-px flex-1 bg-line" />
      <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-faint2">{label}</span>
      <div className="h-px flex-1 bg-line" />
    </div>
  )
}

function NewMeeting() {
  const [person, setPerson] = useState("")
  const [company, setCompany] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [goal, setGoal] = useState("")
  const { runBriefing, userName } = useBriefing()
  const navigate = useNavigate()

  function handleSubmit() {
    // Use the typed name, or fall back to a name derived from the LinkedIn URL.
    const effectivePerson = person.trim() || nameFromLinkedin(linkedin.trim())
    runBriefing({
      person: effectivePerson,
      company: company.trim(),
      goal,
      personLinkedin: linkedin.trim(),
    })
    navigate("/working")
  }

  // Ready to go once we have a company and either a name or a LinkedIn URL.
  const canSubmit = (person.trim() || linkedin.trim()) && company.trim()

  return (
    <div className="flex justify-center px-6 py-16 sm:px-14">
      <div className="w-full max-w-[660px] flex flex-col gap-8">

        <div className="flex flex-col gap-3">
          <span className={microLabel}>New briefing</span>
          <h1 className="font-serif text-[40px] leading-[1.06] font-light tracking-[-0.02em] text-ink">Who are you meeting?</h1>
          <p className="max-w-[520px] text-[15.5px] leading-relaxed text-muted">
            Paste their LinkedIn, or type the person and company. PrepPilot researches them across six angles and hands you a cited briefing in about twenty seconds.
          </p>
        </div>

        <div className="w-full flex flex-col gap-6 rounded-2xl border border-line bg-card p-6 sm:p-8">

          {/* LinkedIn quick input */}
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <span className={microLabel}>Paste their LinkedIn</span>
              <span className="text-[12.5px] leading-snug text-faint">Optional. Pins down the right person and fills their name — add the company below so the research covers where they work.</span>
            </div>
            <input className={inputClass} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://www.linkedin.com/in/jordan-ellis" />
          </div>

          <Divider label="or enter their details" />

          {/* Manual details */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Person</label>
              <input className={inputClass} value={person} onChange={(e) => setPerson(e.target.value)} placeholder="e.g. Jordan Ellis" />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Company <span className="font-normal text-faint2">(recommended)</span></label>
              <input className={inputClass} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Beacon Consulting" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>What do you want out of this meeting?</label>
            <textarea
              className="h-24 w-full resize-none rounded-lg border border-field bg-raised px-3.5 py-3 text-[14.5px] leading-relaxed text-ink2 outline-none transition-colors focus:border-accent"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Learn about AI roles and get feedback on my portfolio..."
            />
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-line-soft bg-sunken p-4">
            <div className={microLabel}>PrepPilot will research</div>
            <div className="flex flex-wrap gap-2">
              {angles.map((angle) => (
                <span key={angle} className="rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] text-ink2">{angle}</span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-0.5">
            <div className="flex items-center gap-2 text-[12px] text-faint2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
              <span>About twenty seconds · live web search</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-accent px-6 text-[14.5px] font-medium text-[#F6F3EE] transition hover:bg-accent-ink disabled:opacity-50"
            >
              Build my briefing
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </div>

        </div>

        <div className="text-center text-[13px] text-faint">
          Prepping as <span className="font-medium text-ink2">{userName || "you"}</span> · <Link to="/profile" className="font-medium text-accent hover:text-accent-ink">edit profile</Link>
        </div>

      </div>
    </div>
  )
}

export default NewMeeting
