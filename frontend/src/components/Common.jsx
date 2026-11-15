import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export function Spinner({ label = 'Chargement…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500" role="status">
      <Loader2 className="h-5 w-5 animate-spin text-royal" /> {label}
    </div>
  )
}

export function Empty({ icon: Icon, title, text, action }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center px-6 py-14 text-center">
      {Icon && <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-royal/10 text-royal"><Icon className="h-6 w-6" /></span>}
      <p className="font-display text-lg font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  )
}

export function ErrorBox({ error }) {
  if (!error) return null
  return <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700" role="alert">{error}</div>
}

export function Page({ children, className = '' }) {
  return (
    <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className={`mx-auto max-w-7xl px-5 pt-24 ${className}`}>
      {children}
    </motion.main>
  )
}
