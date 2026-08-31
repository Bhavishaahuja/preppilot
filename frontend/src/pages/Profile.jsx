import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import { useBriefing } from '../BriefingContext'

const inputClass =
  "w-full h-11 rounded-lg border border-field bg-raised px-3.5 text-[15px] text-ink outline-none transition-colors focus:border-accent"
const labelClass = "text-[13px] font-medium text-ink2"
const microLabel = "text-[10px] font-medium uppercase tracking-[0.16em] text-faint2"

function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 py-0.5">
      <div className="h-px flex-1 bg-line" />
      <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-faint2">{label}</span>
      <div className="h-px flex-1 bg-line" />
    </div>
  )
}

function Profile() {
  const { user } = useAuth()
  const { refreshProfile } = useBriefing()
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [about, setAbout] = useState("")
  const [lookingFor, setLookingFor] = useState("")
  const [meetingWants, setMeetingWants] = useState("")
  const [status, setStatus] = useState("")     // "", "saving", "saved", "error"
  const [errorMsg, setErrorMsg] = useState("")
  const [firstTime, setFirstTime] = useState(false)   // no saved profile yet = onboarding

  // Load this user's own profile row from Supabase.
  useEffect(() => {
    if (!supabase || !user) return
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          setFirstTime(true)   // brand-new user, this is their onboarding
          return
        }
        setName(data.name || "")
        setLocation(data.location || "")
        setLinkedin(data.linkedin || "")
        setAbout(data.about || "")
        setLookingFor(data.looking_for || "")
        setMeetingWants(data.meeting_wants || "")
      })
  }, [user])

  async function handleSave() {
    if (!supabase || !user) return
    setStatus("saving")

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      name,
      location,
      linkedin,
      about,
      looking_for: lookingFor,
      meeting_wants: meetingWants,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Profile save failed:", error)
      setErrorMsg(error.message || error.hint || error.details || "Unknown error")
      setStatus("error")
      return
    }
    setErrorMsg("")
    setStatus("saved")
    await refreshProfile()   // update the top-bar avatar initials right away
    // After saving, move straight on to building a briefing (first-timers and returning users alike).
    setTimeout(() => navigate("/new"), 650)
  }

  const saving = status === "saving" || status === "saved"

  return (
    <div className="flex justify-center px-6 pt-14 pb-20 sm:px-14">
      <div className="w-full max-w-[720px] flex flex-col gap-8">

        {/* heading */}
        <div className="flex flex-col gap-3">
          <span className={microLabel}>{firstTime ? "Step 1 · One-time setup" : "Your profile"}</span>
          <h1 className="font-serif text-[38px] leading-[1.08] font-light tracking-[-0.02em] text-ink">Tell PrepPilot about you</h1>
          <p className="max-w-[540px] text-[15px] leading-relaxed text-muted">
            {firstTime
              ? "First, who are you? Every briefing uses this to find real common ground and make the \"how I can help\" angles specific to you. Save, and you'll go straight to your first briefing."
              : "Every briefing uses your background to find real common ground and keep the \"how I can help\" angles specific, not generic. Saved to your account."}
          </p>
        </div>

        {/* form card */}
        <div className="flex flex-col gap-6 rounded-2xl border border-line bg-card p-6 sm:p-8">

          {/* LinkedIn quick input */}
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <span className={microLabel}>Paste your LinkedIn</span>
              <span className="text-[12.5px] leading-snug text-faint">Optional. It points the research at the right you — we don't scrape it, so your details below are what really shape briefings.</span>
            </div>
            <input className={inputClass} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://www.linkedin.com/in/your-handle" />
          </div>

          <Divider label="and tell us in your own words" />

          {/* Manual details */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Name</label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Location</label>
              <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, remote, etc." />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <label className={labelClass}>About you</label>
              <span className="text-[12px] text-faint2">Paste your LinkedIn "About", or write a few sentences</span>
            </div>
            <textarea
              className="h-40 w-full resize-none rounded-lg border border-field bg-raised px-3.5 py-3 text-[14.5px] leading-relaxed text-ink2 outline-none transition-colors focus:border-accent"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Final-year Data Science student at UIC, building agentic AI projects..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>What you're looking for</label>
            <input className={inputClass} value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} placeholder="Full-time AI/ML or product roles..." />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>What you usually want from a meeting</label>
            <input className={inputClass} value={meetingWants} onChange={(e) => setMeetingWants(e.target.value)} placeholder="Learn how people broke in, get feedback on my work..." />
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-2 text-[12px] text-faint2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>Private to your account</span>
            </div>
            <div className="flex items-center gap-3">
              {status === "saved" && <span className="text-[13px] font-medium text-verified">Saved ✓</span>}
              {status === "error" && <span className="text-[13px] font-medium text-red-600">Could not save</span>}
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-11 rounded-lg bg-accent px-6 text-[14.5px] font-medium text-[#F6F3EE] transition hover:bg-accent-ink disabled:opacity-60"
              >
                {status === "saving" ? "Saving..." : status === "saved" ? "Saved" : firstTime ? "Save and continue" : "Save and build a briefing"}
              </button>
            </div>
          </div>

          {status === "error" && errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-red-700">
              {errorMsg}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default Profile
