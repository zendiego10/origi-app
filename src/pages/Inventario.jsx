import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Package, Search, Download, Image as ImageIcon,
  X, ChevronDown, ChevronUp,
} from 'lucide-react'
import {
  collection, getDocs, addDoc, updateDoc, doc,
  orderBy, query, serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/services/firebase'
import toast from 'react-hot-toast'
import TopBar from '@/components/layout/TopBar'
import Badge from '@/components/ui/Badge'
import { formatCOP, formatDate, formatPct, getColorMargen } from '@/utils/formatters'
import { ESTADOS_PEDIDO } from '@/utils/constants'
import { calcularGanancia } from '@/utils/calculadora'
import { Spinner } from '@/components/ui/Loader'

const TABS = ['historial', 'stock']
const ESTADOS_STOCK = {
  disponible: { label: 'Disponible', color: 'success' },
  reservado: { label: 'Reservado', color: 'warning' },
  vendido: { label: 'Vendido', color: 'muted' },
}

export default function Inventario() {
  const [tab, setTab] = useState('historial')

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Inventario" />

      {/* Tabs */}
      <div className="flex border-b border-border px-4">
        {[
          { key: 'historial', label: 'Historial de pedidos' },
          { key: 'stock', label: 'Stock propio' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'historial' ? <HistorialPedidos /> : <StockPropio />}
    </div>
  )
}

/* ─── HISTORIAL DE PEDIDOS ─────────────────────────────────── */
function HistorialPedidos() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        const snap = await getDocs(query(collection(db, 'pedidos'), orderBy('creadoEn', 'desc')))
        setPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (_) {}
      finally { setLoading(false) }
    }
    cargar()
  }, [])

  function exportarCSV() {
    const filas = [
      ['Código', 'Cliente', 'Fecha', 'Total COP', 'Ganancia', 'Margen%', 'Estado'],
      ...pedidosFiltrados.map(p => [
        p.codigo,
        p.clienteNombre,
        formatDate(p.creadoEn),
        p.totalCOP,
        p.gananciaTotal,
        p.totalCOP > 0 ? Math.round((p.gananciaTotal / p.totalCOP) * 100) + '%' : '0%',
        ESTADOS_PEDIDO[p.estado]?.label,
      ]),
    ]
    const csv = filas.map(f => f.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `origi-historial-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV descargado')
  }

  const pedidosFiltrados = pedidos.filter(p =>
    !busqueda ||
    p.clienteNombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="flex-1 p-4 space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente o código..."
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          />
        </div>
        <button
          onClick={exportarCSV}
          className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Download size={15} />
          <span className="hidden sm:inline">CSV</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Header tabla — desktop */}
          <div className="hidden md:grid grid-cols-6 px-4 py-2 border-b border-border text-xs text-muted-foreground font-medium">
            <span>Código</span>
            <span>Cliente</span>
            <span>Fecha</span>
            <span className="text-right">Total</span>
            <span className="text-right">Ganancia</span>
            <span className="text-right">Estado</span>
          </div>

          {pedidosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No hay pedidos</div>
          ) : (
            pedidosFiltrados.map((p, i) => {
              const estado = ESTADOS_PEDIDO[p.estado]
              const margen = p.totalCOP > 0 ? p.gananciaTotal / p.totalCOP : 0
              return (
                <button
                  key={p.id}
                  onClick={() => navigate(`/pedidos/${p.id}`)}
                  className={`w-full text-left hover:bg-secondary/50 transition-colors ${i < pedidosFiltrados.length - 1 ? 'border-b border-border' : ''}`}
                >
                  {/* Mobile */}
                  <div className="md:hidden px-4 py-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.clienteNombre}</p>
                        <p className="text-xs text-muted-foreground">{p.codigo} · {formatDate(p.creadoEn)}</p>
                      </div>
                      <Badge variant={estado?.color}>{estado?.label}</Badge>
                    </div>
                    <div className="flex gap-4 mt-1.5">
                      <span className="text-xs text-foreground font-medium">{formatCOP(p.totalCOP)}</span>
                      <span className={`text-xs font-medium ${getColorMargen(margen)}`}>{formatCOP(p.gananciaTotal)}</span>
                    </div>
                  </div>

                  {/* Desktop */}
                  <div className="hidden md:grid grid-cols-6 px-4 py-3 items-center">
                    <span className="text-xs text-muted-foreground font-mono">{p.codigo}</span>
                    <span className="text-sm text-foreground">{p.clienteNombre}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(p.creadoEn)}</span>
                    <span className="text-sm text-foreground text-right">{formatCOP(p.totalCOP)}</span>
                    <span className={`text-sm font-medium text-right ${getColorMargen(margen)}`}>{formatCOP(p.gananciaTotal)}</span>
                    <div className="flex justify-end">
                      <Badge variant={estado?.color}>{estado?.label}</Badge>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

/* ─── STOCK PROPIO ─────────────────────────────────────────── */
function StockPropio() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [marcas, setMarcas] = useState([])
  const [tipos, setTipos] = useState([])

  useEffect(() => {
    async function cargar() {
      try {
        const [stockSnap, marcasSnap, tiposSnap] = await Promise.all([
          getDocs(query(collection(db, 'inventario'), orderBy('creadoEn', 'desc'))),
          getDocs(collection(db, 'marcas')),
          getDocs(collection(db, 'tiposProducto')),
        ])
        setItems(stockSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setMarcas(marcasSnap.docs.map(d => d.data().nombre))
        setTipos(tiposSnap.docs.map(d => d.data().nombre))
      } catch (_) {}
      finally { setLoading(false) }
    }
    cargar()
  }, [])

  async function cambiarEstado(id, nuevoEstado) {
    await updateDoc(doc(db, 'inventario', id), { estado: nuevoEstado })
    setItems(prev => prev.map(i => i.id === id ? { ...i, estado: nuevoEstado } : i))
    toast.success('Estado actualizado')
  }

  function onItemCreado(item) {
    setItems(prev => [item, ...prev])
    setModalOpen(false)
  }

  return (
    <div className="flex-1 p-4 space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-[#C73652] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} />
          Agregar producto
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Package size={40} className="text-muted-foreground opacity-30 mb-3" />
          <p className="text-muted-foreground text-sm">No hay productos en stock</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map(item => {
            const { margen } = calcularGanancia(item.precioVentaCOP, item.costoCOP)
            const estadoInfo = ESTADOS_STOCK[item.estado]
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div className="flex gap-3 p-4">
                  {item.fotosUrls?.[0] ? (
                    <img
                      src={item.fotosUrls[0]}
                      alt={item.nombre}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <ImageIcon size={20} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{item.nombre}</p>
                    <p className="text-xs text-muted-foreground">{item.marca} · {item.tipo}</p>
                    {item.variante && (
                      <p className="text-xs text-muted-foreground">Talla: {item.variante}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-sm font-semibold text-foreground">{formatCOP(item.precioVentaCOP)}</span>
                      <span className={`text-xs font-medium ${getColorMargen(margen)}`}>{formatPct(margen)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <Badge variant={estadoInfo?.color}>{estadoInfo?.label}</Badge>
                    {item.cantidad > 0 && (
                      <span className="text-xs text-muted-foreground">Cant: {item.cantidad}</span>
                    )}
                    {item.cantidad === 0 && (
                      <span className="text-xs text-red-400 font-medium">Sin stock</span>
                    )}
                  </div>
                  <select
                    value={item.estado}
                    onChange={e => cambiarEstado(item.id, e.target.value)}
                    className="text-xs bg-transparent text-muted-foreground border border-border rounded px-1 py-0.5 focus:outline-none"
                  >
                    {Object.entries(ESTADOS_STOCK).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <ModalNuevoItem
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreado={onItemCreado}
        marcas={marcas}
        tipos={tipos}
      />
    </div>
  )
}

/* ─── MODAL NUEVO ITEM ─────────────────────────────────────── */
function ModalNuevoItem({ open, onClose, onCreado, marcas, tipos }) {
  const [form, setForm] = useState({
    nombre: '', marca: '', tipo: '', variante: '',
    costoCOP: '', precioVentaCOP: '', cantidad: 1,
    estado: 'disponible', notas: '',
  })
  const [foto, setFoto] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const { gananciaCOP, margen } = calcularGanancia(
    Number(form.precioVentaCOP) || 0,
    Number(form.costoCOP) || 0
  )

  async function handleGuardar() {
    if (!form.nombre || !form.costoCOP || !form.precioVentaCOP) {
      toast.error('Nombre, costo y precio de venta son requeridos')
      return
    }
    setGuardando(true)
    try {
      let fotosUrls = []
      if (foto) {
        const r = ref(storage, `inventario/${Date.now()}_${foto.name}`)
        await uploadBytes(r, foto)
        const url = await getDownloadURL(r)
        fotosUrls = [url]
      }

      const data = {
        ...form,
        costoCOP: Number(form.costoCOP),
        precioVentaCOP: Number(form.precioVentaCOP),
        cantidad: Number(form.cantidad),
        gananciaCOP,
        margenPct: margen,
        fotosUrls,
        creadoEn: serverTimestamp(),
      }
      const ref2 = await addDoc(collection(db, 'inventario'), data)
      onCreado({ id: ref2.id, ...data, creadoEn: new Date() })
      toast.success('Producto agregado al stock')
      setForm({ nombre: '', marca: '', tipo: '', variante: '', costoCOP: '', precioVentaCOP: '', cantidad: 1, estado: 'disponible', notas: '' })
      setFoto(null)
    } catch (_) {
      toast.error('Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-semibold text-foreground">Nuevo producto en stock</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <Field label="Nombre del producto *">
                <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Sandalias Michael Kors" className={inputCls} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Marca">
                  <select value={form.marca} onChange={e => set('marca', e.target.value)} className={inputCls}>
                    <option value="">Seleccionar</option>
                    {marcas.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Tipo">
                  <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={inputCls}>
                    <option value="">Seleccionar</option>
                    {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Talla / variante">
                  <input value={form.variante} onChange={e => set('variante', e.target.value)} placeholder="Ej: 38, M, 250ml" className={inputCls} />
                </Field>
                <Field label="Cantidad">
                  <input type="number" min="0" value={form.cantidad} onChange={e => set('cantidad', e.target.value)} className={inputCls} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Costo de compra (COP) *">
                  <input type="number" min="0" value={form.costoCOP} onChange={e => set('costoCOP', e.target.value)} placeholder="0" className={inputCls} />
                </Field>
                <Field label="Precio de venta (COP) *">
                  <input type="number" min="0" value={form.precioVentaCOP} onChange={e => set('precioVentaCOP', e.target.value)} placeholder="0" className={inputCls} />
                </Field>
              </div>

              {Number(form.precioVentaCOP) > 0 && Number(form.costoCOP) > 0 && (
                <div className="flex gap-3">
                  <div className="flex-1 bg-secondary rounded-lg px-3 py-2 text-center">
                    <p className="text-xs text-muted-foreground">Ganancia</p>
                    <p className={`text-sm font-bold ${getColorMargen(margen)}`}>{formatCOP(gananciaCOP)}</p>
                  </div>
                  <div className="flex-1 bg-secondary rounded-lg px-3 py-2 text-center">
                    <p className="text-xs text-muted-foreground">Margen</p>
                    <p className={`text-sm font-bold ${getColorMargen(margen)}`}>{formatPct(margen)}</p>
                  </div>
                </div>
              )}

              <Field label="Foto del producto (opcional)">
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setFoto(e.target.files[0])}
                  className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-secondary file:text-foreground file:text-xs cursor-pointer"
                />
              </Field>

              <Field label="Notas">
                <textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Observaciones adicionales..." />
              </Field>

              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-secondary hover:bg-border text-foreground font-medium rounded-lg text-sm transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={guardando}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-[#C73652] disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors"
                >
                  {guardando ? <Spinner /> : null}
                  {guardando ? 'Guardando...' : 'Agregar al stock'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

const inputCls = 'w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm'

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}
