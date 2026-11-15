import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect } from 'react'

export default function StatCard({ icon: Icon, label, value, accent = 'text-royal bg-royal/10', delay = 0 }) {
  const mv = useMotionValue(0)
  const rounded = useTransform(mv, (v) => Math.round(v))
  useEffect(() => { const c = animate(mv, value || 0, { duration: 1, delay }); return c.stop }, [value, delay, mv])
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="panel flex items-center gap-4 p-5">
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${accent}`}><Icon className="h-5 w-5" /></span>
      <div>
        <motion.p className="font-display text-2xl font-bold">{rounded}</motion.p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </motion.div>
  )
}
