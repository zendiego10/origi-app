import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Users, MessageCircle, ChevronRight, UserPlus, X } from 'lucide-react'
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'
import TopBar from '@/components/layout/TopBar'
import Badge from '@/components/ui/Badge'
import { formatCOP } from '@/utils/formatters'
import { ETIQUETAS_CLIENTE } from '@/utils/constants'
import toast from 'react-hot-toast'
import { spring, backdropVariants } from '@/lib/motion'

export default function Clientes() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busquedaText, setBusquedaText] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({ nombre: '', telefono: '', etiqueta: 'nuevo' })

  useEffect(() => {
    async function cargar() {
      try {
        const [clientesSnap, pedidosSnap] = await Promise.all([
          getDocs(query(collection(db, 'clientes'), orderBy('creadoEn', 'desc'))),
          getDocs(collection(db, 'pedidos')),
        ])
        const todosLosPedidos = pedidosSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        const todosLosClientes = clientesSnap.docs.map(d => {
          const data = { id: d.id, ...d.data() }
          // Buscar pedidos por clienteId O por nombre (fallback para pedidos sin ID vinculado)
          const pedidosCliente = todosLosPedidos.filter(p =>
            p.clienteId === d.id ||
            (!p.clienteId && p.clienteNombre === data.nombre)
          )
          // Total comprado = suma de TODOS los pedidos no cancelados (no solo entregados)
          const totalComprado = pedidosCliente
            .filter(p => p.estado !== 'cancelado')
            .reduce((s, p) => s + (p.totalCOP || 0), 0)
          const saldoTotal = pedidosCliente
            .reduce((s, p) => s + (p.saldoPendiente || 0), 0)
          return { ...data, pedidosCount: pedidosCliente.length, totalComprado, saldoTotal }
        })
        setClientes(todosLosClientes)
        setPedidos(todosLosPedidos)
      } catch (_) {}
      finally { setLoading(false) }
    }
    cargar()
  }, [])

  function abrirModal() {
    setForm({ nombre: '', telefono: '', etiqueta: 'nuevo' })
    setModalAbierto(true)
  }

  async function guardarCliente(e) {
    e.preventDefault()
    const nombre = form.nombre.trim()
    const telefono = form.telefono.trim()
    if (!nombre || !telefono) return
    setGuardando(true)
    try {
      const ref = await addDoc(collection(db, 'clientes'), {
        nombre,
        telefono,
        etiqueta: form.etiqueta,
        creadoEn: serverTimestamp(),
      })
      const nuevoCliente = { id: ref.id, nombre, telefono, etiqueta: form.etiqueta, pedidosCount: 0, totalComprado: 0, saldoTotal: 0 }
      setClientes(prev => [nuevoCliente, ...prev])
      setModalAbierto(false)
      toast.success('Cliente agregado')
    } catch (_) {
      toast.error('Error al guardar el cliente')
    } finally {
      setGuardando(false)
    }
  }

  const clientesFiltrados = clientes.filter(c =>
    !busquedaText ||
    c.nombre?.toLowerCase().includes(busquedaText.toLowerCase()) ||
    c.telefono?.includes(busquedaText)
  )

  const botonNuevo = (
    <motion.button
      onClick={abrirModal}
      whileTap={{ scale: 0.92 }}
      transition={spring.snap}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-[#C73652] transition-colors"
    >
      <UserPlus size={13} />
      Nuevo
    </motion.button>
  )

  return (
    <>
    <div className="flex flex-col min-h-full">
      <TopBar title="Clientes" actions={botonNuevo} />

      <div className="flex-1 p-4 space-y-4">
        {/* Resumen */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: clientes.length },
            { label: 'Recurrentes', value: clientes.filter(c => c.etiqueta === 'recurrente' || c.etiqueta === 'vip').length },
            { label: 'Nuevos', value: clientes.filter(c => c.etiqueta === 'nuevo').length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-foreground">{loading ? '—' : value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busquedaText}
            onChange={e => setBusquedaText(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          />
        </div>

        {/* Lista */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users size={40} className="text-muted-foreground opacity-30 mb-3" />
            <p className="text-muted-foreground text-sm">No hay clientes registrados</p>
            <p className="text-xs text-muted-foreground mt-1 text-center">Agrega uno con el botón "Nuevo" o créalos al hacer un pedido</p>
          </div>
        ) : (
          <div className="space-y-2">
            {clientesFiltrados.map((cliente, i) => {
              const etiqueta = ETIQUETAS_CLIENTE[cliente.etiqueta]
              const waLink = `https://wa.me/${(cliente.telefono || '').replace(/\D/g, '')}`

              return (
                <motion.div
                  key={cliente.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground text-sm">{cliente.nombre}</p>
                        {etiqueta && <Badge variant={etiqueta.color}>{etiqueta.label}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{cliente.telefono}</p>
                      <div className="flex gap-4 mt-2 flex-wrap">
                        <div>
                          <p className="text-xs text-muted-foreground">Pedidos</p>
                          <p className="text-sm font-medium text-foreground">{cliente.pedidosCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total comprado</p>
                          <p className="text-sm font-semibold text-foreground">{formatCOP(cliente.totalComprado)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Saldo pendiente</p>
                          <p className={`text-sm font-semibold ${(cliente.saldoTotal || 0) > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                            {formatCOP(cliente.saldoTotal || 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-green-500/15 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/25 transition-colors"
                      >
                        <MessageCircle size={15} />
                      </a>
                      <button
                        onClick={() => navigate(`/clientes/${cliente.id}`)}
                        className="p-2 bg-secondary text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>

    {/* Modal nuevo cliente */}
    <AnimatePresence>
      {modalAbierto && (
        <>
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/60 z-50"
            onClick={() => setModalAbierto(false)}
          />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={spring.smooth}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl border-t border-border"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
                  <UserPlus size={14} className="text-primary" />
                </div>
                <p className="font-semibold text-foreground text-sm">Nuevo cliente</p>
              </div>
              <motion.button
                onClick={() => setModalAbierto(false)}
                whileTap={{ scale: 0.88 }}
                transition={spring.snap}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* Formulario */}
            <form onSubmit={guardarCliente} className="px-5 py-4 space-y-4 pb-8">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre completo</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
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
                  value={form.telefono}
                  onChange={e => setForm(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="Ej. +57 300 123 4567"
                  required
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Etiqueta</label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(ETIQUETAS_CLIENTE).map(([key, info]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, etiqueta: key }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        form.etiqueta === key
                          ? 'bg-primary text-white border-primary'
                          : 'bg-transparent text-muted-foreground border-border hover:text-foreground'
                      }`}
                    >
                      {info.label}
                    </button>
                  ))}
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={guardando || !form.nombre.trim() || !form.telefono.trim()}
                whileTap={{ scale: 0.97 }}
                transition={spring.snap}
                className="w-full py-3 bg-primary hover:bg-[#C73652] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                {guardando ? 'Guardando...' : 'Guardar cliente'}
              </motion.button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  )
}
