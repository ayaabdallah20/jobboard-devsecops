import { motion } from 'framer-motion'
import { Briefcase, Clock, MapPin, Users, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { stripHtml, timeAgo } from '../lib/format'
import { Tag } from './Badges'

const companyColor = (name = '') => {
  const palette = ['from-royal to-sky', 'from-deep to-royal-light', 'from-sky to-royal', 'from-indigo-600 to-sky']
  return palette[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length]
}

export default function JobRow({ job, index = 0 }) {
  return (
    <motion.li initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.05, 0.4) }}>
      <Link to={`/offres/${job.id}`} className="group flex gap-4 rounded-2xl bg-white p-5 shadow-line transition hover:-translate-y-0.5 hover:shadow-lift">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${companyColor(job.company)} font-display text-lg font-bold text-white`}>
          {job.company?.[0] || '?'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-ink transition group-hover:text-royal">{job.title}</h3>
              <p className="text-sm text-slate-500">{job.company}</p>
            </div>
            <span className="flex items-center gap-1 text-xs text-slate-400"><Clock className="h-3.5 w-3.5" />{timeAgo(job.created_at)}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{stripHtml(job.description)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Tag><Briefcase className="h-3 w-3" />{job.contract_type}</Tag>
            <Tag tone="grey"><MapPin className="h-3 w-3" />{job.location}</Tag>
            {job.remote && <Tag tone="grey">{job.remote}</Tag>}
            {job.salary && <Tag tone="grey"><Wallet className="h-3 w-3" />{job.salary}</Tag>}
            {job.applications_count > 0 && <Tag tone="grey"><Users className="h-3 w-3" />{job.applications_count} candidature{job.applications_count > 1 ? 's' : ''}</Tag>}
          </div>
        </div>
      </Link>
    </motion.li>
  )
}
