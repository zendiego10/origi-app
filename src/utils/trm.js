import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'

const TRM_CACHE_KEY = 'origi_trm_cache'
const CACHE_TTL_MS = 4 * 60 * 60 * 1000 // 4 horas

/**
 * Obtiene la TRM USD→COP desde la API de ExchangeRate.
 * Cachea en localStorage por 4 horas para no saturar la API.
 * Si falla, devuelve el último valor guardado en Firebase config.
 */
export async function obtenerTRM() {
  // 1. Revisar cache local
  try {
    const cached = JSON.parse(localStorage.getItem(TRM_CACHE_KEY) || '{}')
    if (cached.valor && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return { valor: cached.valor, fuente: 'cache' }
    }
  } catch (_) {}

  // 2. Llamar API (open.er-api.com — gratuita, sin key, CORS habilitado)
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(5000),
    })
    if (res.ok) {
      const data = await res.json()
      const cop = Math.round(data.rates?.COP)
      if (cop && cop > 3000 && cop < 8000) { // sanity check rango razonable
        localStorage.setItem(TRM_CACHE_KEY, JSON.stringify({ valor: cop, timestamp: Date.now() }))
        // Actualizar Firebase config con el valor nuevo
        await setDoc(doc(db, 'config', 'trm_actual'), { clave: 'trm_actual', valor: String(cop) })
        return { valor: cop, fuente: 'api' }
      }
    }
  } catch (_) {}

  // 3. Fallback: leer desde Firebase config
  try {
    const snap = await getDoc(doc(db, 'config', 'trm_actual'))
    if (snap.exists()) {
      const valor = Number(snap.data().valor)
      return { valor, fuente: 'firebase' }
    }
  } catch (_) {}

  // 4. Último recurso: valor por defecto
  return { valor: 4200, fuente: 'default' }
}
