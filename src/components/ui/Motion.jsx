/**
 * Primitivas de Motion para Origi
 *
 * Componentes listos para usar que encapsulan las animaciones
 * más comunes. Permiten construir UI animada sin pensar en variants.
 *
 * Uso:
 *   <FadeIn>contenido</FadeIn>
 *   <SlideUp delay={0.1}>tarjeta</SlideUp>
 *   <Stagger><StaggerItem>item</StaggerItem></Stagger>
 *   <PressableCard onClick={...}>card</PressableCard>
 *   <IconButton>...</IconButton>
 */

import { motion, AnimatePresence, LayoutGroup } from 'motion/react'
import { listVariants, itemVariants, slideUp, fadeVariants, scaleIn, tap, hover, backdropVariants, spring, dur, ease } from '@/lib/motion'
import { cn } from '@/lib/utils'

// ─── FADE IN ──────────────────────────────────────────────────
export function FadeIn({ children, delay = 0, className, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: dur.normal, ease: ease.outSine, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── SLIDE UP ─────────────────────────────────────────────────
export function SlideUp({ children, delay = 0, className, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur.normal, ease: ease.outExpo, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── SCALE IN ─────────────────────────────────────────────────
export function ScaleIn({ children, delay = 0, className, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: dur.normal, ease: ease.outExpo, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── STAGGER CONTAINER ────────────────────────────────────────
// Envuelve una lista. Los <StaggerItem> hijos aparecen en cascada.
export function Stagger({ children, className, ...props }) {
  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="visible"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── STAGGER ITEM ─────────────────────────────────────────────
export function StaggerItem({ children, className, ...props }) {
  return (
    <motion.div
      variants={itemVariants}
      layout
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── PRESSABLE CARD ───────────────────────────────────────────
// Tarjeta interactiva con hover sutil + tap táctil.
export function PressableCard({ children, className, onClick, ...props }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover.card}
      whileTap={tap.card}
      layout
      className={cn('cursor-pointer', className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── PRESSABLE BUTTON ─────────────────────────────────────────
// Para cualquier <button> que quiera física de muelle.
export function PressableButton({
  children,
  className,
  disabled,
  onClick,
  type = 'button',
  ...props
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : hover.button}
      whileTap={disabled ? {} : tap.button}
      className={cn('select-none', className)}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// ─── ICON BUTTON ──────────────────────────────────────────────
// Botón de ícono — efecto de rebote al presionar.
export function IconButton({ children, className, onClick, ...props }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={hover.icon}
      whileTap={tap.icon}
      className={cn('select-none', className)}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// ─── ANIMATED LIST ────────────────────────────────────────────
// Lista con layout animations — los items se reorganizan fluidamente.
export function AnimatedList({ children, className, ...props }) {
  return (
    <LayoutGroup>
      <motion.div layout className={className} {...props}>
        {children}
      </motion.div>
    </LayoutGroup>
  )
}

// ─── MODAL OVERLAY ────────────────────────────────────────────
export function Backdrop({ onClick, children }) {
  return (
    <AnimatePresence>
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClick}
        className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// ─── NUMBER TICKER ────────────────────────────────────────────
// Anima un número cuando cambia (para métricas).
import { useEffect, useRef, useState } from 'react'

export function NumberTicker({ value, format = (v) => v, className }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    if (prev.current === value) return
    const start = prev.current
    const end = value
    const diff = end - start
    const startTime = performance.now()
    const duration = 600

    function update(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out-expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setDisplay(Math.round(start + diff * eased))
      if (progress < 1) requestAnimationFrame(update)
    }

    requestAnimationFrame(update)
    prev.current = value
  }, [value])

  return <span className={className}>{format(display)}</span>
}
