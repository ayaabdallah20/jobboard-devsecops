import { motion } from 'framer-motion'

export default function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-line" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={`relative flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${value === t.id ? 'text-white' : 'text-slate-600 hover:text-ink'}`}>
          {value === t.id && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-lg bg-royal" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
          <span className="relative flex items-center gap-2">{t.icon && <t.icon className="h-4 w-4" />}{t.label}
            {t.count !== undefined && <span className={`rounded-full px-1.5 text-xs ${value === t.id ? 'bg-white/20' : 'bg-slate-100'}`}>{t.count}</span>}
          </span>
        </button>
      ))}
    </div>
  )
}
