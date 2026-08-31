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
  const [currentId, setCurrentId] = useState(null)   // id of the saved row being viewed, if any
  const [error, setError] = useState("")
  const [target, setTarget] = useState({ person: "", company: "" })

  // The signed-in user's own profile row, which drives the avatar + onboarding gate.
  const [profile, setProfile] = useState(null)
  const [profileLoaded, setProfileLoaded] = useState(false)   // false until we've checked

  // The user's saved briefings, newest first — powers the Home recents + History page.
  const [history, setHistory] = useState([])
  const [historyLoaded, setHistoryLoaded] = useState(false)

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

  // Pull the user's saved briefings (newest first). RLS keeps this to their own rows.
  async function loadHistory() {
    if (!supabase || !user) {
      setHistory([])
      return
    }
    const { data } = await supabase
      .from("briefings")
      .select("id, person, company, goal, data, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    setHistory(data || [])
  }

  // Load (or clear) the profile + history whenever the signed-in user changes, and record
  // when the first profile check finishes so the app can decide where to route them.
  useEffect(() => {
    let active = true
    setProfileLoaded(false)
    setHistoryLoaded(false)
    refreshProfile().finally(() => {
      if (active) setProfileLoaded(true)
    })
    loadHistory().finally(() => {
      if (active) setHistoryLoaded(true)
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
      setCurrentId(null)
      setStatus("done")

      // Save it to history (best-effort — a save hiccup must never block the briefing).
      if (supabase && user) {
        try {
          const { data: row } = await supabase
            .from("briefings")
            .insert({
              user_id: user.id,
              person: data.person || person || "",
              company: data.company || company || "",
              goal: goal || "",
              data,
            })
            .select("id, person, company, goal, data, created_at")
            .maybeSingle()
          if (row) {
            setHistory((h) => [row, ...h])
            setCurrentId(row.id)
          }
        } catch (saveErr) {
          console.error("Could not save briefing to history:", saveErr)
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong.")
      setStatus("error")
    }
  }

  // Reopen a saved briefing (from Home recents or the History page).
  function openBriefing(row) {
    if (!row?.data) return
    setBriefing(row.data)
    setTarget({ person: row.data.person || "", company: row.data.company || "" })
    setCurrentId(row.id || null)
    setError("")
    setStatus("done")
  }

  // Delete a saved briefing. RLS also enforces ownership server-side.
  async function deleteBriefing(id) {
    if (!supabase || !user || !id) return
    setHistory((h) => h.filter((r) => r.id !== id))   // optimistic
    const { error: delErr } = await supabase
      .from("briefings")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
    if (delErr) {
      console.error("Delete failed, reloading history:", delErr)
      loadHistory()
    }
  }

  const value = {
    status, briefing, currentId, error, target, runBriefing,
    profile, profileLoaded, userName, initials, refreshProfile,
    history, historyLoaded, loadHistory, openBriefing, deleteBriefing,
  }
  return <BriefingContext.Provider value={value}>{children}</BriefingContext.Provider>
}

export function useBriefing() {
  return useContext(BriefingContext)
}
