import { createContext, useContext, useState, useEffect } from 'react'
import { API } from './api'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'

const BriefingContext = createContext(null)

export function initialsFromName(name) {
  if (!name) return ""
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ""
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

// Turn the saved profile row into the plain-text block the backend expects.
function assembleProfileText(p) {
  if (!p) return ""
  const parts = []
  if (p.name) parts.push(`Name: ${p.name}`)
  if (p.location) parts.push(`Location: ${p.location}`)
  if (p.linkedin) parts.push(`LinkedIn: ${p.linkedin}`)
  if (p.about) parts.push(`\nAbout: ${p.about}`)
  if (p.looking_for) parts.push(`\nLooking for: ${p.looking_for}`)
  if (p.meeting_wants) parts.push(`\nWhat I want from meetings: ${p.meeting_wants}`)
  return parts.join("\n")
}

export function BriefingProvider({ children }) {
  const { user, getAccessToken } = useAuth()
  const [status, setStatus] = useState("idle")   // idle | loading | done | error
  const [briefing, setBriefing] = useState(null)
  const [error, setError] = useState("")
  const [target, setTarget] = useState({ person: "", company: "" })

  // The signed-in user's own profile row, which drives the avatar + onboarding gate.
  const [profile, setProfile] = useState(null)
  const [profileLoaded, setProfileLoaded] = useState(false)   // false until we've checked

  async function refreshProfile() {
    if (!supabase || !user) {
      setProfile(null)
      return
    }
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
    setProfile(data || null)
  }

  // Load (or clear) the profile whenever the signed-in user changes, and record when
  // that first check has finished so the app can decide where to route them.
  useEffect(() => {
    let active = true
    setProfileLoaded(false)
    refreshProfile().finally(() => {
      if (active) setProfileLoaded(true)
    })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const userName = profile?.name || ""
  const initials = initialsFromName(userName)

  async function runBriefing({ person, company, goal, personLinkedin }) {
    setStatus("loading")
    setError("")
    setBriefing(null)
    setTarget({ person, company })

    try {
      const token = await getAccessToken()
      const headers = { "Content-Type": "application/json" }
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(`${API}/briefing`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          person,
          company,
          goal,
          profile: assembleProfileText(profile),
          person_linkedin: personLinkedin || "",
        }),
      })
      if (!res.ok) throw new Error("The server had a problem building the briefing.")
      const data = await res.json()
      setBriefing(data)
      setStatus("done")
    } catch (err) {
      setError(err.message || "Something went wrong.")
      setStatus("error")
    }
  }

  const value = {
    status, briefing, error, target, runBriefing,
    profile, profileLoaded, userName, initials, refreshProfile,
  }
  return <BriefingContext.Provider value={value}>{children}</BriefingContext.Provider>
}

export function useBriefing() {
  return useContext(BriefingContext)
}
