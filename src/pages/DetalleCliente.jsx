import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { MessageCircle, ShoppingBag, Trash2, Pencil, X } from 'lucide-react'
import { doc, getDoc, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import TopBar from '@/components/layout/TopBar'
import Badge from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Loader'
import WhatsAppSheet from '@/components/ui/WhatsAppSheet'
import { formatCOP, formatDate } from '@/utils/formatters'
import { ESTADOS_PEDIDO, ETIQUETAS_CLIENTE } from '@/utils/constants'
import { spring, backdropVariants } from '@/lib/motion'
import toast from 'react-hot-toast'

export default function DetalleCliente() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState(null)
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [sheetAbierto, setSheetAbierto] = useState(false)
  const [editando, setEditando] = useState(false)
  const [formEdit, setFormEdit] = useState({ nombre: '', telefono: '' })
  const [guardandoEdit, setGuardandoEdit] = useState(false)

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

  function abrirEdicion() {
    setFormEdit({ nombre: cliente.nombre, telefono: cliente.telefono })
    setEditando(true)
  }

  async function guardarEdicion(e) {
    e.preventDefault()
    const nombre = formEdit.nombre.trim()
    const telefono = formEdit.telefono.trim()
    if (!nombre || !telefono) return
    setGuardandoEdit(true)
    try {
      await updateDoc(doc(db, 'clientes', id), { nombre, telefono })
      setCliente(prev => ({ ...prev, nombre, telefono }))
      setEditando(false)
      toast.success('Cliente actualizado')
    } catch (_) {
      toast.error('Error al actualizar el cliente')
    } finally {
      setGuardandoEdit(false)
    }
  }

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

  const totalComprado = pedidos.filter(p => p.estado !== 'cancelado').reduce((s, p) => s + (p.totalCOP || 0), 0)
  const gananciaTotal = pedidos.filter(p => p.estado !== 'cancelado').reduce((s, p) => s + (p.gananciaTotal || 0), 0)
  const saldoTotal = pedidos.reduce((s, p) => s + (p.saldoPendiente || 0), 0)
  const waLink = `https://wa.me/${(cliente.telefono || '').replace(/\D/g, '')}`
  const etiqueta = ETIQUETAS_CLIENTE[cliente.etiqueta]

  return (
    <>
    <div className="flex flex-col min-h-full">
      <TopBar
        title={cliente.nombre}
        backTo="/clientes"
        actions={
          <motion.button
            onClick={abrirEdicion}
            whileTap={{ scale: 0.92 }}
            transition={spring.snap}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border text-muted-foreground hover:text-foreground rounded-lg text-xs font-medium transition-colors"
          >
            <Pencil size={13} />
            Editar
          </motion.button>
        }
      />

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4 pb-8">
        {/* Info cliente */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-bold text-foreground text-lg">{cliente.nombre}</p>
              <p className="text-sm text-muted-foreground">{cliente.telefono}</p>
            </div>
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
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Pedidos', value: pedidos.length, color: '' },
            { label: 'Total comprado', value: formatCOP(totalComprado), color: '' },
            { label: 'Ganancia generada', value: formatCOP(gananciaTotal), color: 'text-green-400' },
            { label: 'Saldo pendiente', value: formatCOP(saldoTotal), color: saldoTotal > 0 ? 'text-yellow-400' : 'text-green-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
              <p className={`text-sm font-bold mt-0.5 ${color || 'text-foreground'}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
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

    <WhatsAppSheet
      open={sheetAbierto}
      onClose={() => setSheetAbierto(false)}
      telefono={cliente.telefono}
      variables={{ nombre: cliente.nombre }}
    />

    {/* Bottom sheet editar cliente */}
    {createPortal(
      <AnimatePresence>
        {editando && (
          <>
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setEditando(false)}
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={spring.smooth}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl border-t border-border max-h-[85vh] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
                    <Pencil size={14} className="text-primary" />
                  </div>
                  <p className="font-semibold text-foreground text-sm">Editar cliente</p>
                </div>
                <motion.button
                  onClick={() => setEditando(false)}
                  whileTap={{ scale: 0.88 }}
                  transition={spring.snap}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
                >
                  <X size={18} />
                </motion.button>
              </div>

              {/* Formulario */}
              <div className="flex-1 overflow-y-auto">
                <form onSubmit={guardarEdicion} className="px-5 py-4 space-y-4 pb-10">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre completo</label>
                    <input
                      type="text"
                      value={formEdit.nombre}
                      onChange={e => setFormEdit(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Ej. María García"
                      required
                      autoFocus
                      className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      value={formEdit.telefono}
                      onChange={e => setFormEdit(prev => ({ ...prev, telefono: e.target.value }))}
                      placeholder="Ej. +57 300 123 4567"
                      required
                      className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={guardandoEdit || !formEdit.nombre.trim() || !formEdit.telefono.trim()}
                    whileTap={{ scale: 0.97 }}
                    transition={spring.snap}
                    className="w-full py-3 bg-primary hover:bg-[#C73652] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
                  >
                    {guardandoEdit ? 'Guardando...' : 'Guardar cambios'}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  )
}
