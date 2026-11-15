import { motion } from 'framer-motion'
import { Building2, Eye, EyeOff, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ErrorBox } from '../components/Common'
import Logo from '../components/Logo'
import { homeFor, useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'

function Shell({ title, subtitle, children }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-deep p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <svg className="absolute inset-0 h-full w-full opacity-40" aria-hidden>
          <defs><pattern id="g2" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#60A5FA" strokeOpacity=".25" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#g2)" />
        </svg>
        <motion.div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-royal-light/50 blur-3xl" animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 12, repeat: Infinity }} />
        <motion.div className="absolute -right-10 top-10 h-72 w-72 rounded-full bg-sky/30 blur-3xl" animate={{ x: [0, -30, 0], y: [0, 30, 0] }} transition={{ duration: 10, repeat: Infinity }} />
        <div className="relative"><Logo light /></div>
        <div className="relative max-w-md">
          <p className="font-display text-3xl font-bold leading-snug">Un seul espace pour publier, postuler et suivre les recrutements.</p>
          <p className="mt-4 text-blue-200">Candidats, recruteurs et administrateurs disposent chacun d'un espace adapté à leur rôle.</p>
        </div>
        <p className="relative text-sm text-blue-300">Aya Abdallah & Ameni Azouz — TEK-UP 2026-2027</p>
      </div>
      <div className="flex items-center justify-center px-5 py-24">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mb-8 mt-2 text-slate-500">{subtitle}</p>
          {children}
        </motion.div>
      </div>
    </main>
  )
}

function PasswordInput({ id, value, onChange, autoComplete }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input id={id} type={show ? 'text' : 'password'} className="input pr-10" value={value} onChange={onChange} autoComplete={autoComplete} required />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-royal" aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

export function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const u = await login(email, password)
      toast(`Bienvenue, ${u.full_name}`)
      nav(loc.state?.from || homeFor(u.role), { replace: true })
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <Shell title="Se connecter" subtitle="Accédez à votre espace JobBoard.">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label" htmlFor="email">Adresse e-mail</label><input id="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></div>
        <div><label className="label" htmlFor="pwd">Mot de passe</label><PasswordInput id="pwd" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
        <ErrorBox error={error} />
        <button className="btn-primary w-full py-3" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">Pas encore de compte ? <Link to="/inscription" className="font-semibold text-royal hover:underline">Créer un compte</Link></p>
    </Shell>
  )
}

export function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const [f, setF] = useState({ full_name: '', email: '', password: '', role: params.get('role') === 'recruteur' ? 'recruteur' : 'candidat', company: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const u = await register(f)
      toast('Compte créé')
      nav(homeFor(u.role), { replace: true })
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <Shell title="Créer un compte" subtitle="Choisissez votre profil pour commencer.">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Type de compte">
          {[{ v: 'candidat', l: 'Je cherche un emploi', i: UserRound }, { v: 'recruteur', l: 'Je recrute', i: Building2 }].map((o) => (
            <button type="button" role="radio" aria-checked={f.role === o.v} key={o.v} onClick={() => setF({ ...f, role: o.v })}
              className={`relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left text-sm font-semibold transition ${f.role === o.v ? 'border-royal bg-royal/5 text-royal' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
              <o.i className="h-5 w-5" />{o.l}
            </button>
          ))}
        </div>
        <div><label className="label" htmlFor="name">Nom complet</label><input id="name" className="input" value={f.full_name} onChange={set('full_name')} required /></div>
        {f.role === 'recruteur' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <label className="label" htmlFor="company">Entreprise</label><input id="company" className="input" value={f.company} onChange={set('company')} required />
          </motion.div>
        )}
        <div><label className="label" htmlFor="remail">Adresse e-mail</label><input id="remail" className="input" value={f.email} onChange={set('email')} autoComplete="email" required /></div>
        <div><label className="label" htmlFor="rpwd">Mot de passe</label><PasswordInput id="rpwd" value={f.password} onChange={set('password')} autoComplete="new-password" /></div>
        <ErrorBox error={error} />
        <button className="btn-primary w-full py-3" disabled={busy}>{busy ? 'Création…' : 'Créer mon compte'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">Déjà inscrit ? <Link to="/connexion" className="font-semibold text-royal hover:underline">Se connecter</Link></p>
    </Shell>
  )
}
