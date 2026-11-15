export const APP_STATUS = {
  envoyee: { label: 'Envoyée', cls: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  en_revue: { label: 'En revue', cls: 'bg-sky/15 text-sky-800', dot: 'bg-sky' },
  entretien: { label: 'Entretien', cls: 'bg-royal/10 text-royal', dot: 'bg-royal' },
  acceptee: { label: 'Acceptée', cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  refusee: { label: 'Refusée', cls: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
}

export const JOB_STATUS = {
  draft: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-600' },
  published: { label: 'Publiée', cls: 'bg-emerald-50 text-emerald-700' },
  closed: { label: 'Clôturée', cls: 'bg-rose-50 text-rose-700' },
}

export const ROLE_LABEL = { candidat: 'Candidat', recruteur: 'Recruteur', admin: 'Administrateur' }

export const CONTRACTS = ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance']
export const REMOTE = ['Sur site', 'Hybride', 'Télétravail']

export function timeAgo(value) {
  if (!value) return ''
  const d = new Date(value)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  if (diff < 86400 * 30) return `il y a ${Math.floor(diff / 86400)} j`
  return d.toLocaleDateString('fr-FR')
}

export const formatDate = (v) => (v ? new Date(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—')

// Extraction de texte via DOMParser (n'exécute rien) pour les extraits des cartes
export const stripHtml = (html = '') => {
  const doc = new DOMParser().parseFromString(html.replace(/<\/(p|li|h\d|div)>|<br\s*\/?>/gi, ' '), 'text/html')
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim()
}

export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()

export const formatSize = (n) => (n < 1024 ? `${n} o` : n < 1048576 ? `${(n / 1024).toFixed(0)} Ko` : `${(n / 1048576).toFixed(1)} Mo`)
