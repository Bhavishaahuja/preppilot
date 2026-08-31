import { Link, Outlet } from 'react-router-dom'
import { useBriefing } from '../BriefingContext'
import { useAuth } from '../AuthContext'

function Layout() {
  const { initials } = useBriefing()
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* top bar, same as the mockups */}
      <header className="flex items-center justify-between px-14 py-5 border-b border-line">
        <Link to="/" className="flex items-center gap-3">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M21.5 2.5 L10.6 13.4" stroke="#21395C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21.5 2.5 L14.6 21.5 L10.6 13.4 L2.5 9.4 Z" stroke="#21395C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-serif text-2xl font-medium tracking-tight">PrepPilot</span>
        </Link>
        <nav className="flex items-center gap-7 text-sm text-muted">
          <Link to="/new" className="hover:text-ink">New briefing</Link>
          <Link to="/history" className="hover:text-ink">History</Link>
          <Link to="/profile" className="hover:text-ink">Profile</Link>
          <div className="flex items-center gap-3">
            {/* Avatar initials come from the signed-in user's profile name. */}
            {initials ? (
              <div className="w-9 h-9 rounded-full bg-accent-soft text-accent-ink flex items-center justify-center text-xs font-semibold" title={user?.email || "Your profile"}>
                {initials}
              </div>
            ) : (
              <Link to="/profile" className="w-9 h-9 rounded-full bg-[#ECE8E0] text-faint flex items-center justify-center" title="Set up your profile">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>
              </Link>
            )}
            <button onClick={signOut} className="text-[13px] font-medium text-faint hover:text-ink" title="Sign out">Sign out</button>
          </div>
        </nav>
      </header>

      {/* the active page shows up here */}
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
