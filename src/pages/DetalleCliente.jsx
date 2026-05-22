import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MessageCircle, ShoppingBag, Trash2 } from 'lucide-react'
import { doc, getDoc, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import TopBar from '@/components/layout/TopBar'
import Badge from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Loader'
import { formatCOP, formatDate } from '@/utils/formatters'
import { ESTADOS_PEDIDO, ETIQUETAS_CLIENTE } from '@/utils/constants'
import toast from 'react-hot-toast'

export default function DetalleCliente() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState(null)
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      try {
        const [clienteDoc, pedidosSnap] = await Promise.all([
          getDoc(doc(db, 'clientes', id)),
          getDocs(collection(db, 'pedidos')),
        ])
        if (clienteDoc.exists()) setCliente({ id: clienteDoc.id, ...clienteDoc.data() })
        const todos = pedidosSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setPedidos(todos.filter(p => p.clienteId === id).sort((a, b) => {
          const fa = a.creadoEn?.toDate?.() || new Date(a.creadoEn)
          const fb = b.creadoEn?.toDate?.() || new Date(b.creadoEn)
          return fb - fa
        }))
      } catch (_) {}
      finally { setLoading(false) }
    }
    cargar()
  }, [id])

  async function cambiarEtiqueta(etiqueta) {
    await updateDoc(doc(db, 'clientes', id), { etiqueta })
    setCliente(prev => ({ ...prev, etiqueta }))
    toast.success('Etiqueta actualizada')
  }

  async function eliminarCliente() {
    if (!confirm(`¿Eliminar a "${cliente.nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      await deleteDoc(doc(db, 'clientes', id))
      toast.success('Cliente eliminado')
      navigate('/clientes', { replace: true })
    } catch (_) {
      toast.error('Error al eliminar el cliente')
    }
  }

  if (loading) return <PageLoader />
  if (!cliente) return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Cliente" backTo="/clientes" />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Cliente no encontrado</p>
      </div>
    </div>
  )

  const totalComprado = pedidos.filter(p => p.estado === 'entregado').reduce((s, p) => s + (p.totalCOP || 0), 0)
  const gananciaTotal = pedidos.filter(p => p.estado === 'entregado').reduce((s, p) => s + (p.gananciaTotal || 0), 0)
  const waLink = `https://wa.me/${(cliente.telefono || '').replace(/\D/g, '')}`
  const etiqueta = ETIQUETAS_CLIENTE[cliente.etiqueta]

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title={cliente.nombre} backTo="/clientes" />

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4 pb-8">
        {/* Info cliente */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-foreground text-lg">{cliente.nombre}</p>
              <p className="text-sm text-muted-foreground">{cliente.telefono}</p>
            </div>
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/15 text-green-400 border border-green-500/20 rounded-lg text-xs font-medium hover:bg-green-500/25 transition-colors">
              <MessageCircle size={13} /> WhatsApp
            </a>
          </div>

          {/* Etiqueta */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Etiqueta:</span>
            {Object.entries(ETIQUETAS_CLIENTE).map(([key, info]) => (
              <button
                key={key}
                onClick={() => cambiarEtiqueta(key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  cliente.etiqueta === key
                    ? 'bg-primary text-white border-primary'
                    : 'bg-transparent text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {info.label}
              </button>
            ))}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pedidos', value: pedidos.length },
            { label: 'Total comprado', value: formatCOP(totalComprado) },
            { label: 'Ganancia generada', value: formatCOP(gananciaTotal) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Historial de pedidos */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <p className="text-sm font-semibold text-foreground px-4 py-3 border-b border-border">
            Historial de pedidos ({pedidos.length})
          </p>
          {pedidos.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingBag size={28} className="text-muted-foreground mx-auto mb-2 opacity-30" />
              <p className="text-sm text-muted-foreground">Sin pedidos registrados</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {pedidos.map(p => {
                const estado = ESTADOS_PEDIDO[p.estado]
                return (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/pedidos/${p.id}`)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.codigo}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(p.creadoEn)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{formatCOP(p.totalCOP)}</p>
                      <Badge variant={estado?.color}>{estado?.label}</Badge>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Zona peligrosa */}
        <div className="border border-red-500/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Zona peligrosa</p>
          <button
            onClick={eliminarCliente}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium rounded-lg text-sm transition-colors w-full justify-center"
          >
            <Trash2 size={14} />
            Eliminar cliente
          </button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Solo elimina el perfil del cliente, no sus pedidos.
          </p>
        </div>
      </div>
    </div>
  )
}
