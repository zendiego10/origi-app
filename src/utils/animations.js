// Sistema centralizado de animaciones para Origi
// Todos los valores están calibrados para sentirse naturales en mobile

// ─── TRANSICIÓN DE PÁGINA ─────────────────────────────────────
// La página saliente se desvanece rápido; la entrante aparece con
// un leve desplazamiento hacia arriba — igual que iOS Safari.
export const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 14 },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: [0.25, 0.46, 0.45, 0.94], // ease-out-quad
      when: 'beforeChildren',
      delayChildren: 0.08,   // espera a que la página esté visible
      staggerChildren: 0.055,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.14, ease: [0.55, 0, 1, 0.45] }, // ease-in-quad
  },
}

// ─── ÍTEM DE STAGGER (tarjeta, fila, stat) ────────────────────
// Cada hijo de un contenedor con stagger usa estos variants.
export const ITEM_VARIANT = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: { opacity: 0, transition: { duration: 0.1 } },
}

// Contenedor que coordina el stagger de sus hijos
export const LIST_CONTAINER = {
  initial: {},
  enter: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.05,
    },
  },
  exit: {},
}

// ─── FÍSICA DE BOTONES ────────────────────────────────────────
// Spring rápido hacia abajo + rebote suave al soltar.
export const BUTTON_TAP = {
  scale: 0.93,
  transition: { type: 'spring', stiffness: 500, damping: 18, mass: 0.8 },
}

export const BUTTON_HOVER = {
  scale: 1.025,
  transition: { type: 'spring', stiffness: 400, damping: 20 },
}

// Tap más sutil para elementos grandes (tarjetas, filas)
export const CARD_TAP = {
  scale: 0.985,
  transition: { type: 'spring', stiffness: 400, damping: 20 },
}

export const CARD_HOVER = {
  scale: 1.01,
  transition: { type: 'spring', stiffness: 300, damping: 22 },
}
