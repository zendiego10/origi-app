/**
 * Re-exporta el sistema de animaciones desde lib/motion.
 * Mantiene compatibilidad con los imports existentes en el proyecto.
 */

export {
  pageVariants as PAGE_TRANSITION,
  listVariants as LIST_CONTAINER,
  itemVariants as ITEM_VARIANT,
  tap,
  hover,
  spring,
  dur,
  ease,
} from '@/lib/motion'

// Aliases de retrocompatibilidad con el código anterior
import { tap, hover } from '@/lib/motion'

export const BUTTON_TAP   = tap.button
export const BUTTON_HOVER = hover.button
export const CARD_TAP     = tap.card
export const CARD_HOVER   = hover.card
