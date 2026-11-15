import { AnimatePresence, motion } from 'framer-motion'
import { Briefcase, CalendarDays, Download, Eye, FileText, Inbox, Mail, MapPin, Pencil, Phone, Plus, Trash2, UserRound, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppStatus, JobStatus } from '../components/Badges'
import { ErrorBox, Empty, Page, Spinner } from '../components/Common'
import DashHeader from '../components/DashHeader'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'
import Tabs from '../components/Tabs'
import { api, downloadCv } from '../lib/api'
import { useAuth } from '../lib/auth'
import { APP_STATUS, CONTRACTS, formatDate, initials, REMOTE, timeAgo } from '../lib/format'
import { useToast } from '../lib/toast'
import { ProfileForm } from './Candidate'

const EMPTY = { title: '', company: '', location: '', contract_type: 'CDI', salary: '', remote: 'Sur site', description: '', requirements: '', status: 'published' }

export function JobForm({ open, onClose, job, onSaved }) {
  const { user } = useAuth()
  const toast = useToast()
  const [f, setF] = useState(EMPTY)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (open) { setF(job ? { ...EMPTY, ...job, salary: job.salary || '', requirements: job.requirements || '' } : { ...EMPTY, company: user.company || '' }); setError('') } }, [open, job, user])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('')
    const body = { title: f.title, company: f.company, location: f.location, contract_type: f.contract_type, salary: f.salary || null, remote: f.remote, description: f.description, requirements: f.requirements || null, status: f.status }
    try {
      await api(job ? `/api/jobs/${job.id}` : '/api/jobs', { method: job ? 'PUT' : 'POST', body })
      toast(job ? 'Offre mise à jour' : f.status === 'published' ? 'Offre publiée' : 'Brouillon enregistré')
      onSaved(); onClose()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={job ? "Modifier l'offre" : 'Nouvelle offre'} wide>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="jt">Intitulé du poste</label><input id="jt" className="input" value={f.title} onChange={set('title')} required /></div>
        <div><label className="label" htmlFor="jc">Entreprise</label><input id="jc" className="input" value={f.company} onChange={set('company')} required /></div>
        <div><label className="label" htmlFor="jl">Ville</label><input id="jl" className="input" value={f.location} onChange={set('location')} required /></div>
        <div><label className="label" htmlFor="jk">Contrat</label><select id="jk" className="input" value={f.contract_type} onChange={set('contract_type')}>{CONTRACTS.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div><label className="label" htmlFor="jr">Mode de travail</label><select id="jr" className="input" value={f.remote} onChange={set('remote')}>{REMOTE.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="js">Salaire</label><input id="js" className="input" value={f.salary} onChange={set('salary')} placeholder="ex. 2 500 – 3 000 TND" /></div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="jd">Description</label>
          <textarea id="jd" rows={7} className="input font-mono text-[13px]" value={f.description} onChange={set('description')} required />
          <p className="mt-1 text-xs text-slate-500">Mise en forme HTML acceptée : &lt;p&gt;, &lt;b&gt;, &lt;ul&gt;&lt;li&gt;…</p>
        </div>
        <div className="sm:col-span-2"><label className="label" htmlFor="jq">Profil recherché</label><textarea id="jq" rows={3} className="input" value={f.requirements} onChange={set('requirements')} /></div>
        <div className="sm:col-span-2"><ErrorBox error={error} /></div>
        <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
          <button type="button" onClick={onClose} className="btn-ghost">Annuler</button>
          {!job && <button type="submit" onClick={() => setF((s) => ({ ...s, status: 'draft' }))} className="btn-outline" disabled={busy}>Enregistrer en brouillon</button>}
          <button type="submit" onClick={() => !job && setF((s) => ({ ...s, status: 'published' }))} className="btn-primary" disabled={busy}>{job ? 'Enregistrer' : "Publier l'offre"}</button>
        </div>
      </form>
    </Modal>
  )
}

export function ApplicationView({ appId, onClose, onChanged }) {
  const toast = useToast()
  const [a, setA] = useState(null)
  useEffect(() => { setA(null); if (appId) api(`/api/applications/${appId}`).then(setA) }, [appId])
  const change = async (status) => {
    const r = await api(`/api/applications/${appId}/status`, { method: 'PATCH', body: { status } })
    setA({ ...a, status: r.status }); toast(`Statut : ${APP_STATUS[status].label}`); onChanged?.()
  }
  const c = a?.candidate
  return (
    <Modal open={!!appId} onClose={onClose} title="Candidature" wide>
      {!a ? <Spinner /> : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-royal to-sky font-display text-lg font-bold text-white">{initials(c?.full_name)}</span>
            <div className="flex-1">
              <p className="font-display text-xl font-semibold">{c?.full_name}</p>
              <p className="text-sm text-royal">{c?.headline}</p>
              <p className="text-sm text-slate-500">Pour : {a.job_title}</p>
            </div>
            <AppStatus status={a.status} />
          </div>
          <dl className="grid gap-3 rounded-xl bg-mist p-4 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-royal" /><dt className="sr-only">E-mail</dt><dd>{c?.email}</dd></div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-royal" /><dt className="sr-only">Téléphone</dt><dd>{c?.phone || '—'}</dd></div>
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-royal" /><dt className="sr-only">Adresse</dt><dd>{[c?.address, c?.city].filter(Boolean).join(', ') || '—'}</dd></div>
            <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-royal" /><dt className="sr-only">Naissance</dt><dd>{c?.birth_date ? formatDate(c.birth_date) : '—'}</dd></div>
          </dl>
          {c?.bio && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-500">Présentation</h3>
              {/* [VULN V3] XSS stockée : la bio du candidat s'exécute dans le navigateur du recruteur */}
              <div className="rich text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: c.bio }} />
            </section>
          )}
          {a.cover_letter && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-500">Message du candidat</h3>
              <p className="whitespace-pre-line rounded-xl border-l-4 border-royal bg-white p-4 text-sm shadow-line">{a.cover_letter}</p>
            </section>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            {a.cv_id ? <button onClick={() => downloadCv(a.cv_id, a.cv_filename)} className="btn-outline"><Download className="h-4 w-4" />Télécharger le CV</button> : <span className="text-sm text-slate-400">Aucun CV joint</span>}
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(APP_STATUS).map(([k, v]) => (
                <button key={k} onClick={() => change(k)} disabled={a.status === k} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${a.status === k ? 'bg-royal text-white' : 'bg-slate-100 text-slate-600 hover:bg-royal/10 hover:text-royal'}`}>{v.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

function MyJobs({ onCount }) {
  const toast = useToast()
  const [jobs, setJobs] = useState(null)
  const [edit, setEdit] = useState(undefined)
  const load = () => api('/api/jobs/mine').then((l) => { setJobs(l); onCount?.(l) })
  useEffect(() => { load() }, [])

  const setStatus = async (j, status) => {
    await api(`/api/jobs/${j.id}/status`, { method: 'PATCH', body: { status } })
    toast(status === 'published' ? 'Offre publiée' : status === 'closed' ? 'Offre clôturée' : 'Offre repassée en brouillon'); load()
  }
  const remove = async (j) => {
    if (!confirm(`Supprimer l'offre « ${j.title} » et ses candidatures ?`)) return
    await api(`/api/jobs/${j.id}`, { method: 'DELETE' }); toast('Offre supprimée'); load()
  }

  return (
    <>
      <div className="mb-4 flex justify-end"><button onClick={() => setEdit(null)} className="btn-primary"><Plus className="h-4 w-4" />Nouvelle offre</button></div>
      {!jobs ? <Spinner /> : jobs.length === 0 ? (
        <div className="panel"><Empty icon={Briefcase} title="Aucune offre publiée" text="Créez votre première offre pour recevoir des candidatures." action={<button onClick={() => setEdit(null)} className="btn-primary">Créer une offre</button>} /></div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence>
            {jobs.map((j, i) => (
              <motion.li key={j.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.04 }} className="panel flex flex-wrap items-center gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><Link to={`/offres/${j.id}`} className="font-semibold hover:text-royal">{j.title}</Link><JobStatus status={j.status} /></div>
                  <p className="mt-0.5 text-sm text-slate-500">{j.contract_type} — {j.location} — créée {timeAgo(j.created_at)}</p>
                </div>
                <span className="flex items-center gap-1.5 text-sm text-slate-600"><Users className="h-4 w-4 text-royal" />{j.applications_count}</span>
                <select aria-label="Statut de l'offre" value={j.status} onChange={(e) => setStatus(j, e.target.value)} className="input w-auto py-1.5">
                  <option value="draft">Brouillon</option><option value="published">Publiée</option><option value="closed">Clôturée</option>
                </select>
                <button onClick={() => setEdit(j)} className="btn-ghost px-2.5" title="Modifier" aria-label="Modifier"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(j)} className="btn-ghost px-2.5 hover:text-rose-600" title="Supprimer" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      <JobForm open={edit !== undefined} job={edit} onClose={() => setEdit(undefined)} onSaved={load} />
    </>
  )
}

function Received() {
  const [list, setList] = useState(null)
  const [filter, setFilter] = useState('')
  const [view, setView] = useState(null)
  const load = () => api('/api/applications/received').then(setList)
  useEffect(() => { load() }, [])
  if (!list) return <Spinner />
  const shown = filter ? list.filter((a) => a.status === filter) : list
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {[['', 'Toutes'], ...Object.entries(APP_STATUS).map(([k, v]) => [k, v.label])].map(([k, l]) => (
          <button key={k || 'all'} onClick={() => setFilter(k)} className={`rounded-full px-3.5 py-1.5 text-sm transition ${filter === k ? 'bg-ink text-white' : 'bg-white text-slate-600 shadow-line hover:text-royal'}`}>
            {l} <span className="opacity-60">{k ? list.filter((a) => a.status === k).length : list.length}</span>
          </button>
        ))}
      </div>
      {shown.length === 0 ? <div className="panel"><Empty icon={Inbox} title="Aucune candidature" text="Les candidatures à vos offres apparaîtront ici." /></div> : (
        <div className="panel overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs text-slate-500"><tr><th className="p-4 font-medium">Candidat</th><th className="p-4 font-medium">Offre</th><th className="p-4 font-medium">Reçue</th><th className="p-4 font-medium">Statut</th><th className="p-4"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody className="divide-y">
              {shown.map((a) => (
                <tr key={a.id} className="transition hover:bg-mist/60">
                  <td className="p-4"><p className="font-medium">{a.candidate_name}</p><p className="text-xs text-slate-500">{a.candidate_headline}</p></td>
                  <td className="p-4">{a.job_title}</td>
                  <td className="whitespace-nowrap p-4 text-slate-500">{timeAgo(a.created_at)}</td>
                  <td className="p-4"><AppStatus status={a.status} /></td>
                  <td className="p-4 text-right"><button onClick={() => setView(a.id)} className="btn-outline py-1.5"><Eye className="h-4 w-4" />Examiner</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ApplicationView appId={view} onClose={() => setView(null)} onChanged={load} />
    </>
  )
}

export default function Recruiter() {
  const { user } = useAuth()
  const [tab, setTab] = useState('jobs')
  const [s, setS] = useState({ jobs: 0, published: 0, apps: 0, interviews: 0 })
  useEffect(() => {
    Promise.all([api('/api/jobs/mine'), api('/api/applications/received')]).then(([j, a]) =>
      setS({ jobs: j.length, published: j.filter((x) => x.status === 'published').length, apps: a.length, interviews: a.filter((x) => x.status === 'entretien').length }))
  }, [tab])
  return (
    <Page>
      <DashHeader title={user.company || 'Espace recruteur'} subtitle={`Connecté en tant que ${user.full_name}`} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Briefcase} label="Offres" value={s.jobs} />
        <StatCard icon={FileText} label="Offres publiées" value={s.published} accent="bg-emerald-50 text-emerald-600" delay={0.05} />
        <StatCard icon={Inbox} label="Candidatures reçues" value={s.apps} accent="bg-sky/15 text-sky-700" delay={0.1} />
        <StatCard icon={UserRound} label="Entretiens" value={s.interviews} accent="bg-indigo-50 text-indigo-600" delay={0.15} />
      </div>
      <div className="mb-5"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'jobs', label: 'Mes offres', icon: Briefcase }, { id: 'apps', label: 'Candidatures reçues', icon: Inbox }, { id: 'profile', label: 'Mon profil', icon: UserRound }]} /></div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {tab === 'jobs' && <MyJobs />}
          {tab === 'apps' && <Received />}
          {tab === 'profile' && <ProfileForm recruiter />}
        </motion.div>
      </AnimatePresence>
    </Page>
  )
}
