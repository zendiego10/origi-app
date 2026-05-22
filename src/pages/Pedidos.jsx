import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LIST_CONTAINER, ITEM_VARIANT, CARD_TAP, CARD_HOVER, BUTTON_TAP } from '@/utils/animations'
import { Plus, Search, ShoppingBag } from 'lucide-react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '@/services/firebase'
import TopBar from '@/components/layout/TopBar'
import Badge from '@/components/ui/Badge'
import { formatCOP, formatDate, diasDesde } from '@/utils/formatters'
import { ESTADOS_PEDIDO, DIAS_ALERTA_RETRASO } from '@/utils/constants'

const FILTROS = ['todos', 'pendiente', 'en_proceso', 'en_colombia', 'entregado', 'cancelado']

export default function Pedidos() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
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

  const pedidosFiltrados = pedidos.filter(p => {
    const matchFiltro = filtro === 'todos' || p.estado === filtro
    const matchBusqueda = !busqueda ||
      p.clienteNombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo?.toLowerCase().includes(busqueda.toLowerCase())
    return matchFiltro && matchBusqueda
  })

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Pedidos"
        actions={
          <button
            onClick={() => navigate('/pedidos/nuevo')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-[#C73652] transition-colors"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        }
      />

      <div className="flex-1 p-4 space-y-3 w-full min-w-0">
        {/* Buscador */}
        <div className="relative w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente o código..."
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          />
        </div>

        {/* Filtros — scroll horizontal sin expandir el layout */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTROS.map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filtro === f
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'todos' ? 'Todos' : ESTADOS_PEDIDO[f]?.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center w-full">
            <ShoppingBag size={40} className="text-muted-foreground opacity-30 mb-3" />
            <p className="text-muted-foreground text-sm">No hay pedidos</p>
            <button
              onClick={() => navigate('/pedidos/nuevo')}
              className="mt-4 self-center px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-[#C73652] transition-colors"
            >
              Crear primer pedido
            </button>
          </div>
        ) : (
          <motion.div
            variants={LIST_CONTAINER}
            initial="initial"
            animate="enter"
            className="space-y-2"
          >
            {pedidosFiltrados.map((pedido) => {
              const estado = ESTADOS_PEDIDO[pedido.estado]
              const diasSinAvanzar = diasDesde(pedido.actualizadoEn || pedido.creadoEn)
              const retrasado = ['en_proceso', 'en_colombia'].includes(pedido.estado) && diasSinAvanzar > DIAS_ALERTA_RETRASO

              return (
                <motion.button
                  key={pedido.id}
                  variants={ITEM_VARIANT}
                  whileTap={CARD_TAP}
                  whileHover={CARD_HOVER}
                  onClick={() => navigate(`/pedidos/${pedido.id}`)}
                  className="w-full bg-card border border-border rounded-xl p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground text-sm truncate">{pedido.clienteNombre}</p>
                        {retrasado && (
                          <span className="text-xs text-red-400 font-medium">⚠ Retrasado</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pedido.codigo} · {formatDate(pedido.creadoEn)}
                      </p>
                      <p className="text-sm font-semibold text-foreground mt-1.5">{formatCOP(pedido.totalCOP)}</p>
                    </div>
                    <Badge variant={estado?.color}>{estado?.label}</Badge>
                  </div>
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </div>

      {/* FAB móvil */}
      <motion.button
        onClick={() => navigate('/pedidos/nuevo')}
        whileTap={BUTTON_TAP}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center z-50"
      >
        <Plus size={24} />
      </motion.button>
    </div>
  )
}
