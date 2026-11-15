import { AnimatePresence, motion } from 'framer-motion'
import { sanitizeHtml } from '../lib/sanitize'
import { Briefcase, CheckCircle2, Download, FileText, Inbox, Save, Trash2, Upload, UserRound, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppStatus } from '../components/Badges'
import { ErrorBox, Empty, Page, Spinner } from '../components/Common'
import DashHeader from '../components/DashHeader'
import Tabs from '../components/Tabs'
import { api, downloadCv } from '../lib/api'
import { useAuth } from '../lib/auth'
import { formatDate, formatSize, timeAgo } from '../lib/format'
import { useToast } from '../lib/toast'

const STEPS = ['envoyee', 'en_revue', 'entretien', 'acceptee']
const STEP_LABEL = { envoyee: 'Envoyée', en_revue: 'En revue', entretien: 'Entretien', acceptee: 'Réponse' }

function Progress({ status }) {
  const refused = status === 'refusee'
  const idx = refused ? 3 : STEPS.indexOf(status)
  return (
    <ol className="flex items-center gap-1" aria-label="Avancement de la candidature">
      {STEPS.map((s, i) => (
        <li key={s} className="flex flex-1 flex-col gap-1.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div className={`h-full ${refused && i === 3 ? 'bg-rose-500' : 'bg-royal'}`} initial={{ width: 0 }} animate={{ width: i <= idx ? '100%' : '0%' }} transition={{ delay: i * 0.12, duration: 0.4 }} />
          </div>
          <span className={`text-[11px] ${i <= idx ? 'font-medium text-ink' : 'text-slate-400'}`}>{refused && i === 3 ? 'Refusée' : STEP_LABEL[s]}</span>
        </li>
      ))}
    </ol>
  )
}

