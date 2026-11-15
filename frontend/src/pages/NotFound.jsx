import { Link } from 'react-router-dom'
import { Page } from '../components/Common'

export default function NotFound() {
  return (
    <Page className="text-center">
      <p className="font-display text-7xl font-extrabold text-royal">404</p>
      <h1 className="mt-4 text-2xl font-bold">Cette page n'existe pas</h1>
      <p className="mt-2 text-slate-500">Le lien est peut-être incorrect ou l'offre a été supprimée.</p>
      <Link to="/offres" className="btn-primary mt-6">Voir les offres</Link>
    </Page>
  )
}
