import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import NewMeeting from './pages/NewMeeting.jsx'
import Profile from './pages/Profile.jsx'
import Working from './pages/Working.jsx'
import Briefing from './pages/Briefing.jsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<NewMeeting />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/working" element={<Working />} />
        <Route path="/briefing" element={<Briefing />} />
      </Route>
    </Routes>
  )
}

export default App