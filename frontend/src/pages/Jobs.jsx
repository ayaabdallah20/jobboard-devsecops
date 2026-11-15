import { AnimatePresence, motion } from 'framer-motion'
import { Briefcase, MapPin, Search, SearchX, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ErrorBox, Empty, Page, Spinner } from '../components/Common'
import JobRow from '../components/JobRow'
import { api } from '../lib/api'
import { CONTRACTS } from '../lib/format'

export default function Jobs() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const [location, setLocation] = useState(params.get('location') || '')
  const contract = params.get('contract') || ''
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError('')
    const p = new URLSearchParams({ q: params.get('q') || '', location: params.get('location') || '', contract: params.get('contract') || '' })
    api(`/api/jobs/search?${p}`)
      .then((d) => setData(d.results))
      .catch((e) => { setError(e.message); setData([]) })
      .finally(() => setLoading(false))
  }, [params])

  const apply = (patch) => {
    const next = { q, location, contract, ...patch }
    const p = new URLSearchParams()
    Object.entries(next).forEach(([k, v]) => v && p.set(k, v))
    setParams(p)
  }

  return (
    <Page>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Offres d'emploi</h1>
        <p className="mt-1 text-slate-500">Recherchez par poste, entreprise, ville ou type de contrat.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); apply({}) }} className="panel mb-6 grid gap-3 p-3 md:grid-cols-[1fr_220px_auto]">
        <label className="relative">
          <span className="sr-only">Poste ou entreprise</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Poste ou entreprise" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label className="relative">
          <span className="sr-only">Ville</span>
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Ville" value={location} onChange={(e) => setLocation(e.target.value)} />
        </label>
        <button className="btn-primary">Rechercher</button>
      </form>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside>
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal className="h-4 w-4" />Type de contrat</p>
          <div className="flex flex-wrap gap-2 lg:flex-col">
            {['', ...CONTRACTS].map((c) => (
              <button key={c || 'all'} onClick={() => apply({ contract: c })}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${contract === c ? 'bg-royal font-semibold text-white' : 'bg-white text-slate-600 shadow-line hover:text-royal'}`}>
                <Briefcase className="h-3.5 w-3.5" />{c || 'Tous les contrats'}
              </button>
            ))}
          </div>
        </aside>

        <section>
          <ErrorBox error={error && `La recherche a échoué : ${error}`} />
          {loading ? <Spinner /> : (
            <>
              <p className="mb-3 text-sm text-slate-500" aria-live="polite">{data.length} offre{data.length > 1 ? 's' : ''} trouvée{data.length > 1 ? 's' : ''}</p>
              {data.length === 0 && !error ? (
                <div className="panel"><Empty icon={SearchX} title="Aucune offre ne correspond" text="Essayez un autre mot-clé ou retirez un filtre." action={<button onClick={() => { setQ(''); setLocation(''); setParams({}) }} className="btn-outline">Effacer les filtres</button>} /></div>
              ) : (
                <motion.ul layout className="space-y-3">
                  <AnimatePresence>{data.map((j, i) => <JobRow key={`${j.id}-${i}`} job={j} index={i} />)}</AnimatePresence>
                </motion.ul>
              )}
            </>
          )}
        </section>
      </div>
    </Page>
  )
}
