// One shared Supabase client for the whole app. Built from env vars so the same
// code runs locally and on Vercel. If the keys aren't set yet, we export null and
// the UI shows a friendly "not configured" message instead of crashing.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && anonKey ? createClient(url, anonKey) : null
export const supabaseReady = Boolean(supabase)
