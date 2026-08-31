import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBriefing } from '../BriefingContext'

const angles = [
  "Their role",
  "Career history",
  "The company",
  "Connection points",
  "How you can help them",
  "How they can help you",
]

function Working() {
  const { status, target, error } = useBriefing()
  const navigate = useNavigate()
  const [active, setActive] = useState(0)

  // When the briefing is ready, move to it. If someone opened this page directly, go home.
  useEffect(() => {
    if (status === "done") navigate("/briefing")
    if (status === "idle") navigate("/")
  }, [status, navigate])

  // Cosmetic: rotate which angle looks "in progress" so the screen feels alive while we wait.
  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % angles.length)
    }, 3500)
    return () => clearInterval(id)
  }, [])

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-4 px-14 py-24 text-center">
        <h1 className="font-serif text-3xl font-medium">Something went wrong</h1>
        <p className="max-w-[440px] text-[15px] text-muted">{error || "The briefing could not be built. Check that the backend is running, then try again."}</p>
        <button onClick={() => navigate("/new")} className="h-11 rounded-lg bg-accent px-6 text-[14.5px] font-medium text-white">Try again</button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-[900px] flex-col items-center gap-8 px-14 py-20 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="text-[13px] font-medium text-faint">Preparing your briefing</div>
        <h1 className="font-serif text-[32px] leading-[1.1] font-light tracking-[-0.02em] text-ink">
          {target.person || "Your contact"} <span className="text-faint">·</span> {target.company}
        </h1>
      </div>

      {/* step tracker */}
      <div className="flex items-center gap-3 text-[13px] font-medium">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#C9DCD0] bg-verified-soft px-3.5 py-1.5 text-verified">Plan ready</span>
        <span className="h-px w-6 bg-[#C9C2B5]" />
        <span className="inline-flex items-center gap-2 rounded-full border border-[#CBD6E4] bg-accent-soft px-3.5 py-1.5 text-accent-ink">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#BCC6D6] border-t-accent" />
          Researching
        </span>
        <span className="h-px w-6 bg-[#C9C2B5]" />
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1.5 text-faint">Writing briefing</span>
      </div>

      {/* angle list */}
      <div className="w-full max-w-[440px] rounded-2xl border border-line bg-card p-4 text-left">
        {angles.map((angle, i) => (
          <div key={angle} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${i === active ? "bg-[#E7ECF3]" : ""}`}>
            {i < active ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-verified-soft">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2E6B4F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </span>
            ) : i === active ? (
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#BCC6D6] border-t-accent" />
            ) : (
              <span className="h-6 w-6 rounded-full border border-dashed border-[#C9C2B5]" />
            )}
            <span className={`text-[14.5px] ${i === active ? "font-semibold text-accent-ink" : i < active ? "text-ink" : "text-faint"}`}>{angle}</span>
          </div>
        ))}
      </div>

      <p className="text-[13px] text-faint">Searching the web and checking every source. This takes about a minute.</p>
    </div>
  )
}

export default Working