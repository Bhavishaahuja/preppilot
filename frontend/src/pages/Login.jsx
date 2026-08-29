import { useState } from 'react'
import { useAuth } from '../AuthContext'

function Login() {
  const { signInWithEmail, configured } = useAuth()
  const [email, setEmail] = useState("")
  const [state, setState] = useState("idle")   // idle | sending | sent | error
  const [message, setMessage] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setState("sending")
    const { error } = await signInWithEmail(email.trim())
    if (error) {
      setState("error")
      setMessage(error.message || "Could not send the link. Try again.")
    } else {
      setState("sent")
    }
  }

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <header className="flex items-center gap-3 px-14 py-5 border-b border-line">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3D3AA6" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.5 2.5 11 13" />
          <path d="M21.5 2.5 15 21l-4-8-8-4 18.5-6.5Z" />
        </svg>
        <span className="font-serif text-2xl font-medium tracking-tight">PrepPilot</span>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-[420px] flex flex-col gap-7">
          <div className="flex flex-col gap-2.5 text-center">
            <h1 className="font-serif text-4xl font-medium tracking-tight">Sign in to PrepPilot</h1>
            <p className="text-[15px] leading-relaxed text-muted">
              Enter your email and we'll send you a magic link. No password to remember.
            </p>
          </div>

          {!configured ? (
            <div className="rounded-xl border border-[#E8C7A0] bg-[#FBF1E3] p-5 text-[14px] leading-relaxed text-[#7A5A2E]">
              Sign-in isn't configured yet. Add <code className="font-mono text-[13px]">VITE_SUPABASE_URL</code> and <code className="font-mono text-[13px]">VITE_SUPABASE_ANON_KEY</code> to the frontend environment, then reload.
            </div>
          ) : state === "sent" ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#BFE4DA] bg-verified-soft p-7 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B6B57" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z" opacity="0"/><path d="M22 6l-10 7L2 6"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>
              </span>
              <div className="font-serif text-xl font-medium text-verified">Check your inbox</div>
              <p className="text-[14px] leading-relaxed text-[#33312D]">
                We sent a sign-in link to <span className="font-medium">{email}</span>. Click it and you'll be dropped right back here, signed in.
              </p>
              <button onClick={() => setState("idle")} className="text-[13px] font-medium text-accent hover:text-accent-ink">Use a different email</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-7">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-[#4A4842]">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full h-11 rounded-lg border border-[#E0DAD0] bg-[#FCFBF9] px-3.5 text-[15px] text-ink outline-none focus:border-accent"
                />
              </div>
              {state === "error" && <span className="text-[13px] font-medium text-red-600">{message}</span>}
              <button
                type="submit"
                disabled={state === "sending"}
                className="h-11 rounded-lg bg-accent px-6 text-[14.5px] font-medium text-white disabled:opacity-60"
              >
                {state === "sending" ? "Sending..." : "Send magic link"}
              </button>
            </form>
          )}

          <p className="text-center text-[12.5px] text-faint">
            Your profile and briefings are private to your account.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
