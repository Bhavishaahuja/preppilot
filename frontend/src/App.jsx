import { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { useBriefing } from './BriefingContext'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import NewMeeting from './pages/NewMeeting.jsx'
import Profile from './pages/Profile.jsx'
import Working from './pages/Working.jsx'
import Briefing from './pages/Briefing.jsx'
import History from './pages/History.jsx'

function Splash() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-[#C7C6EE] border-t-accent" />
    </div>
  )
}

function App() {
  const { session, loading } = useAuth()
  const { profileLoaded, profile } = useBriefing()
  const navigate = useNavigate()
  const location = useLocation()

  // First-time users (no saved profile yet) start on the profile page so PrepPilot
  // knows who THEY are before asking who they're meeting.
  useEffect(() => {
    if (
      session &&
      profileLoaded &&
      !profile &&
      location.pathname !== "/profile"
    ) {
      navigate("/profile", { replace: true })
    }
  }, [session, profileLoaded, profile, location.pathname, navigate])

  if (loading) return <Splash />
  if (!session) return <Login />
  // Wait until we know whether they have a profile, so we don't flash the meeting
  // form before redirecting a new user to onboarding.
  if (!profileLoaded) return <Splash />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<NewMeeting />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/working" element={<Working />} />
        <Route path="/briefing" element={<Briefing />} />
      </Route>
    </Routes>
  )
}

export default App
