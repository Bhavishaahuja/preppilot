import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useBriefing } from '../BriefingContext'

const inputClass =
  "w-full h-12 rounded-lg border border-[#E0DAD0] bg-[#FCFBF9] px-3.5 text-[15.5px] text-ink outline-none focus:border-accent"

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
    <div className="flex justify-center px-14 py-16">
      <div className="w-[680px] flex flex-col items-center gap-8 text-center">

        <div className="flex flex-col items-center gap-3">
          <h1 className="font-serif text-[42px] leading-tight font-medium tracking-tight">Who are you meeting?</h1>
          <p className="max-w-[500px] text-[15.5px] leading-relaxed text-muted">
            Give me the person and company, or just paste their LinkedIn. I'll research them across six angles and hand you a cited briefing in about twenty seconds.
          </p>
        </div>

        <div className="w-full flex flex-col gap-5 rounded-2xl border border-line bg-card p-8 text-left">

          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-[#4A4842]">Person</label>
              <input className={inputClass} value={person} onChange={(e) => setPerson(e.target.value)} placeholder="e.g. Jordan Ellis" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-[#4A4842]">Company</label>
              <input className={inputClass} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Beacon Consulting" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-[#4A4842]">Their LinkedIn URL <span className="font-normal text-faint">(optional — helps pin down the right person)</span></label>
            <input className={inputClass} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://www.linkedin.com/in/jordan-ellis" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-[#4A4842]">What do you want out of this meeting?</label>
            <textarea
              className="h-24 w-full resize-none rounded-lg border border-[#E0DAD0] bg-[#FCFBF9] px-3.5 py-3 text-[14.5px] leading-relaxed text-[#33312D] outline-none focus:border-accent"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Learn about AI roles and get feedback on my portfolio..."
            />
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-[#EEE9E0] bg-paper p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-faint">PrepPilot will research</div>
            <div className="flex flex-wrap gap-2">
              {angles.map((angle) => (
                <span key={angle} className="rounded-lg border border-line bg-card px-3 py-1.5 text-[13px] text-[#4A4842]">{angle}</span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-2 text-xs text-faint">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
              <span>About twenty seconds · live web search</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-accent px-6 text-[14.5px] font-medium text-white disabled:opacity-50"
            >
              Build my briefing
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </div>

        </div>

        <div className="text-[13px] text-faint">
          Prepping as <span className="font-medium text-[#4A4842]">{userName || "you"}</span> · <Link to="/profile" className="text-accent hover:text-accent-ink">edit profile</Link>
        </div>

      </div>
    </div>
  )
}

export default NewMeeting
