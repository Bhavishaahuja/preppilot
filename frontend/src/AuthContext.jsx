import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseReady } from './supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    // Load any existing session, then keep it in sync as the user logs in/out
    // (magic-link clicks land back here and are picked up automatically).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Send a magic link to the given email. Returns { error } like Supabase does.
  async function signInWithEmail(email) {
    if (!supabase) return { error: { message: "Supabase is not configured yet." } }
    return supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
  }

  // Grab the current access token to authorize API calls to our own backend.
  async function getAccessToken() {
    if (!supabase) return null
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || null
  }

  const value = {
    session,
    user: session?.user || null,
    loading,
    configured: supabaseReady,
    signInWithEmail,
    signOut,
    getAccessToken,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
