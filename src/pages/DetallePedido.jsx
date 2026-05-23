import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { MessageCircle, ChevronRight, AlertTriangle, Trash2 } from 'lucide-react'
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/services/firebase'
import toast from 'react-hot-toast'
import TopBar from '@/components/layout/TopBar'
import Badge from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Loader'
import WhatsAppSheet from '@/components/ui/WhatsAppSheet'
import { formatCOP, formatPct, formatDatetime, getColorMargen, diasDesde } from '@/utils/formatters'
import { ESTADOS_PEDIDO, DIAS_ALERTA_RETRASO } from '@/utils/constants'

export default function DetallePedido() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pedido, setPedido] = useState(null)
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [avanzando, setAvanzando] = useState(false)
  const [sheetAbierto, setSheetAbierto] = useState(false)

  useEffect(() => {
    async function cargar() {
      try {
        const [pedidoDoc, prodSnap] = await Promise.all([
          getDoc(doc(db, 'pedidos', id)),
          getDocs(collection(db, 'pedidos', id, 'productos')),
        ])
        if (pedidoDoc.exists()) {
          setPedido({ id: pedidoDoc.id, ...pedidoDoc.data() })
          setProductos(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        }
      } catch (_) {}
      finally { setLoading(false) }
    }
    cargar()
  }, [id])

  async function avanzarEstado() {
    if (!pedido) return
    const estadoActual = ESTADOS_PEDIDO[pedido.estado]
    if (!estadoActual?.next) return
    setAvanzando(true)
    try {
      const nuevoEstado = estadoActual.next
      const historial = [...(pedido.historialEstados || []), { estado: nuevoEstado, fecha: new Date().toISOString() }]
      await updateDoc(doc(db, 'pedidos', id), { estado: nuevoEstado, historialEstados: historial, actualizadoEn: serverTimestamp() })
      setPedido(prev => ({ ...prev, estado: nuevoEstado, historialEstados: historial }))
      toast.success(`Avanzado a "${ESTADOS_PEDIDO[nuevoEstado].label}"`)
    } catch (_) {
      toast.error('Error al actualizar el estado')
    } finally {
      setAvanzando(false)
    }
  }

  async function cancelarPedido() {
    if (!confirm('¿Cancelar este pedido?')) return
    try {
      const historial = [...(pedido.historialEstados || []), { estado: 'cancelado', fecha: new Date().toISOString() }]
      await updateDoc(doc(db, 'pedidos', id), { estado: 'cancelado', historialEstados: historial, actualizadoEn: serverTimestamp() })
      setPedido(prev => ({ ...prev, estado: 'cancelado', historialEstados: historial }))
      toast.success('Pedido cancelado')
    } catch (_) {
      toast.error('Error al cancelar')
    }
  }

  async function eliminarPedido() {
    if (!confirm(`¿Eliminar el pedido ${pedido.codigo} permanentemente? Esta acción no se puede deshacer.`)) return
    try {
      // Eliminar subcolección de productos primero
      const batch = writeBatch(db)
      const prodSnap = await getDocs(collection(db, 'pedidos', id, 'productos'))
      prodSnap.docs.forEach(d => batch.delete(d.ref))
      batch.delete(doc(db, 'pedidos', id))
      await batch.commit()
      toast.success('Pedido eliminado')
      navigate('/pedidos', { replace: true })
    } catch (_) {
      toast.error('Error al eliminar el pedido')
    }
  }

  if (loading) return <PageLoader />
  if (!pedido) return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Pedido" backTo="/pedidos" />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Pedido no encontrado</p>
      </div>
    </div>
  )

  const estadoInfo = ESTADOS_PEDIDO[pedido.estado]
  const siguienteEstado = estadoInfo?.next ? ESTADOS_PEDIDO[estadoInfo.next] : null
  const diasSinAvanzar = diasDesde(pedido.actualizadoEn || pedido.creadoEn)
  const retrasado = ['en_proceso', 'en_colombia'].includes(pedido.estado) && diasSinAvanzar > DIAS_ALERTA_RETRASO
  const waLink = `https://wa.me/${(pedido.clienteTelefono || '').replace(/\D/g, '')}`

  return (
    <>
    <div className="flex flex-col min-h-full">
      <TopBar title={pedido.codigo} backTo="/pedidos" />

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4 pb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant={estadoInfo?.color} className="text-sm px-3 py-1">{estadoInfo?.label}</Badge>
          {retrasado && (
            <div className="flex items-center gap-1.5 text-red-400 text-sm">
              <AlertTriangle size={14} />
              <span>Retrasado ({diasSinAvanzar} días)</span>
            </div>
          )}
        </div>

        {/* Cliente */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Cliente</p>
          <p className="font-semibold text-foreground">{pedido.clienteNombre}</p>
          <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">{pedido.clienteTelefono}</p>
            <div className="flex gap-2">
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/15 text-green-400 border border-green-500/20 rounded-lg text-xs font-medium hover:bg-green-500/25 transition-colors">
                <MessageCircle size={13} /> WhatsApp
              </a>
              <button
                onClick={() => setSheetAbierto(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                <MessageCircle size={13} /> Mensajes
              </button>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium px-4 py-3 border-b border-border">
            Productos ({productos.length})
          </p>
          {productos.map((p, i) => (
            <div key={p.id} className={`px-4 py-3 ${i < productos.length - 1 ? 'border-b border-border' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">{p.nombre}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.marca} · {p.tipo}</p>
                </div>
                <p className="text-sm font-semibold text-foreground">{formatCOP(p.precioVentaCOP)}</p>
              </div>
              <div className="flex gap-4 mt-1.5">
                <span className="text-xs text-muted-foreground">Costo: {formatCOP(p.costoTotalCOP)}</span>
                <span className={`text-xs font-medium ${getColorMargen(p.margenPct)}`}>Margen: {formatPct(p.margenPct)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Finanzas */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Pagos</p>
          <Row label="Total del pedido" value={formatCOP(pedido.totalCOP)} bold />
          <Row label="Anticipo recibido" value={formatCOP(pedido.anticipoPagado)} />
          <Row label="Saldo pendiente" value={formatCOP(pedido.saldoPendiente)}
            className={(pedido.saldoPendiente || 0) > 0 ? 'text-yellow-400' : 'text-green-400'} />
          <Row label="Ganancia total" value={formatCOP(pedido.gananciaTotal)} className="text-green-400" />
        </div>

        {/* Historial */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Historial</p>
          <div className="space-y-2">
            {(pedido.historialEstados || []).map((h, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <span className="text-foreground font-medium">{ESTADOS_PEDIDO[h.estado]?.label}</span>
                <span className="text-muted-foreground text-xs">{formatDatetime(h.fecha)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones de estado */}
        {pedido.estado !== 'entregado' && pedido.estado !== 'cancelado' && (
          <div className="space-y-3">
            {siguienteEstado && (
              <motion.button onClick={avanzarEstado} disabled={avanzando} whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-[#C73652] disabled:opacity-60 text-white font-semibold rounded-xl transition-colors">
                Avanzar a "{siguienteEstado.label}"
                <ChevronRight size={16} />
              </motion.button>
            )}
            <button onClick={cancelarPedido}
              className="w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium rounded-xl transition-colors text-sm">
              Cancelar pedido
            </button>
          </div>
        )}

        {/* Zona peligrosa — eliminar registro */}
        <div className="border border-red-500/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Zona peligrosa</p>
          <button
            onClick={eliminarPedido}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium rounded-lg text-sm transition-colors w-full justify-center"
          >
            <Trash2 size={14} />
            Eliminar pedido permanentemente
          </button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Elimina el pedido y todos sus productos. Útil para limpiar datos de prueba.
          </p>
        </div>
      </div>
    </div>

    <WhatsAppSheet
      open={sheetAbierto}
      onClose={() => setSheetAbierto(false)}
      telefono={pedido.clienteTelefono}
      variables={{
        nombre: pedido.clienteNombre,
        codigo: pedido.codigo,
        total: formatCOP(pedido.totalCOP),
        saldo: formatCOP(pedido.saldoPendiente),
        estado: ESTADOS_PEDIDO[pedido.estado]?.label || pedido.estado,
      }}
    />
    </>
  )
}

function Row({ label, value, bold, className }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium text-foreground ${bold ? 'font-bold' : ''} ${className || ''}`}>{value}</span>
    </div>
  )
}
