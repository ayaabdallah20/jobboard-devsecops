import { motion } from 'framer-motion'

export default function DashHeader({ title, subtitle, action }) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl bg-deep px-7 py-8 text-white">
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-30" aria-hidden>
        <defs>
          <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#93C5FD" /></pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
      <motion.div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-sky/40 blur-3xl" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 8, repeat: Infinity }} />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-blue-200">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  )
}
