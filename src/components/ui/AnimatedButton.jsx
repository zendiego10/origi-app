import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { BUTTON_TAP, BUTTON_HOVER } from '@/utils/animations'
import { Spinner } from './Loader'

const variants = {
  primary:   'bg-primary hover:bg-[#C73652] text-white',
  secondary: 'bg-secondary hover:bg-border text-foreground',
  ghost:     'text-muted-foreground hover:text-foreground hover:bg-secondary',
  danger:    'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
  success:   'bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/20',
}

/**
 * Botón principal de la app con física de muelle.
 * Reemplaza los <button> básicos en toda la UI.
 *
 * Props:
 *   variant  — primary | secondary | ghost | danger | success
 *   size     — sm | md | lg
 *   loading  — muestra spinner y desactiva
 *   icon     — icono a la izquierda (JSX)
 *   fullWidth
 */
export default function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  className,
  onClick,
  type = 'button',
}) {
  const sizeClass = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-5 py-3.5 text-base gap-2.5 font-semibold',
  }[size]

  const isDisabled = disabled || loading

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileHover={isDisabled ? {} : BUTTON_HOVER}
      whileTap={isDisabled ? {} : BUTTON_TAP}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-xl transition-colors select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizeClass,
        fullWidth && 'w-full',
        className,
      )}
    >
      {loading ? <Spinner className="w-4 h-4" /> : icon}
      {children}
    </motion.button>
  )
}
