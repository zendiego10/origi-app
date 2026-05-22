/**
 * Origi Motion System
 * Arquitectura de animaciones escalable — estilo Linear / Vercel
 *
 * Principios:
 * - Rápido en responder, lento en completar (feedback inmediato, salida suave)
 * - Física de muelle en interacciones directas (botones, tarjetas)
 * - Curvas de Bézier personalizadas en transiciones de UI
 * - Layout animations nativos de Motion para reflows orgánicos
 */

// ─── EASING ───────────────────────────────────────────────────
// Curvas calibradas para cada tipo de movimiento.
// Siempre array [x1, y1, x2, y2] — compatible con motion y CSS.
export const ease = {
  // Entrada de elementos — arranque veloz, llegada suave (signature Vercel)
  outExpo:  [0.16, 1, 0.3, 1],
  // Salida de elementos — salida natural, sin brusquedad
  inQuart:  [0.5, 0, 0.75, 0],
  // Cambios de estado bidireccionales (modales, paneles)
  inOutCubic: [0.65, 0, 0.35, 1],
  // Overshoot suave para elementos que "llegan" (notificaciones, toasts)
  outBack:  [0.34, 1.56, 0.64, 1],
  // Para números y métricas animadas
  outSine:  [0.39, 0.575, 0.565, 1],
  // Easing estándar genérico
  standard: [0.4, 0, 0.2, 1],
}

// ─── DURATIONS ─────────────────────────────────────────────────
// Tokens en segundos.
export const dur = {
  instant: 0.08,   // Feedback de tap / click
  fast:    0.15,   // Microinteracciones, hover
  normal:  0.25,   // Transiciones de UI principales
  slow:    0.38,   // Modales, drawers, paneles laterales
  slower:  0.55,   // Onboarding, elementos especiales
}

// ─── SPRINGS ───────────────────────────────────────────────────
// Física de muelle para interacciones directas del usuario.
// Regla: más rigidez = más snappy; más damping = menos rebote.
export const spring = {
  // Botones e iconos — respuesta instantánea, sin rebote visible
  snap: {
    type: 'spring',
    stiffness: 700,
    damping: 35,
    mass: 0.8,
  },
  // Tarjetas y elementos interactivos medianos
  snappy: {
    type: 'spring',
    stiffness: 500,
    damping: 30,
    mass: 0.9,
  },
  // Paneles, modales, drawers laterales
  smooth: {
    type: 'spring',
    stiffness: 280,
    damping: 28,
    mass: 1,
  },
  // Layout animations (reorganización de listas, reflows)
  layout: {
    type: 'spring',
    stiffness: 200,
    damping: 25,
    mass: 0.8,
  },
  // Hover states — suave y orgánico
  gentle: {
    type: 'spring',
    stiffness: 140,
    damping: 18,
    mass: 1,
  },
}

// ─── PAGE TRANSITIONS ──────────────────────────────────────────
// Transición de página estilo app nativa.
// - Exit: rápido y discreto, el contenido anterior "cede el espacio"
// - Enter: suave, con stagger coordinado de hijos
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
    filter: 'blur(2px)',
  },
  enter: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: dur.normal,
      ease: ease.outExpo,
      when: 'beforeChildren',
      delayChildren: 0.06,
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    filter: 'blur(1px)',
    transition: {
      duration: dur.fast,
      ease: ease.inQuart,
    },
  },
}

// ─── STAGGER VARIANTS ──────────────────────────────────────────
// Para listas de tarjetas, filas de métricas, etc.
export const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
}

export const itemVariants = {
  hidden: {
    opacity: 0,
    y: 14,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: dur.normal,
      ease: ease.outExpo,
    },
  },
}

// ─── FADE VARIANTS ────────────────────────────────────────────
export const fadeVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: dur.normal, ease: ease.outSine } },
  exit:    { opacity: 0, transition: { duration: dur.fast, ease: ease.inQuart } },
}

// ─── SLIDE VARIANTS ───────────────────────────────────────────
export const slideUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { ...spring.smooth } },
  exit:    { opacity: 0, y: 10, transition: { duration: dur.fast, ease: ease.inQuart } },
}

export const slideRight = {
  hidden:  { opacity: 0, x: '100%' },
  visible: { opacity: 1, x: 0, transition: { ...spring.smooth } },
  exit:    { opacity: 0, x: '100%', transition: { ...spring.smooth } },
}

// ─── SCALE VARIANTS ───────────────────────────────────────────
export const scaleIn = {
  hidden:  { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: dur.normal, ease: ease.outExpo } },
  exit:    { opacity: 0, scale: 0.96, transition: { duration: dur.fast } },
}

// ─── MICROINTERACCIONES ────────────────────────────────────────
// whileHover / whileTap para uso directo en componentes.
export const tap = {
  button:  { scale: 0.94, transition: spring.snap },
  card:    { scale: 0.982, transition: spring.snappy },
  icon:    { scale: 0.88, rotate: -5, transition: spring.snap },
  fab:     { scale: 0.9, transition: spring.snap },
}

export const hover = {
  button:  { scale: 1.02, transition: spring.gentle },
  card:    { y: -2, scale: 1.005, transition: spring.gentle },
  icon:    { scale: 1.12, transition: spring.gentle },
  link:    { x: 2, transition: spring.gentle },
}

// ─── OVERLAY / BACKDROP ────────────────────────────────────────
export const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: dur.fast } },
  exit:    { opacity: 0, transition: { duration: dur.fast } },
}
