import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  DollarSign, TrendingUp, ShoppingBag, AlertTriangle,
  Clock, Package, CheckCircle, CreditCard,
} from 'lucide-react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/services/firebase'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import TopBar from '@/components/layout/TopBar'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import { formatCOP, formatDate, diasDesde } from '@/utils/formatters'
import { ESTADOS_PEDIDO, DIAS_ALERTA_RETRASO } from '@/utils/constants'

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.06 } } },
  item: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.25 } } },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      try {
        const snap = await getDocs(collection(db, 'pedidos'))
        setPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (_) {}
      finally { setLoading(false) }
    }
    cargar()
  }, [])

  const { stats, ultimosPedidos, graficoBars, topClientes } = useMemo(() => {
    const ahora = new Date()
    const inicioMes = startOfMonth(ahora)
    const finMes = endOfMonth(ahora)

    const delMes = pedidos.filter(p => {
      if (p.estado !== 'entregado') return false
      const f = p.creadoEn?.toDate?.() || new Date(p.creadoEn)
      return isWithinInterval(f, { start: inicioMes, end: finMes })
    })

    const ventasMes = delMes.reduce((s, p) => s + (p.totalCOP || 0), 0)
    const gananciaMes = delMes.reduce((s, p) => s + (p.gananciaTotal || 0), 0)
    const margenMes = ventasMes > 0 ? gananciaMes / ventasMes : 0
    const cartera = pedidos
      .filter(p => (p.saldoPendiente || 0) > 0)
      .reduce((s, p) => s + (p.saldoPendiente || 0), 0)
    const activos = pedidos.filter(p => ['pendiente', 'en_proceso'].includes(p.estado)).length
    const enColombia = pedidos.filter(p => p.estado === 'en_colombia').length
    const retrasados = pedidos.filter(p => {
      if (!['en_proceso', 'en_colombia'].includes(p.estado)) return false
      return diasDesde(p.actualizadoEn || p.creadoEn) > DIAS_ALERTA_RETRASO
    }).length

    // Últimos 5 pedidos
    const ultimosPedidos = [...pedidos]
      .sort((a, b) => {
        const fa = a.creadoEn?.toDate?.() || new Date(a.creadoEn)
        const fb = b.creadoEn?.toDate?.() || new Date(b.creadoEn)
        return fb - fa
      })
      .slice(0, 5)

    // Gráfico barras — últimos 6 meses
    const graficoBars = Array.from({ length: 6 }, (_, i) => {
      const fecha = subMonths(ahora, 5 - i)
      const ini = startOfMonth(fecha)
      const fin = endOfMonth(fecha)
      const delM = pedidos.filter(p => {
        if (p.estado !== 'entregado') return false
        const f = p.creadoEn?.toDate?.() || new Date(p.creadoEn)
        return isWithinInterval(f, { start: ini, end: fin })
      })
      return {
        mes: format(fecha, 'MMM', { locale: es }),
        ventas: delM.reduce((s, p) => s + (p.totalCOP || 0), 0),
        ganancia: delM.reduce((s, p) => s + (p.gananciaTotal || 0), 0),
      }
    })

    // Top 3 clientes por volumen
    const clienteMap = {}
    pedidos.filter(p => p.estado === 'entregado').forEach(p => {
      const k = p.clienteNombre || 'Desconocido'
      clienteMap[k] = (clienteMap[k] || 0) + (p.totalCOP || 0)
    })
    const topClientes = Object.entries(clienteMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([nombre, total]) => ({ nombre, total }))

    return {
      stats: { ventasMes, gananciaMes, margenMes, cartera, activos, enColombia, retrasados, entregadosMes: delMes.length },
      ultimosPedidos,
      graficoBars,
      topClientes,
    }
  }, [pedidos])

  const tooltipStyle = {
    contentStyle: { background: '#1A1A2E', border: '1px solid #2A2A4A', borderRadius: 8, fontSize: 12 },
    labelStyle: { color: '#A0A0B0' },
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Dashboard" />

      <div className="flex-1 p-4 space-y-5">
        {/* Métricas financieras */}
        <motion.div variants={stagger.container} initial="initial" animate="animate" className="grid grid-cols-2 gap-3">
          {[
            { icon: DollarSign, label: 'Ventas del mes', value: formatCOP(stats.ventasMes), color: 'primary' },
            { icon: TrendingUp, label: 'Ganancia del mes', value: formatCOP(stats.gananciaMes), color: 'success' },
            { icon: TrendingUp, label: 'Margen promedio', value: `${Math.round(stats.margenMes * 100)}%`, color: 'info' },
            { icon: CreditCard, label: 'Saldo por cobrar', value: formatCOP(stats.cartera), color: 'warning' },
          ].map((card, i) => (
            <motion.div key={i} variants={stagger.item}>
              <StatCard {...card} loading={loading} />
            </motion.div>
          ))}
        </motion.div>

        {/* Estado operativo */}
        <motion.div variants={stagger.container} initial="initial" animate="animate" className="grid grid-cols-2 gap-3">
          {[
            { icon: Clock, label: 'Pedidos activos', value: stats.activos, color: 'info' },
            { icon: Package, label: 'En Colombia', value: stats.enColombia, color: 'accent' },
            { icon: AlertTriangle, label: 'Retrasados', value: stats.retrasados, color: 'danger' },
            { icon: CheckCircle, label: 'Entregados (mes)', value: stats.entregadosMes, color: 'success' },
          ].map((card, i) => (
            <motion.div key={i} variants={stagger.item}>
              <StatCard {...card} loading={loading} />
            </motion.div>
          ))}
        </motion.div>

        {/* Gráfico de barras — 6 meses */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold text-foreground mb-4">Ventas y ganancia — últimos 6 meses</p>
          {loading ? (
            <div className="h-44 bg-secondary rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={176}>
              <BarChart data={graficoBars} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A4A" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: '#A0A0B0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#A0A0B0', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip {...tooltipStyle} formatter={(v, n) => [formatCOP(v), n === 'ventas' ? 'Ventas' : 'Ganancia']} />
                <Bar dataKey="ventas" fill="#E94560" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="ganancia" fill="#27AE60" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-primary"/><span className="text-xs text-muted-foreground">Ventas</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-500"/><span className="text-xs text-muted-foreground">Ganancia</span></div>
          </div>
        </div>

        {/* Top clientes + Últimos pedidos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top clientes */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <p className="text-sm font-semibold text-foreground px-4 py-3 border-b border-border">Top clientes</p>
            {loading ? (
              <div className="p-4 space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-secondary rounded animate-pulse" />)}</div>
            ) : topClientes.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Sin datos aún</div>
            ) : (
              <div className="divide-y divide-border">
                {topClientes.map(({ nombre, total }, i) => (
                  <div key={nombre} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-foreground truncate">{nombre}</span>
                    <span className="text-sm font-semibold text-foreground">{formatCOP(total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Últimos pedidos */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">Últimos pedidos</p>
              <button onClick={() => navigate('/pedidos')} className="text-xs text-primary hover:underline">Ver todos</button>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-secondary rounded animate-pulse" />)}</div>
            ) : ultimosPedidos.length === 0 ? (
              <div className="p-6 text-center">
                <ShoppingBag size={28} className="text-muted-foreground mx-auto mb-2 opacity-30" />
                <p className="text-sm text-muted-foreground">No hay pedidos aún</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {ultimosPedidos.map(pedido => {
                  const estado = ESTADOS_PEDIDO[pedido.estado]
                  return (
                    <button
                      key={pedido.id}
                      onClick={() => navigate(`/pedidos/${pedido.id}`)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{pedido.clienteNombre}</p>
                        <p className="text-xs text-muted-foreground">{pedido.codigo}</p>
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
    </div>
  )
}
