import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Search, Users, MessageCircle, ChevronRight } from 'lucide-react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/services/firebase'
import TopBar from '@/components/layout/TopBar'
import Badge from '@/components/ui/Badge'
import { formatCOP, formatDate } from '@/utils/formatters'
import { ETIQUETAS_CLIENTE } from '@/utils/constants'

export default function Clientes() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState([])
  const [busquedaText, setBusquedaText] = useState('')

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

  const clientesFiltrados = clientes.filter(c =>
    !busquedaText ||
    c.nombre?.toLowerCase().includes(busquedaText.toLowerCase()) ||
    c.telefono?.includes(busquedaText)
  )

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Clientes" />

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
            <p className="text-xs text-muted-foreground mt-1">Los clientes se crean al hacer un pedido</p>
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
  )
}
