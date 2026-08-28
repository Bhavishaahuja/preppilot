import { useState, useEffect } from 'react'
import { API } from '../api'

const inputClass =
  "w-full h-11 rounded-lg border border-[#E0DAD0] bg-[#FCFBF9] px-3.5 text-[15px] text-ink outline-none focus:border-accent"

function Profile() {
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [about, setAbout] = useState("")
  const [lookingFor, setLookingFor] = useState("")
  const [meetingWants, setMeetingWants] = useState("")
  const [status, setStatus] = useState("")   // "", "saving", "saved", "error"

  // When the page loads, pull whatever profile is already saved on the backend.
  useEffect(() => {
    fetch(`${API}/profile`)
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setAbout(data.profile)
        }
      })
      .catch(() => {
        // If the backend isn't running yet, just leave the form empty.
      })
  }, [])

  async function handleSave() {
    setStatus("saving")

    // Fold the fields into one block of text, the same shape as me.txt.
    const parts = []
    if (name) parts.push(`Name: ${name}`)
    if (location) parts.push(`Location: ${location}`)
    if (about) parts.push(`\nAbout: ${about}`)
    if (lookingFor) parts.push(`\nLooking for: ${lookingFor}`)
    if (meetingWants) parts.push(`\nWhat I want from meetings: ${meetingWants}`)
    const profile = parts.join("\n")

    try {
      const res = await fetch(`${API}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      })
      if (!res.ok) throw new Error("bad response")
      setStatus("saved")
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className="flex justify-center px-14 pt-14 pb-16">
      <div className="w-[760px] flex flex-col gap-8">

        {/* heading */}
        <div className="flex flex-col gap-2.5">
          <span className="self-start rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-ink">One-time setup</span>
          <h1 className="font-serif text-4xl font-medium tracking-tight">Tell PrepPilot about you</h1>
          <p className="max-w-[560px] text-[15px] leading-relaxed text-muted">
            You only do this once. Every briefing uses your background to find real common ground and make the "how I can help" angles specific, not generic.
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
              <span>Saved on your machine as me.txt, never uploaded</span>
            </div>
            <div className="flex items-center gap-3">
              {status === "saved" && <span className="text-[13px] font-medium text-verified">Saved</span>}
              {status === "error" && <span className="text-[13px] font-medium text-red-600">Could not save</span>}
              <button
                onClick={handleSave}
                disabled={status === "saving"}
                className="h-11 rounded-lg bg-accent px-6 text-[14.5px] font-medium text-white disabled:opacity-60"
              >
                {status === "saving" ? "Saving..." : "Save profile"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Profile