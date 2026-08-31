import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import { useBriefing } from '../BriefingContext'

const inputClass =
  "w-full h-11 rounded-lg border border-[#E0DAD0] bg-[#FCFBF9] px-3.5 text-[15px] text-ink outline-none focus:border-accent"

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
    // On first-time setup, flow straight into the first briefing.
    if (firstTime) navigate("/new")
  }

  return (
    <div className="flex justify-center px-14 pt-14 pb-16">
      <div className="w-[760px] flex flex-col gap-8">

        {/* heading */}
        <div className="flex flex-col gap-2.5">
          <span className="self-start rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-ink">
            {firstTime ? "Step 1 · One-time setup" : "Your profile"}
          </span>
          <h1 className="font-serif text-4xl font-medium tracking-tight">Tell PrepPilot about you</h1>
          <p className="max-w-[560px] text-[15px] leading-relaxed text-muted">
            {firstTime
              ? "First, tell PrepPilot who you are. Every briefing uses this to find real common ground and make the \"how I can help\" angles specific to you. Once you save, you'll move on to your first meeting."
              : "Every briefing uses your background to find real common ground and make the \"how I can help\" angles specific, not generic. Saved to your account."}
          </p>
        </div>

        {/* form card */}
        <div className="flex flex-col gap-6 rounded-2xl border border-line bg-card p-8">

          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-[#4A4842]">Name</label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-[#4A4842]">Location</label>
              <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, remote, etc." />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-[#4A4842]">LinkedIn URL <span className="font-normal text-faint">(optional)</span></label>
            <input className={inputClass} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://www.linkedin.com/in/your-handle" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <label className="text-[13px] font-medium text-[#4A4842]">About you</label>
              <span className="text-xs text-faint">Paste your LinkedIn "About", or write a few sentences</span>
            </div>
            <textarea
              className="h-40 w-full resize-none rounded-lg border border-[#E0DAD0] bg-[#FCFBF9] px-3.5 py-3 text-[14.5px] leading-relaxed text-[#33312D] outline-none focus:border-accent"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Final-year Data Science student at UIC, building agentic AI projects..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-[#4A4842]">What you're looking for</label>
            <input className={inputClass} value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} placeholder="Full-time AI/ML or product roles..." />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-[#4A4842]">What you usually want from a meeting</label>
            <input className={inputClass} value={meetingWants} onChange={(e) => setMeetingWants(e.target.value)} placeholder="Learn how people broke in, get feedback on my work..." />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-xs text-faint">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>Private to your account</span>
            </div>
            <div className="flex items-center gap-3">
              {status === "saved" && !firstTime && <span className="text-[13px] font-medium text-verified">Saved</span>}
              {status === "error" && <span className="text-[13px] font-medium text-red-600">Could not save</span>}
              <button
                onClick={handleSave}
                disabled={status === "saving"}
                className="h-11 rounded-lg bg-accent px-6 text-[14.5px] font-medium text-white disabled:opacity-60"
              >
                {status === "saving" ? "Saving..." : firstTime ? "Save and continue" : "Save profile"}
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
