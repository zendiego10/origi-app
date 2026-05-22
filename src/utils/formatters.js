import { format, formatDistanceToNow, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatCOP(amount) {
  if (amount === null || amount === undefined) return '$0'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatUSD(amount) {
  if (amount === null || amount === undefined) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatPct(value) {
  if (value === null || value === undefined) return '0%'
  return `${Math.round(value * 100)}%`
}

export function formatDate(date) {
  if (!date) return '—'
  const d = date?.toDate ? date.toDate() : new Date(date)
  return format(d, 'dd MMM yyyy', { locale: es })
}

export function formatDatetime(date) {
  if (!date) return '—'
  const d = date?.toDate ? date.toDate() : new Date(date)
  return format(d, "dd MMM yyyy 'a las' HH:mm", { locale: es })
}

export function timeAgo(date) {
  if (!date) return '—'
  const d = date?.toDate ? date.toDate() : new Date(date)
  return formatDistanceToNow(d, { locale: es, addSuffix: true })
}

export function diasDesde(date) {
  if (!date) return 0
  const d = date?.toDate ? date.toDate() : new Date(date)
  return differenceInDays(new Date(), d)
}

export function getColorMargen(margen) {
  if (margen >= 0.4) return 'text-green-400'
  if (margen >= 0.2) return 'text-yellow-400'
  return 'text-red-400'
}
