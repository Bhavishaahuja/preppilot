import { Link, Outlet } from 'react-router-dom'

function Layout() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* top bar, same as the mockups */}
      <header className="flex items-center justify-between px-14 py-5 border-b border-line">
        <Link to="/" className="flex items-center gap-3">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3D3AA6" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2.5 11 13" />
            <path d="M21.5 2.5 15 21l-4-8-8-4 18.5-6.5Z" />
          </svg>
          <span className="font-serif text-2xl font-medium tracking-tight">PrepPilot</span>
        </Link>
        <nav className="flex items-center gap-7 text-sm text-muted">
          <Link to="/profile" className="hover:text-ink">Profile</Link>
          <Link to="/" className="hover:text-ink">Briefings</Link>
          <div className="w-9 h-9 rounded-full bg-accent-soft text-accent-ink flex items-center justify-center text-xs font-semibold">BA</div>
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