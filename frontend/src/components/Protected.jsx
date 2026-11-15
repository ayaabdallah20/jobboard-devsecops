import { Navigate, useLocation } from 'react-router-dom'
import { homeFor, useAuth } from '../lib/auth'
import { Spinner } from './Common'

export default function Protected({ roles, children }) {
  const { user, ready } = useAuth()
  const loc = useLocation()
  if (!ready) return <div className="pt-24"><Spinner /></div>
  if (!user) return <Navigate to="/connexion" state={{ from: loc.pathname }} replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />
  return children
}
