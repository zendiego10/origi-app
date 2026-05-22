/**
 * Seed inicial de Firebase para Origi.
 * Uso: node scripts/seed.mjs tu@email.com tuContraseña
 */

const [,, email, password] = process.argv
if (!email || !password) {
  console.error('Uso: node scripts/seed.mjs EMAIL CONTRASEÑA')
  process.exit(1)
}

const PROJECT = 'origi-usa'
const API_KEY = 'AIzaSyBSK0rm22defACSy4ig6CF8qnequPTecDc'
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`

const MARCAS = [
  'Nike', 'Adidas', 'Puma', 'Michael Kors', 'Calvin Klein',
  'Guess', 'Tommy Hilfiger', 'Karl Lagerfeld', 'Coach',
  "Victoria's Secret", 'Nature Made', 'Tissot',
]
const TIPOS = [
  'Sandalias', 'Zapatos', 'Camiseta', 'Buzo', 'Pantalón',
  'Bolso', 'Perfume', 'Suplemento', 'Medias', 'Accesorio', 'Otro',
]
const CONFIG = {
  trm_actual: '4200',
  envio_colombia_default: '20000',
  envio_el_bagre: '10000',
  dias_alerta_retraso: '20',
  dias_alerta_pago: '15',
  margen_minimo: '0.40',
}

function strField(v) { return { stringValue: v } }

console.log('\n🚀 Seed inicial de Origi\n')

// Autenticar con email/password
const authRes = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  }
)
const authData = await authRes.json()
if (!authRes.ok) {
  console.error('❌ Error de autenticación:', authData.error?.message)
  process.exit(1)
}
const token = authData.idToken
console.log(`✓ Autenticado como ${authData.email}\n`)

const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }

// Marcas
let ok = 0
for (const nombre of MARCAS) {
  const r = await fetch(`${BASE}/marcas`, { method: 'POST', headers: h, body: JSON.stringify({ fields: { nombre: strField(nombre) } }) })
  if (r.ok) ok++
}
console.log(`✓ Marcas: ${ok}/${MARCAS.length}`)

// Tipos de producto
ok = 0
for (const nombre of TIPOS) {
  const r = await fetch(`${BASE}/tiposProducto`, { method: 'POST', headers: h, body: JSON.stringify({ fields: { nombre: strField(nombre) } }) })
  if (r.ok) ok++
}
console.log(`✓ Tipos de producto: ${ok}/${TIPOS.length}`)

// Config global
ok = 0
for (const [clave, valor] of Object.entries(CONFIG)) {
  const r = await fetch(`${BASE}/config/${clave}`, { method: 'PATCH', headers: h, body: JSON.stringify({ fields: { clave: strField(clave), valor: strField(valor) } }) })
  if (r.ok) ok++
}
console.log(`✓ Configuración: ${ok}/${Object.keys(CONFIG).length}`)

console.log('\n🎉 Seed completado. La app está lista.\n')
