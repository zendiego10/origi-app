import { cn } from '@/lib/utils'

const variants = {
  success: 'bg-green-500/15 text-green-400 border-green-500/20',
  warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  danger: 'bg-red-500/15 text-red-400 border-red-500/20',
  primary: 'bg-primary/15 text-primary border-primary/20',
  muted: 'bg-muted text-muted-foreground border-border',
  accent: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
}

export default function Badge({ variant = 'muted', children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
