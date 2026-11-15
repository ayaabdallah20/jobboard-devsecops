import { motion } from 'framer-motion'
import { ArrowLeft, Briefcase, Building2, CalendarDays, CheckCircle2, FileText, MapPin, Upload, Users, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { JobStatus, Tag } from '../components/Badges'
import { ErrorBox, Page, Spinner } from '../components/Common'
import Modal from '../components/Modal'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { formatDate, formatSize } from '../lib/format'
import { useToast } from '../lib/toast'

function ApplyModal({ open, onClose, job, onDone }) {
  const toast = useToast()
  const [cvs, setCvs] = useState([])
  const [cvId, setCvId] = useState('')
  const [letter, setLetter] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    api('/api/cvs/mine').then((l) => { setCvs(l); if (l[0]) setCvId(String(l[0].id)) }).catch(() => {})
  }, [open])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      let id = cvId ? Number(cvId) : null
      if (file) {
        const form = new FormData()
        form.append('file', file)
        const cv = await api('/api/cvs/upload', { method: 'POST', form })
        id = cv.id
      }
      await api('/api/applications', { method: 'POST', body: { job_id: job.id, cv_id: id, cover_letter: letter } })
      toast('Candidature envoyée')
      onDone()
      onClose()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Postuler — ${job?.title}`}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <span className="label">CV</span>
          {cvs.length > 0 && (
            <div className="mb-3 space-y-2">
              {cvs.map((c) => (
                <label key={c.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition ${String(c.id) === cvId && !file ? 'border-royal bg-royal/5' : 'border-slate-200'}`}>
                  <input type="radio" name="cv" value={c.id} checked={String(c.id) === cvId && !file} onChange={() => { setCvId(String(c.id)); setFile(null) }} className="accent-royal" />
                  <FileText className="h-4 w-4 text-royal" />
                  <span className="flex-1 truncate">{c.original_filename}</span>
                  <span className="text-xs text-slate-400">{formatSize(c.size)}</span>
                </label>
              ))}
            </div>
          )}
          <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-slate-200 p-5 text-center text-sm transition hover:border-royal hover:bg-royal/5">
            <Upload className="h-5 w-5 text-royal" />
            <span className="font-medium">{file ? file.name : cvs.length ? 'Ou déposer un nouveau CV' : 'Déposer votre CV'}</span>
            <span className="text-xs text-slate-400">PDF ou Word</span>
            <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files[0] || null)} />
          </label>
        </div>
        <div>
          <label className="label" htmlFor="letter">Message au recruteur</label>
          <textarea id="letter" rows={4} className="input" value={letter} onChange={(e) => setLetter(e.target.value)} placeholder="Présentez-vous en quelques lignes" />
        </div>
        <ErrorBox error={error} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">Annuler</button>
          <button className="btn-primary" disabled={busy || (!cvId && !file)}>{busy ? 'Envoi…' : 'Envoyer ma candidature'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function JobDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()
  const [job, setJob] = useState(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    api(`/api/jobs/${id}`).then(setJob).catch((e) => setError(e.message))
    if (user?.role === 'candidat') api('/api/applications/mine').then((l) => setApplied(l.some((a) => a.job_id === Number(id)))).catch(() => {})
  }, [id, user])

  if (error) return <Page><ErrorBox error={error} /></Page>
  if (!job) return <Page><Spinner /></Page>

  const onApply = () => (user ? setOpen(true) : nav('/connexion', { state: { from: `/offres/${id}` } }))

  return (
    <Page>
      <Link to="/offres" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-royal"><ArrowLeft className="h-4 w-4" />Toutes les offres</Link>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <article className="panel p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Tag><Briefcase className="h-3 w-3" />{job.contract_type}</Tag>
            <Tag tone="grey">{job.remote}</Tag>
            {job.status !== 'published' && <JobStatus status={job.status} />}
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-tight">{job.title}</h1>
          <p className="mt-2 flex items-center gap-2 text-slate-500"><Building2 className="h-4 w-4" />{job.company} <span className="text-slate-300">|</span> <MapPin className="h-4 w-4" />{job.location}</p>

          <h2 className="mb-3 mt-8 text-lg font-semibold">Description du poste</h2>
          {/* [VULN V3] XSS stockée : le HTML de la description est injecté tel quel dans la page */}
          <div className="rich text-slate-700" dangerouslySetInnerHTML={{ __html: job.description }} />

          {job.requirements && (
            <>
              <h2 className="mb-3 mt-6 text-lg font-semibold">Profil recherché</h2>
              <div className="rich text-slate-700" dangerouslySetInnerHTML={{ __html: job.requirements }} />
            </>
          )}
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="panel p-6">
            <dl className="space-y-3 text-sm">
              {job.salary && <div className="flex items-center gap-3"><Wallet className="h-4 w-4 text-royal" /><dt className="sr-only">Salaire</dt><dd>{job.salary}</dd></div>}
              <div className="flex items-center gap-3"><CalendarDays className="h-4 w-4 text-royal" /><dt className="sr-only">Publiée le</dt><dd>Publiée le {formatDate(job.created_at)}</dd></div>
              <div className="flex items-center gap-3"><Users className="h-4 w-4 text-royal" /><dt className="sr-only">Candidatures</dt><dd>{job.applications_count} candidature{job.applications_count > 1 ? 's' : ''}</dd></div>
              {job.recruiter_name && <div className="flex items-center gap-3"><Building2 className="h-4 w-4 text-royal" /><dt className="sr-only">Recruteur</dt><dd>Recruteur : {job.recruiter_name}</dd></div>}
            </dl>
            <div className="mt-6">
              {applied ? (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" />Vous avez postulé à cette offre</div>
              ) : user && user.role !== 'candidat' ? (
                <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">Seuls les comptes candidats peuvent postuler.</p>
              ) : job.status === 'published' ? (
                <button onClick={onApply} className="btn-primary w-full py-3">Postuler à cette offre</button>
              ) : (
                <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">Cette offre n'accepte plus de candidatures.</p>
              )}
            </div>
          </motion.div>
        </aside>
      </div>
      <ApplyModal open={open} onClose={() => setOpen(false)} job={job} onDone={() => { setApplied(true); setJob({ ...job, applications_count: job.applications_count + 1 }) }} />
    </Page>
  )
}
