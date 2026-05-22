import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign, AlertTriangle, CheckCircle, X,
  Clock, ChevronRight, Receipt,
} from 'lucide-react'
import {
  collection, getDocs, addDoc, updateDoc, doc,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import toast from 'react-hot-toast'
import TopBar from '@/components/layout/TopBar'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import { Spinner } from '@/components/ui/Loader'
import { formatCOP, formatDate, formatDatetime, diasDesde } from '@/utils/formatters'
import { DIAS_ALERTA_PAGO } from '@/utils/constants'

const FILTROS = ['todos', 'pendiente', 'vencido', 'pagado']
const BADGE_ESTADO = { pagado: 'success', pendiente: 'warning', vencido: 'danger' }
const LABEL_ESTADO = { pagado: 'Pagado', pendiente: 'Pendiente', vencido: 'Vencido' }

const METODOS_PAGO = ['Nequi', 'Daviplata', 'Transferencia', 'Efectivo', 'Otro']

function getEstadoPago(pedido) {
  if ((pedido.saldoPendiente || 0) <= 0) return 'pagado'
  const dias = diasDesde(pedido.actualizadoEn || pedido.creadoEn)
  return dias > DIAS_ALERTA_PAGO ? 'vencido' : 'pendiente'
}

export default function Pagos() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null)

  useEffect(() => {
    cargarPedidos()
  }, [])

  async function cargarPedidos() {
    try {
      const snap = await getDocs(
        query(collection(db, 'pedidos'), orderBy('creadoEn', 'desc'))
      )
      const todos = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      // Mostrar todo pedido que tenga saldo pendiente > 0 O que ya fue pagado completamente
      setPedidos(todos.filter(p =>
        (p.saldoPendiente || 0) > 0 ||
        (p.anticipoPagado || 0) > 0 ||
        p.estado === 'entregado'
      ))
    } catch (_) {}
    finally { setLoading(false) }
  }

  async function registrarPago(pedidoId, monto, metodo, notas) {
    const pedido = pedidos.find(p => p.id === pedidoId)
    if (!pedido) return

    const nuevoSaldo = Math.max(0, (pedido.saldoPendiente || 0) - monto)

    await Promise.all([
      addDoc(collection(db, 'pagos'), {
        pedidoId,
        clienteId: pedido.clienteId,
        clienteNombre: pedido.clienteNombre,
        monto,
        metodo,
        notas,
        fecha: serverTimestamp(),
      }),
      updateDoc(doc(db, 'pedidos', pedidoId), {
        saldoPendiente: nuevoSaldo,
        actualizadoEn: serverTimestamp(),
      }),
    ])

    setPedidos(prev =>
      prev.map(p => p.id === pedidoId ? { ...p, saldoPendiente: nuevoSaldo } : p)
    )
    // Actualizar el pedido seleccionado también
    setPedidoSeleccionado(prev =>
      prev?.id === pedidoId ? { ...prev, saldoPendiente: nuevoSaldo } : prev
    )

    toast.success(nuevoSaldo === 0 ? '¡Pedido completamente pagado!' : `Pago de ${formatCOP(monto)} registrado`)
  }

  const pedidosFiltrados = pedidos.filter(p =>
    filtro === 'todos' || getEstadoPago(p) === filtro
  )

  const totalCartera = pedidos.reduce((s, p) => s + (p.saldoPendiente || 0), 0)
  const totalVencido = pedidos.filter(p => getEstadoPago(p) === 'vencido').reduce((s, p) => s + (p.saldoPendiente || 0), 0)
  const totalCobrado = pedidos.filter(p => getEstadoPago(p) === 'pagado').reduce((s, p) => s + (p.totalCOP || 0), 0)

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Pagos" />

      <div className="flex-1 p-4 space-y-4">
        {/* Métricas */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={AlertTriangle} label="Por cobrar" value={formatCOP(totalCartera)} color="warning" loading={loading} />
          <StatCard icon={DollarSign} label="Vencido" value={formatCOP(totalVencido)} color="danger" loading={loading} />
          <StatCard icon={CheckCircle} label="Cobrado" value={formatCOP(totalCobrado)} color="success" loading={loading} />
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTROS.map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filtro === f ? 'bg-primary text-white' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'todos' ? 'Todos' : LABEL_ESTADO[f]}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-card border border-border rounded-xl animate-pulse" />)}
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <CheckCircle size={40} className="text-green-400 opacity-40 mb-3" />
            <p className="text-muted-foreground text-sm">No hay pedidos en esta categoría</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pedidosFiltrados.map((pedido, i) => {
              const estadoPago = getEstadoPago(pedido)
              const saldo = pedido.saldoPendiente || 0
              const dias = diasDesde(pedido.actualizadoEn || pedido.creadoEn)

              return (
                <motion.button
                  key={pedido.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setPedidoSeleccionado(pedido)}
                  className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground text-sm">{pedido.clienteNombre}</p>
                        <Badge variant={BADGE_ESTADO[estadoPago]}>{LABEL_ESTADO[estadoPago]}</Badge>
                        {estadoPago === 'vencido' && (
                          <span className="text-xs text-red-400 flex items-center gap-1">
                            <AlertTriangle size={11} />{dias}d
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{pedido.codigo}</p>
                      <div className="flex gap-4 mt-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="text-sm font-medium text-foreground">{formatCOP(pedido.totalCOP)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Anticipo</p>
                          <p className="text-sm font-medium text-foreground">{formatCOP(pedido.anticipoPagado)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Saldo</p>
                          <p className={`text-sm font-bold ${saldo > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                            {formatCOP(saldo)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}
      </div>

      {/* Panel de detalle */}
      <PanelDetallePago
        pedido={pedidoSeleccionado}
        onClose={() => setPedidoSeleccionado(null)}
        onRegistrarPago={registrarPago}
      />
    </div>
  )
}

/* ─── PANEL DETALLE DE PAGOS ───────────────────────────────── */
function PanelDetallePago({ pedido, onClose, onRegistrarPago }) {
  const [historial, setHistorial] = useState([])
  const [loadingHistorial, setLoadingHistorial] = useState(false)
  const [mostrarFormPago, setMostrarFormPago] = useState(false)
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState(METODOS_PAGO[0])
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!pedido) { setHistorial([]); setMostrarFormPago(false); return }
    cargarHistorial()
    setMonto(String(pedido.saldoPendiente || ''))
  }, [pedido])

  async function cargarHistorial() {
    setLoadingHistorial(true)
    try {
      const snap = await getDocs(
        query(
          collection(db, 'pagos'),
          where('pedidoId', '==', pedido.id),
          orderBy('fecha', 'desc')
        )
      )
      setHistorial(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (_) {
      setHistorial([])
    } finally {
      setLoadingHistorial(false)
    }
  }

  async function handleConfirmar() {
    const m = Number(monto)
    if (!m || m <= 0) { toast.error('Ingresa un monto válido'); return }
    if (m > (pedido.saldoPendiente || 0)) { toast.error('El monto supera el saldo pendiente'); return }
    setGuardando(true)
    try {
      await onRegistrarPago(pedido.id, m, metodo, notas)
      // Agregar al historial local optimísticamente
      setHistorial(prev => [{
        id: Date.now().toString(),
        monto: m,
        metodo,
        notas,
        fecha: null, // null = "ahora mismo"
      }, ...prev])
      setMostrarFormPago(false)
      setNotas('')
    } finally {
      setGuardando(false)
    }
  }

  const saldo = pedido?.saldoPendiente || 0

  return (
    <AnimatePresence>
      {pedido && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Panel lateral / bottom sheet */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div>
                <p className="font-semibold text-foreground">{pedido.clienteNombre}</p>
                <p className="text-xs text-muted-foreground">{pedido.codigo}</p>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                <X size={20} />
              </button>
            </div>

            {/* Resumen financiero */}
            <div className="px-5 py-4 border-b border-border flex-shrink-0">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total pedido</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{formatCOP(pedido.totalCOP)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Anticipo</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{formatCOP(pedido.anticipoPagado)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <p className={`text-sm font-bold mt-0.5 ${saldo > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {formatCOP(saldo)}
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido scrollable */}
            <div className="flex-1 overflow-y-auto">
              {/* Historial de pagos */}
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Historial de pagos
                </p>

                {loadingHistorial ? (
                  <div className="flex justify-center py-6">
                    <Spinner />
                  </div>
                ) : historial.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt size={28} className="text-muted-foreground opacity-30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Sin pagos registrados aún</p>
                    {pedido.anticipoPagado > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Anticipo de {formatCOP(pedido.anticipoPagado)} registrado al crear el pedido
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Anticipo inicial si existe */}
                    {(pedido.anticipoPagado || 0) > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <DollarSign size={13} className="text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-foreground">{formatCOP(pedido.anticipoPagado)}</p>
                              <p className="text-xs text-muted-foreground">Anticipo inicial · Al crear el pedido</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pagos registrados */}
                    {historial.map((pago) => (
                      <div key={pago.id} className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                        <div className="w-7 h-7 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle size={13} className="text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-sm font-semibold text-green-400">{formatCOP(pago.monto)}</p>
                            <p className="text-xs text-muted-foreground flex-shrink-0">
                              {pago.fecha ? formatDate(pago.fecha) : 'Ahora'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-border text-foreground px-2 py-0.5 rounded-full font-medium">
                              {pago.metodo || 'Sin método'}
                            </span>
                            {pago.notas && (
                              <p className="text-xs text-muted-foreground truncate">{pago.notas}</p>
                            )}
                          </div>
                          {pago.fecha && (
                            <p className="text-xs text-muted-foreground mt-0.5">{formatDatetime(pago.fecha)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pie: registrar pago */}
            <div className="flex-shrink-0 border-t border-border p-5 space-y-3">
              {saldo > 0 && !mostrarFormPago && (
                <button
                  onClick={() => setMostrarFormPago(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-[#C73652] text-white font-semibold rounded-xl transition-colors"
                >
                  <DollarSign size={16} />
                  Registrar pago
                </button>
              )}

              <AnimatePresence>
                {mostrarFormPago && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    {/* Monto */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Monto recibido (COP)</label>
                      <input
                        type="number"
                        min="0"
                        max={saldo}
                        value={monto}
                        onChange={e => setMonto(e.target.value)}
                        className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                      />
                      <p className="text-xs text-muted-foreground">Saldo pendiente: {formatCOP(saldo)}</p>
                    </div>

                    {/* Método de pago */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">¿Por dónde pagó?</label>
                      <div className="flex gap-2 flex-wrap">
                        {METODOS_PAGO.map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setMetodo(m)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              metodo === m
                                ? 'bg-primary text-white border-primary'
                                : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notas */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Notas (opcional)</label>
                      <input
                        value={notas}
                        onChange={e => setNotas(e.target.value)}
                        placeholder="Ej: Pagó el resto del saldo"
                        className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setMostrarFormPago(false)}
                        className="flex-1 px-4 py-2.5 bg-secondary hover:bg-border text-foreground font-medium rounded-lg text-sm transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleConfirmar}
                        disabled={guardando}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-[#C73652] disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors"
                      >
                        {guardando ? <Spinner /> : null}
                        {guardando ? 'Guardando...' : 'Confirmar'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {saldo <= 0 && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <p className="text-sm text-green-400 font-medium">Pedido completamente pagado</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
