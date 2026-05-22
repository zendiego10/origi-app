import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  DollarSign, TrendingUp, ShoppingBag, AlertTriangle,
  Clock, Package, CheckCircle, Users,
} from 'lucide-react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/services/firebase'
import TopBar from '@/components/layout/TopBar'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import { formatCOP, formatDate, diasDesde } from '@/utils/formatters'
import { ESTADOS_PEDIDO, DIAS_ALERTA_RETRASO } from '@/utils/constants'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.06 } } },
  item: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    ventasMes: 0, gananciaMes: 0, margenMes: 0, cartera: 0,
    activos: 0, enColombia: 0, retrasados: 0, entregadosMes: 0,
  })
  const [ultimosPedidos, setUltimosPedidos] = useState([])

  useEffect(() => {
    async function cargar() {
      try {
        const ahora = new Date()
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

        const pedidosSnap = await getDocs(collection(db, 'pedidos'))
        const pedidos = pedidosSnap.docs.map(d => ({ id: d.id, ...d.data() }))

        const delMes = pedidos.filter(p => {
          const fecha = p.creadoEn?.toDate?.() || new Date(p.creadoEn)
          return fecha >= inicioMes && p.estado === 'entregado'
        })

        const ventasMes = delMes.reduce((s, p) => s + (p.totalCOP || 0), 0)
        const gananciaMes = delMes.reduce((s, p) => s + (p.gananciaTotal || 0), 0)
        const margenMes = ventasMes > 0 ? gananciaMes / ventasMes : 0
        const cartera = pedidos
          .filter(p => p.estado === 'entregado' && (p.saldoPendiente || 0) > 0)
          .reduce((s, p) => s + (p.saldoPendiente || 0), 0)

        const activos = pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'en_proceso').length
        const enColombia = pedidos.filter(p => p.estado === 'en_colombia').length
        const entregadosMes = delMes.length

        const retrasados = pedidos.filter(p => {
          if (!['en_proceso', 'en_colombia'].includes(p.estado)) return false
          const actualizado = p.actualizadoEn?.toDate?.() || p.creadoEn?.toDate?.() || new Date()
          return diasDesde(actualizado) > DIAS_ALERTA_RETRASO
        }).length

        setStats({ ventasMes, gananciaMes, margenMes, cartera, activos, enColombia, retrasados, entregadosMes })

        const ultimos = pedidos
          .sort((a, b) => {
            const fa = a.creadoEn?.toDate?.() || new Date(a.creadoEn)
            const fb = b.creadoEn?.toDate?.() || new Date(b.creadoEn)
            return fb - fa
          })
          .slice(0, 5)
        setUltimosPedidos(ultimos)
      } catch (err) {
        // Si no hay datos aún, está bien
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Dashboard" />

      <div className="flex-1 p-4 space-y-6">
        {/* Métricas financieras */}
        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-3"
        >
          {[
            { icon: DollarSign, label: 'Ventas del mes', value: formatCOP(stats.ventasMes), color: 'primary', loading },
            { icon: TrendingUp, label: 'Ganancia del mes', value: formatCOP(stats.gananciaMes), color: 'success', loading },
            { icon: TrendingUp, label: 'Margen promedio', value: `${Math.round(stats.margenMes * 100)}%`, color: 'info', loading },
            { icon: AlertTriangle, label: 'Saldo por cobrar', value: formatCOP(stats.cartera), color: 'warning', loading },
          ].map((card, i) => (
            <motion.div key={i} variants={stagger.item}>
              <StatCard {...card} />
            </motion.div>
          ))}
        </motion.div>

        {/* Estado operativo */}
        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-3"
        >
          {[
            { icon: Clock, label: 'Pedidos activos', value: stats.activos, color: 'info', loading },
            { icon: Package, label: 'En Colombia', value: stats.enColombia, color: 'accent', loading },
            { icon: AlertTriangle, label: 'Retrasados', value: stats.retrasados, color: 'danger', loading },
            { icon: CheckCircle, label: 'Entregados (mes)', value: stats.entregadosMes, color: 'success', loading },
          ].map((card, i) => (
            <motion.div key={i} variants={stagger.item}>
              <StatCard {...card} />
            </motion.div>
          ))}
        </motion.div>

        {/* Últimos pedidos */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Últimos pedidos</p>
            <button
              onClick={() => navigate('/pedidos')}
              className="text-xs text-primary hover:underline"
            >
              Ver todos
            </button>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-secondary rounded animate-pulse" />
              ))}
            </div>
          ) : ultimosPedidos.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingBag size={32} className="text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">No hay pedidos aún</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {ultimosPedidos.map((pedido) => {
                const estado = ESTADOS_PEDIDO[pedido.estado]
                return (
                  <button
                    key={pedido.id}
                    onClick={() => navigate(`/pedidos/${pedido.id}`)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{pedido.clienteNombre}</p>
                      <p className="text-xs text-muted-foreground">{pedido.codigo} · {formatDate(pedido.creadoEn)}</p>
                    </div>
                    <Badge variant={estado?.color}>{estado?.label}</Badge>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
