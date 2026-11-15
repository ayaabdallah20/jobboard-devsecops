import { Route, Routes, useLocation } from 'react-router-dom'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import Protected from './components/Protected'
import Admin from './pages/Admin'
import { Login, Register } from './pages/Auth'
import Candidate from './pages/Candidate'
import Home from './pages/Home'
import JobDetail from './pages/JobDetail'
import Jobs from './pages/Jobs'
import NotFound from './pages/NotFound'
import Recruiter from './pages/Recruiter'

export default function App() {
  const { pathname } = useLocation()
  const bare = pathname === '/connexion' || pathname === '/inscription'
  return (
    <div className="flex min-h-screen flex-col">
      {!bare && <Navbar />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/offres" element={<Jobs />} />
          <Route path="/offres/:id" element={<JobDetail />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription" element={<Register />} />
          <Route path="/candidat" element={<Protected roles={['candidat']}><Candidate /></Protected>} />
          <Route path="/recruteur" element={<Protected roles={['recruteur']}><Recruiter /></Protected>} />
          <Route path="/admin" element={<Protected roles={['admin']}><Admin /></Protected>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {!bare && <Footer />}
    </div>
  )
}
