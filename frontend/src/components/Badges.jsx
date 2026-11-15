import { APP_STATUS, JOB_STATUS } from '../lib/format'

export function AppStatus({ status }) {
  const s = APP_STATUS[status] || { label: status, cls: 'bg-slate-100', dot: 'bg-slate-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />{s.label}
    </span>
  )
}

export function JobStatus({ status }) {
  const s = JOB_STATUS[status] || { label: status, cls: 'bg-slate-100' }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>{s.label}</span>
}

export function Tag({ children, tone = 'blue' }) {
  const t = tone === 'blue' ? 'bg-royal/[.07] text-royal' : 'bg-slate-100 text-slate-600'
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${t}`}>{children}</span>
}
