import { AnimatePresence, motion } from 'framer-motion'
import { Briefcase, FileText, Inbox, Search, ShieldCheck, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { JobStatus } from '../components/Badges'
import { Page, Spinner } from '../components/Common'
import DashHeader from '../components/DashHeader'
import StatCard from '../components/StatCard'
import Tabs from '../components/Tabs'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { APP_STATUS, formatDate, initials, ROLE_LABEL } from '../lib/format'
import { useToast } from '../lib/toast'
import { ApplicationView } from './Recruiter'

function Bars({ data, labels, colors }) {
  const total = Object.values(data || {}).reduce((a, b) => a + b, 0) || 1
  return (
    <ul className="space-y-3">
      {Object.keys(labels).map((k, i) => (
        <li key={k}>
          <div className="mb-1 flex justify-between text-sm"><span>{labels[k]}</span><span className="font-semibold">{data?.[k] || 0}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <motion.div className={`h-full rounded-full ${colors[i % colors.length]}`} initial={{ width: 0 }} animate={{ width: `${((data?.[k] || 0) / total) * 100}%` }} transition={{ delay: 0.2 + i * 0.08, duration: 0.6 }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function UsersTable() {
  const { user: me } = useAuth()
  const toast = useToast()
  const [users, setUsers] = useState(null)
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const load = () => api('/api/admin/users').then(setUsers)
  useEffect(() => { load() }, [])
  const patch = async (u, body, msg) => { await api(`/api/admin/users/${u.id}`, { method: 'PATCH', body }); toast(msg); load() }
  if (!users) return <Spinner />
  const shown = users.filter((u) => (!role || u.role === role) && (`${u.full_name} ${u.email}`.toLowerCase().includes(q.toLowerCase())))
  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap gap-3 border-b p-4">
        <label className="relative flex-1"><span className="sr-only">Rechercher</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="input pl-9" placeholder="Nom ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <select aria-label="Filtrer par rôle" className="input w-auto" value={role} onChange={(e) => setRole(e.target.value)}><option value="">Tous les rôles</option>{Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs text-slate-500"><tr><th className="p-4 font-medium">Utilisateur</th><th className="p-4 font-medium">Rôle</th><th className="p-4 font-medium">Inscrit le</th><th className="p-4 font-medium">Compte</th></tr></thead>
          <tbody className="divide-y">
            <AnimatePresence>
              {shown.map((u) => (
                <motion.tr key={u.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={u.is_active ? '' : 'bg-slate-50 text-slate-400'}>
                  <td className="p-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-royal/10 text-xs font-bold text-royal">{initials(u.full_name)}</span><div><p className="font-medium text-ink">{u.full_name}</p><p className="text-xs">{u.email}</p></div></div></td>
                  <td className="p-4">
                    <select aria-label={`Rôle de ${u.full_name}`} className="input w-auto py-1.5" value={u.role} disabled={u.id === me.id} onChange={(e) => patch(u, { role: e.target.value }, 'Rôle mis à jour')}>
                      {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td className="whitespace-nowrap p-4">{formatDate(u.created_at)}</td>
                  <td className="p-4">
                    <button disabled={u.id === me.id} onClick={() => patch(u, { is_active: !u.is_active }, u.is_active ? 'Compte désactivé' : 'Compte activé')}
                      role="switch" aria-checked={u.is_active} aria-label={`Activer le compte de ${u.full_name}`}
                      className={`relative h-6 w-11 rounded-full transition disabled:opacity-40 ${u.is_active ? 'bg-royal' : 'bg-slate-300'}`}>
                      <motion.span layout className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow" style={{ left: u.is_active ? 22 : 2 }} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AllApplications() {
  const [list, setList] = useState(null)
  const [view, setView] = useState(null)
  const load = () => api('/api/applications/received').then(setList)
  useEffect(() => { load() }, [])
  if (!list) return <Spinner />
  return (
    <div className="panel divide-y">
      {list.map((a) => (
        <button key={a.id} onClick={() => setView(a.id)} className="flex w-full flex-wrap items-center gap-4 p-4 text-left transition hover:bg-mist/60">
          <div className="flex-1"><p className="font-medium">{a.candidate_name}</p><p className="text-sm text-slate-500">{a.job_title} — {a.company}</p></div>
          <span className="text-sm text-slate-500">{APP_STATUS[a.status]?.label}</span>
        </button>
      ))}
      <ApplicationView appId={view} onClose={() => setView(null)} onChanged={load} />
    </div>
  )
}

function AllJobs() {
  const [jobs, setJobs] = useState(null)
  useEffect(() => { api('/api/jobs').then(setJobs) }, [])
  if (!jobs) return <Spinner />
  return (
    <div className="panel divide-y">
      {jobs.map((j) => (
        <Link key={j.id} to={`/offres/${j.id}`} className="flex flex-wrap items-center gap-4 p-4 transition hover:bg-mist/60">
          <div className="flex-1"><p className="font-medium">{j.title}</p><p className="text-sm text-slate-500">{j.company} — {j.location}</p></div>
          <span className="text-sm text-slate-500">{j.applications_count} candidature(s)</span><JobStatus status={j.status} />
        </Link>
      ))}
    </div>
  )
}

export default function Admin() {
  const [s, setS] = useState(null)
  const [tab, setTab] = useState('users')
  useEffect(() => { api('/api/admin/stats').then(setS) }, [tab])
  return (
    <Page>
      <DashHeader title="Administration" subtitle="Comptes, rôles et activité de la plateforme." action={<span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm"><ShieldCheck className="h-4 w-4 text-sky" />Administrateur</span>} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Users} label="Utilisateurs" value={s?.users} />
        <StatCard icon={Briefcase} label="Offres" value={s?.jobs} accent="bg-sky/15 text-sky-700" delay={0.05} />
        <StatCard icon={Inbox} label="Candidatures" value={s?.applications} accent="bg-indigo-50 text-indigo-600" delay={0.1} />
        <StatCard icon={FileText} label="CV déposés" value={s?.cvs} accent="bg-emerald-50 text-emerald-600" delay={0.15} />
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="panel p-6"><h2 className="mb-4 text-base font-semibold">Utilisateurs par rôle</h2><Bars data={s?.users_by_role} labels={ROLE_LABEL} colors={['bg-royal', 'bg-sky', 'bg-deep']} /></div>
        <div className="panel p-6"><h2 className="mb-4 text-base font-semibold">Candidatures par statut</h2><Bars data={s?.applications_by_status} labels={Object.fromEntries(Object.entries(APP_STATUS).map(([k, v]) => [k, v.label]))} colors={['bg-slate-400', 'bg-sky', 'bg-royal', 'bg-emerald-500', 'bg-rose-500']} /></div>
      </div>
      <div className="mb-5"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'users', label: 'Utilisateurs', icon: Users }, { id: 'jobs', label: 'Offres', icon: Briefcase }, { id: 'apps', label: 'Candidatures', icon: Inbox }]} /></div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {tab === 'users' && <UsersTable />}
          {tab === 'jobs' && <AllJobs />}
          {tab === 'apps' && <AllApplications />}
        </motion.div>
      </AnimatePresence>
    </Page>
  )
}
