import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { CARD_TAP, CARD_HOVER } from '@/utils/animations'

export default function StatCard({ icon: Icon, label, value, sub, trend, color = 'primary', loading }) {
  const colorMap = {
    primary: 'text-primary bg-primary/10',
    success: 'text-green-400 bg-green-400/10',
    warning: 'text-yellow-400 bg-yellow-400/10',
    info: 'text-blue-400 bg-blue-400/10',
    danger: 'text-red-400 bg-red-400/10',
    accent: 'text-purple-400 bg-purple-400/10',
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
        <div className="w-10 h-10 rounded-lg bg-secondary" />
        <div className="mt-4 space-y-2">
          <div className="h-3 w-20 bg-secondary rounded" />
          <div className="h-6 w-32 bg-secondary rounded" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3"
      whileHover={CARD_HOVER}
      whileTap={CARD_TAP}
    >
      <div className="flex items-start justify-between">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorMap[color])}>
          {Icon && <Icon size={18} />}
        </div>
        {trend !== undefined && (
          <span className={cn('text-xs font-medium', trend >= 0 ? 'text-green-400' : 'text-red-400')}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  )
}
