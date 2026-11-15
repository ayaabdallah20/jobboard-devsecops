import { Link } from 'react-router-dom'

export default function Logo({ light = false }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="JobBoard Secure — accueil">
      <svg viewBox="0 0 32 32" className="h-8 w-8 transition-transform group-hover:rotate-[-6deg]" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#1D4ED8" />
        <path d="M9 11h14v12a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2z" fill="none" stroke="#fff" strokeWidth="2.4" />
        <path d="M13 11V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" fill="none" stroke="#38BDF8" strokeWidth="2.4" />
      </svg>
      <span className={`font-display text-lg font-bold ${light ? 'text-white' : 'text-ink'}`}>
        JobBoard<span className={light ? 'text-sky' : 'text-royal'}>Secure</span>
      </span>
    </Link>
  )
}
