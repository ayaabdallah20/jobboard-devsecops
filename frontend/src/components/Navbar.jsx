import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { homeFor, useAuth } from '../lib/auth'
import { initials, ROLE_LABEL } from '../lib/format'
import Logo from './Logo'

export default function Navbar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const onHero = loc.pathname === '/'

  useEffect(() => setOpen(false), [loc.pathname])
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 24)
    f(); window.addEventListener('scroll', f)
    return () => window.removeEventListener('scroll', f)
  }, [])

  const light = onHero && !scrolled
  const link = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${light ? (isActive ? 'text-white bg-white/10' : 'text-blue-100 hover:text-white') : isActive ? 'text-royal bg-royal/10' : 'text-slate-600 hover:text-ink'}`

  const doLogout = async () => { await logout(); nav('/') }

  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${light ? 'bg-transparent' : 'bg-white/85 shadow-line backdrop-blur-md'}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Logo light={light} />
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/offres" className={link}>Offres d'emploi</NavLink>
          {user && <NavLink to={homeFor(user.role)} className={link}>Mon espace</NavLink>}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link to={homeFor(user.role)} className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition hover:bg-royal/5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-royal to-sky text-xs font-bold text-white">{initials(user.full_name)}</span>
                <span className={`text-sm leading-tight ${light ? 'text-white' : ''}`}>
                  <span className="block font-semibold">{user.full_name}</span>
                  <span className={`block text-xs ${light ? 'text-blue-200' : 'text-slate-500'}`}>{ROLE_LABEL[user.role] || user.role}</span>
                </span>
              </Link>
              <button onClick={doLogout} className={`btn px-2.5 ${light ? 'text-white hover:bg-white/10' : 'btn-ghost'}`} aria-label="Se déconnecter" title="Se déconnecter">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/connexion" className={`btn ${light ? 'text-white hover:bg-white/10' : 'btn-ghost'}`}>Se connecter</Link>
              <Link to="/inscription" className={light ? 'btn bg-white text-royal hover:bg-blue-50' : 'btn-primary'}>Créer un compte</Link>
            </>
          )}
        </div>
        <button className={`md:hidden ${light ? 'text-white' : ''}`} onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t bg-white md:hidden">
            <div className="flex flex-col gap-1 p-4">
              <Link to="/offres" className="btn-ghost justify-start">Offres d'emploi</Link>
              {user ? (
                <>
                  <Link to={homeFor(user.role)} className="btn-ghost justify-start">Mon espace</Link>
                  <button onClick={doLogout} className="btn-ghost justify-start">Se déconnecter</button>
                </>
              ) : (
                <>
                  <Link to="/connexion" className="btn-ghost justify-start">Se connecter</Link>
                  <Link to="/inscription" className="btn-primary">Créer un compte</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
