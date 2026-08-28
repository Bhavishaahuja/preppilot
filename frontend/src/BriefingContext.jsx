import { createContext, useContext, useState } from 'react'
import { API } from './api'

const BriefingContext = createContext(null)

export function BriefingProvider({ children }) {
  const [status, setStatus] = useState("idle")   // idle | loading | done | error
  const [briefing, setBriefing] = useState(null)
  const [error, setError] = useState("")
  const [target, setTarget] = useState({ person: "", company: "" })

  async function runBriefing({ person, company, goal }) {
    setStatus("loading")
    setError("")
    setBriefing(null)
    setTarget({ person, company })

    try {
      const res = await fetch(`${API}/briefing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person, company, goal }),
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

  const value = { status, briefing, error, target, runBriefing }
  return <BriefingContext.Provider value={value}>{children}</BriefingContext.Provider>
}

export function useBriefing() {
  return useContext(BriefingContext)
}