function Applications() {
  const toast = useToast()
  const [list, setList] = useState(null)
  const load = () => api('/api/applications/mine').then(setList)
  useEffect(() => { load() }, [])
  if (!list) return <Spinner />
  if (!list.length) return <div className="panel"><Empty icon={Inbox} title="Aucune candidature pour l'instant" text="Parcourez les offres et postulez en joignant votre CV." action={<Link to="/offres" className="btn-primary">Voir les offres</Link>} /></div>

  const withdraw = async (a) => {
    if (!confirm(`Retirer votre candidature pour « ${a.job_title} » ?`)) return
    await api(`/api/applications/${a.id}`, { method: 'DELETE' })
    toast('Candidature retirée'); load()
  }

  return (
    <ul className="space-y-3">
      <AnimatePresence>
        {list.map((a, i) => (
          <motion.li key={a.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.04 }} className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link to={`/offres/${a.job_id}`} className="font-semibold hover:text-royal">{a.job_title}</Link>
                <p className="text-sm text-slate-500">{a.company} — envoyée {timeAgo(a.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <AppStatus status={a.status} />
                {a.status === 'envoyee' && <button onClick={() => withdraw(a)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Retirer" aria-label="Retirer la candidature"><Trash2 className="h-4 w-4" /></button>}
              </div>
            </div>
            <div className="mt-4"><Progress status={a.status} /></div>
            {a.cv_filename && <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><FileText className="h-3.5 w-3.5" />{a.cv_filename}</p>}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

function Cvs() {
  const toast = useToast()
  const input = useRef()
  const [list, setList] = useState(null)
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const [error, setError] = useState('')
  const load = () => api('/api/cvs/mine').then(setList)
  useEffect(() => { load() }, [])

  const upload = async (file) => {
    if (!file) return
    setBusy(true); setError('')
    // [VULN V4] aucun contrôle côté client non plus : tout type de fichier est envoyé
    const form = new FormData(); form.append('file', file)
    try { await api('/api/cvs/upload', { method: 'POST', form }); toast('CV ajouté'); load() } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const remove = async (cv) => {
    if (!confirm(`Supprimer ${cv.original_filename} ?`)) return
    await api(`/api/cvs/${cv.id}`, { method: 'DELETE' }); toast('CV supprimé'); load()
  }

  return (
    <div className="space-y-4">
      <motion.label onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files[0]) }}
        animate={{ scale: drag ? 1.01 : 1 }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-10 text-center transition ${drag ? 'border-royal bg-royal/5' : 'border-slate-300 bg-white hover:border-royal'}`}>
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-royal/10 text-royal"><Upload className="h-5 w-5" /></span>
        <span className="font-semibold">{busy ? 'Envoi en cours…' : 'Glissez votre CV ici ou cliquez pour le choisir'}</span>
        <span className="text-sm text-slate-500">PDF ou Word recommandé</span>
        <input ref={input} type="file" className="sr-only" onChange={(e) => upload(e.target.files[0])} />
      </motion.label>
      <ErrorBox error={error} />
      {!list ? <Spinner /> : list.length === 0 ? <p className="text-center text-sm text-slate-500">Aucun CV déposé.</p> : (
        <ul className="panel divide-y">
          {list.map((cv) => (
            <li key={cv.id} className="flex items-center gap-4 p-4">
              <FileText className="h-8 w-8 shrink-0 text-royal" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{cv.original_filename}</p>
                <p className="text-xs text-slate-500">{formatSize(cv.size)} — ajouté le {formatDate(cv.uploaded_at)}</p>
              </div>
              <button onClick={() => downloadCv(cv.id, cv.original_filename)} className="btn-ghost px-2.5" title="Télécharger" aria-label="Télécharger"><Download className="h-4 w-4" /></button>
              <button onClick={() => remove(cv)} className="btn-ghost px-2.5 hover:text-rose-600" title="Supprimer" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ProfileForm({ recruiter = false }) {
  const { user, setUser } = useAuth()
  const toast = useToast()
  const [f, setF] = useState({ full_name: user.full_name || '', phone: user.phone || '', address: user.address || '', city: user.city || '', birth_date: user.birth_date || '', headline: user.headline || '', skills: user.skills || '', bio: user.bio || '', company: user.company || '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const body = { ...f, birth_date: f.birth_date || null }
      setUser(await api('/api/users/me/profile', { method: 'PUT', body }))
      toast('Profil enregistré')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  const field = (k, label, props = {}) => (
    <div className={props.wide ? 'sm:col-span-2' : ''}>
      <label className="label" htmlFor={k}>{label}</label>
      <input id={k} className="input" value={f[k]} onChange={set(k)} {...props.input} />
    </div>
  )

  return (
    <form onSubmit={save} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="panel grid gap-4 p-6 sm:grid-cols-2">
        {field('full_name', 'Nom complet')}
        {field('headline', 'Titre professionnel')}
        {recruiter && field('company', 'Entreprise')}
        {field('phone', 'Téléphone')}
        {field('city', 'Ville')}
        {!recruiter && field('birth_date', 'Date de naissance', { input: { type: 'date' } })}
        {!recruiter && field('address', 'Adresse', { wide: true })}
        {!recruiter && field('skills', 'Compétences (séparées par des virgules)', { wide: true })}
        <div className="sm:col-span-2">
          <label className="label" htmlFor="bio">Présentation</label>
          <textarea id="bio" rows={6} className="input font-mono text-[13px]" value={f.bio} onChange={set('bio')} />
          <p className="mt-1 text-xs text-slate-500">Mise en forme HTML acceptée : &lt;b&gt;, &lt;i&gt;, &lt;p&gt;, &lt;ul&gt;…</p>
        </div>
        <div className="sm:col-span-2"><ErrorBox error={error} /></div>
        <div className="sm:col-span-2 flex justify-end"><button className="btn-primary" disabled={busy}><Save className="h-4 w-4" />{busy ? 'Enregistrement…' : 'Enregistrer le profil'}</button></div>
      </div>
      <aside className="panel h-fit p-6">
        <p className="mb-4 text-sm font-semibold text-slate-500">Aperçu vu par les recruteurs</p>
        <p className="font-display text-lg font-semibold">{f.full_name}</p>
        <p className="text-sm text-royal">{f.headline}</p>
        {/* [VULN V3] aperçu rendu sans assainissement */}
        <div className="rich mt-4 text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: sanitizeHtml(f.bio) }} /> {/* nosemgrep: contenu assaini par sanitizeHtml (anti-XSS) */}
        {f.skills && <div className="mt-4 flex flex-wrap gap-1.5">{f.skills.split(',').filter(Boolean).map((s) => <span key={s} className="rounded-md bg-royal/[.07] px-2 py-0.5 text-xs text-royal">{s.trim()}</span>)}</div>}
      </aside>
    </form>
  )
}

export default function Candidate() {
  const { user } = useAuth()
  const [tab, setTab] = useState('apps')
  const [counts, setCounts] = useState({})
  useEffect(() => {
    api('/api/applications/mine').then((l) => setCounts({ apps: l.length, interviews: l.filter((a) => a.status === 'entretien').length, accepted: l.filter((a) => a.status === 'acceptee').length, refused: l.filter((a) => a.status === 'refusee').length }))
  }, [tab])

  return (
    <Page>
      <DashHeader title={`Bonjour ${user.full_name.split(' ')[0]}`} subtitle="Suivez vos candidatures et gardez votre profil à jour." action={<Link to="/offres" className="btn bg-white text-royal hover:bg-blue-50"><Briefcase className="h-4 w-4" />Parcourir les offres</Link>} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[['Candidatures', counts.apps, Inbox, 'bg-royal/10 text-royal'], ['Entretiens', counts.interviews, UserRound, 'bg-sky/15 text-sky-700'], ['Acceptées', counts.accepted, CheckCircle2, 'bg-emerald-50 text-emerald-600'], ['Refusées', counts.refused, XCircle, 'bg-rose-50 text-rose-600']].map(([l, v, I, c], i) => (
          <motion.div key={l} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="panel flex items-center gap-3 p-4">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${c}`}><I className="h-5 w-5" /></span>
            <div><p className="font-display text-xl font-bold">{v ?? '–'}</p><p className="text-xs text-slate-500">{l}</p></div>
          </motion.div>
        ))}
      </div>
      <div className="mb-5"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'apps', label: 'Mes candidatures', icon: Inbox }, { id: 'cvs', label: 'Mes CV', icon: FileText }, { id: 'profile', label: 'Mon profil', icon: UserRound }]} /></div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {tab === 'apps' && <Applications />}
          {tab === 'cvs' && <Cvs />}
          {tab === 'profile' && <ProfileForm />}
        </motion.div>
      </AnimatePresence>
    </Page>
  )
}
