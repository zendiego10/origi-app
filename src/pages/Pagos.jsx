import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { DollarSign, AlertTriangle, CheckCircle, X, Filter } from 'lucide-react'
import {
  collection, getDocs, addDoc, updateDoc, doc,
  orderBy, query, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import toast from 'react-hot-toast'
import TopBar from '@/components/layout/TopBar'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import { Spinner } from '@/components/ui/Loader'
import { formatCOP, formatDate, diasDesde } from '@/utils/formatters'
import { DIAS_ALERTA_PAGO } from '@/utils/constants'

const FILTROS = ['todos', 'pendiente', 'vencido', 'pagado']

export default function Pagos() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [modalPedido, setModalPedido] = useState(null)

  useEffect(() => {
    cargarPedidos()
  }, [])

  async function cargarPedidos() {
    try {
      const snap = await getDocs(query(collection(db, 'pedidos'), orderBy('creadoEn', 'desc')))
      const todos = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      // Solo pedidos entregados o con anticipo (tienen movimiento de pagos)
      setPedidos(todos.filter(p => p.estado === 'entregado' || (p.anticipoPagado || 0) > 0))
    } catch (_) {}
    finally { setLoading(false) }
  }

  function getEstadoPago(pedido) {
    const saldo = pedido.saldoPendiente || 0
    if (saldo <= 0) return 'pagado'
    const diasDesdeEntrega = diasDesde(pedido.actualizadoEn || pedido.creadoEn)
    if (diasDesdeEntrega > DIAS_ALERTA_PAGO) return 'vencido'
    return 'pendiente'
  }

  const pedidosFiltrados = pedidos.filter(p => {
    if (filtro === 'todos') return true
    return getEstadoPago(p) === filtro
  })

  const totalCartera = pedidos.reduce((s, p) => s + (p.saldoPendiente || 0), 0)
  const totalVencido = pedidos
    .filter(p => getEstadoPago(p) === 'vencido')
    .reduce((s, p) => s + (p.saldoPendiente || 0), 0)
  const totalPagado = pedidos
    .filter(p => getEstadoPago(p) === 'pagado')
    .reduce((s, p) => s + (p.totalCOP || 0), 0)

  async function registrarPago(pedidoId, monto, notas) {
    const pedido = pedidos.find(p => p.id === pedidoId)
    if (!pedido) return

    const nuevoSaldo = Math.max(0, (pedido.saldoPendiente || 0) - monto)

    await Promise.all([
      addDoc(collection(db, 'pagos'), {
        pedidoId,
        clienteId: pedido.clienteId,
        monto,
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
    toast.success(nuevoSaldo === 0 ? '¡Pedido completamente pagado!' : `Pago de ${formatCOP(monto)} registrado`)
    setModalPedido(null)
  }

  const BADGE_ESTADO = {
    pagado: 'success',
    pendiente: 'warning',
    vencido: 'danger',
  }
  const LABEL_ESTADO = {
    pagado: 'Pagado',
    pendiente: 'Pendiente',
    vencido: 'Vencido',
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Pagos" />

      <div className="flex-1 p-4 space-y-4">
        {/* Métricas */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={AlertTriangle} label="Cartera total" value={formatCOP(totalCartera)} color="warning" loading={loading} />
          <StatCard icon={DollarSign} label="Vencido" value={formatCOP(totalVencido)} color="danger" loading={loading} />
          <StatCard icon={CheckCircle} label="Cobrado" value={formatCOP(totalPagado)} color="success" loading={loading} />
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTROS.map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                filtro === f
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'todos' ? 'Todos' : LABEL_ESTADO[f]}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
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
                <motion.div
                  key={pedido.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border rounded-xl p-4"
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
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pedido.codigo} · {formatDate(pedido.creadoEn)}
                      </p>
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

                    {saldo > 0 && (
                      <button
                        onClick={() => setModalPedido(pedido)}
                        className="flex-shrink-0 px-3 py-1.5 bg-primary hover:bg-[#C73652] text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Registrar pago
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <ModalRegistrarPago
        pedido={modalPedido}
        onClose={() => setModalPedido(null)}
        onConfirmar={registrarPago}
      />
    </div>
  )
}

/* ─── MODAL REGISTRAR PAGO ─────────────────────────────────── */
function ModalRegistrarPago({ pedido, onClose, onConfirmar }) {
  const [monto, setMonto] = useState('')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (pedido) {
      setMonto(String(pedido.saldoPendiente || ''))
      setNotas('')
    }
  }, [pedido])

  async function handleConfirmar() {
    const m = Number(monto)
    if (!m || m <= 0) { toast.error('Ingresa un monto válido'); return }
    if (m > pedido.saldoPendiente) { toast.error('El monto supera el saldo pendiente'); return }
    setGuardando(true)
    await onConfirmar(pedido.id, m, notas)
    setGuardando(false)
  }

  return (
    <AnimatePresence>
      {pedido && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60" onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
            className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Registrar pago</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-secondary rounded-lg px-4 py-3 flex justify-between">
                <span className="text-sm text-muted-foreground">{pedido?.clienteNombre}</span>
                <span className="text-sm font-bold text-yellow-400">{formatCOP(pedido?.saldoPendiente)}</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Monto recibido (COP)</label>
                <input
                  type="number"
                  min="0"
                  max={pedido?.saldoPendiente}
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Notas (opcional)</label>
                <input
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder="Ej: Pago por Nequi"
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-secondary hover:bg-border text-foreground font-medium rounded-lg text-sm transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmar}
                  disabled={guardando}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-[#C73652] disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors"
                >
                  {guardando ? <Spinner /> : null}
                  {guardando ? 'Guardando...' : 'Confirmar pago'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
