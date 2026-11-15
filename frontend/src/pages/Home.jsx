import { motion } from 'framer-motion'
import { MapPin, Search, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import JobRow from '../components/JobRow'
import { api } from '../lib/api'
import { CONTRACTS } from '../lib/format'

const TYPED = ['Ingénieur DevSecOps', 'Développeur React', 'Analyste SOC', 'Administrateur Kubernetes', 'Stage PFE sécurité']

function useTyping(words) {
  const [text, setText] = useState('')
  useEffect(() => {
    let w = 0, i = 0, del = false, t
    const tick = () => {
      const word = words[w]
      i += del ? -1 : 1
      setText(word.slice(0, i))
      if (!del && i === word.length) { del = true; t = setTimeout(tick, 1600); return }
      if (del && i === 0) { del = false; w = (w + 1) % words.length }
      t = setTimeout(tick, del ? 35 : 70)
    }
    t = setTimeout(tick, 900)
    return () => clearTimeout(t)
  }, [words])
  return text
}

function NetworkLines() {
  // Lignes animées : les « connexions » entre candidats et recruteurs
  const paths = [
    'M-50 120 C 200 60, 380 220, 620 140 S 1000 40, 1500 160',
    'M-50 300 C 260 240, 420 400, 700 320 S 1100 220, 1500 330',
    'M-50 470 C 300 420, 520 560, 820 470 S 1200 380, 1500 500',
  ]
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1440 600" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="ln" x1="0" x2="1"><stop offset="0" stopColor="#38BDF8" stopOpacity="0" /><stop offset=".5" stopColor="#38BDF8" /><stop offset="1" stopColor="#38BDF8" stopOpacity="0" /></linearGradient>
        <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#60A5FA" strokeOpacity=".12" /></pattern>
      </defs>
      <rect width="1440" height="600" fill="url(#grid)" />
      {paths.map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke="#3B82F6" strokeOpacity=".25" strokeWidth="1.2" />
          <motion.path d={d} fill="none" stroke="url(#ln)" strokeWidth="2.2" strokeLinecap="round"
            initial={{ pathLength: 0.15, pathOffset: 0 }} animate={{ pathOffset: [0, 1] }}
            transition={{ duration: 6 + i * 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.8 }} />
        </g>
      ))}
    </svg>
  )
}

export default function Home() {
  const nav = useNavigate()
  const typed = useTyping(TYPED)
  const [q, setQ] = useState('')
  const [location, setLocation] = useState('')
  const [jobs, setJobs] = useState([])

  useEffect(() => { api('/api/jobs').then(setJobs).catch(() => {}) }, [])

  const submit = (e) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (location) p.set('location', location)
    nav(`/offres?${p}`)
  }

  const companies = new Set(jobs.map((j) => j.company)).size

  return (
    <>
      <section className="relative overflow-hidden bg-deep pb-28 pt-36 text-white">
        <NetworkLines />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-deep to-transparent" />
        <div className="relative mx-auto max-w-7xl px-5">
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="max-w-3xl text-4xl font-extrabold leading-[1.08] sm:text-6xl">
            Trouvez le poste qui vous correspond.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}
            className="mt-5 max-w-xl text-lg text-blue-100">
            Consultez les offres des entreprises, postulez avec votre CV et suivez chaque candidature jusqu'à la réponse du recruteur.
          </motion.p>

          <motion.form onSubmit={submit} initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-10 flex max-w-3xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/30 sm:flex-row">
            <label className="flex flex-1 items-center gap-3 px-3">
              <Search className="h-5 w-5 shrink-0 text-royal" />
              <span className="sr-only">Poste ou entreprise</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={typed || 'Poste ou entreprise'}
                className="h-12 w-full bg-transparent text-base text-ink placeholder:text-slate-400 focus:outline-none" />
            </label>
            <label className="flex items-center gap-3 border-t px-3 sm:w-56 sm:border-l sm:border-t-0">
              <MapPin className="h-5 w-5 shrink-0 text-slate-400" />
              <span className="sr-only">Ville</span>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ville"
                className="h-12 w-full bg-transparent text-base text-ink placeholder:text-slate-400 focus:outline-none" />
            </label>
            <button className="btn-primary h-12 px-7 text-base">Rechercher</button>
          </motion.form>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mt-6 flex flex-wrap gap-2">
            {CONTRACTS.map((c) => (
              <Link key={c} to={`/offres?contract=${c}`} className="rounded-full border border-white/20 px-3.5 py-1.5 text-sm text-blue-100 transition hover:border-sky hover:bg-white/5 hover:text-white">{c}</Link>
            ))}
          </motion.div>

          <motion.dl initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-14 flex flex-wrap gap-x-12 gap-y-4 text-sm text-blue-200">
            <div><dt className="sr-only">Offres</dt><dd><span className="font-display text-2xl font-bold text-white">{jobs.length}</span> offres publiées</dd></div>
            <div><dt className="sr-only">Entreprises</dt><dd><span className="font-display text-2xl font-bold text-white">{companies}</span> entreprises qui recrutent</dd></div>
          </motion.dl>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-7xl px-5">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold sm:text-3xl">Dernières offres</h2>
          <Link to="/offres" className="text-sm font-semibold text-royal hover:underline">Voir toutes les offres</Link>
        </div>
        <ul className="grid gap-3 lg:grid-cols-2">
          {jobs.slice(0, 6).map((j, i) => <JobRow key={j.id} job={j} index={i} />)}
        </ul>
      </section>

      <section className="mx-auto mt-20 max-w-7xl px-5">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-royal p-8 text-white sm:flex-row sm:items-center sm:p-10">
          <div className="flex items-center gap-4">
            <ShieldCheck className="h-10 w-10 shrink-0 text-sky" />
            <div>
              <h2 className="text-2xl font-bold">Vous recrutez ?</h2>
              <p className="text-blue-100">Créez un compte recruteur et publiez votre première offre en quelques minutes.</p>
            </div>
          </div>
          <Link to="/inscription?role=recruteur" className="btn bg-white px-6 text-royal hover:bg-blue-50">Créer un compte recruteur</Link>
        </div>
      </section>
    </>
  )
}
