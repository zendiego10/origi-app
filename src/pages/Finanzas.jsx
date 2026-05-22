import { useState, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { Download, TrendingUp, DollarSign, ShoppingBag, BarChart2 } from 'lucide-react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/services/firebase'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts'
import TopBar from '@/components/layout/TopBar'
import StatCard from '@/components/ui/StatCard'
import { formatCOP, formatDate } from '@/utils/formatters'
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

const PERIODOS = [
  { key: 'mes', label: 'Este mes' },
  { key: 'trimestre', label: 'Trimestre' },
  { key: 'semestre', label: '6 meses' },
  { key: 'año', label: 'Este año' },
]

const CHART_COLORS = ['#E94560', '#27AE60', '#F39C12', '#2980B9', '#9B59B6', '#1ABC9C']

function getRango(periodo) {
  const ahora = new Date()
  switch (periodo) {
    case 'mes': return { inicio: startOfMonth(ahora), fin: endOfMonth(ahora) }
    case 'trimestre': return { inicio: startOfMonth(subMonths(ahora, 2)), fin: endOfMonth(ahora) }
    case 'semestre': return { inicio: startOfMonth(subMonths(ahora, 5)), fin: endOfMonth(ahora) }
    case 'año': return { inicio: new Date(ahora.getFullYear(), 0, 1), fin: new Date(ahora.getFullYear(), 11, 31) }
    default: return { inicio: startOfMonth(ahora), fin: endOfMonth(ahora) }
  }
}

export default function Finanzas() {
  const [periodo, setPeriodo] = useState('mes')
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

  const { rango, entregados, metricas, porCategoria, porMes } = useMemo(() => {
    const rango = getRango(periodo)

    const entregados = pedidos.filter(p => {
      if (p.estado !== 'entregado') return false
      const fecha = p.creadoEn?.toDate?.() || new Date(p.creadoEn)
      return isWithinInterval(fecha, rango)
    })

    const ingresos = entregados.reduce((s, p) => s + (p.totalCOP || 0), 0)
    const costos = entregados.reduce((s, p) => s + ((p.totalCOP || 0) - (p.gananciaTotal || 0)), 0)
    const ganancia = entregados.reduce((s, p) => s + (p.gananciaTotal || 0), 0)
    const margen = ingresos > 0 ? ganancia / ingresos : 0
    const ticket = entregados.length > 0 ? ingresos / entregados.length : 0

    // Datos mensuales para gráfico de línea (últimos 6 meses siempre)
    const porMes = Array.from({ length: 6 }, (_, i) => {
      const fecha = subMonths(new Date(), 5 - i)
      const ini = startOfMonth(fecha)
      const fin = endOfMonth(fecha)
      const delMes = pedidos.filter(p => {
        if (p.estado !== 'entregado') return false
        const f = p.creadoEn?.toDate?.() || new Date(p.creadoEn)
        return isWithinInterval(f, { start: ini, end: fin })
      })
      return {
        mes: format(fecha, 'MMM', { locale: es }),
        ingresos: delMes.reduce((s, p) => s + (p.totalCOP || 0), 0),
        ganancia: delMes.reduce((s, p) => s + (p.gananciaTotal || 0), 0),
      }
    })

    // Por categoría (requiere productos — simplificamos por tipo desde nombre pedido)
    // Agrupamos por tipo usando los pedidos
    const catMap = {}
    entregados.forEach(p => {
      const cat = 'General' // se mejora cuando haya productos con tipo en el pedido
      catMap[cat] = catMap[cat] || { ingresos: 0, ganancia: 0, pedidos: 0 }
      catMap[cat].ingresos += p.totalCOP || 0
      catMap[cat].ganancia += p.gananciaTotal || 0
      catMap[cat].pedidos += 1
    })
    const porCategoria = Object.entries(catMap).map(([nombre, v]) => ({ nombre, ...v }))

    return {
      rango,
      entregados,
      metricas: { ingresos, costos, ganancia, margen, ticket, cantidad: entregados.length },
      porCategoria,
      porMes,
    }
  }, [pedidos, periodo])

  function exportarCSV() {
    const filas = [
      ['Código', 'Cliente', 'Fecha', 'Total COP', 'Ganancia COP', 'Margen %'],
      ...entregados.map(p => [
        p.codigo,
        p.clienteNombre,
        formatDate(p.creadoEn),
        p.totalCOP,
        p.gananciaTotal,
        p.totalCOP > 0 ? Math.round((p.gananciaTotal / p.totalCOP) * 100) + '%' : '0%',
      ]),
    ]
    const csv = filas.map(f => f.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `origi-finanzas-${periodo}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Reporte exportado')
  }

  const tooltipStyle = {
    contentStyle: { background: '#1A1A2E', border: '1px solid #2A2A4A', borderRadius: 8, fontSize: 12 },
    labelStyle: { color: '#A0A0B0' },
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Finanzas"
        actions={
          <button
            onClick={exportarCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border text-muted-foreground hover:text-foreground rounded-lg text-sm transition-colors"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        }
      />

      <div className="flex-1 p-4 space-y-5">
        {/* Selector de período */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PERIODOS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriodo(p.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                periodo === p.key
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Métricas principales */}
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <StatCard icon={DollarSign} label="Ingresos" value={formatCOP(metricas.ingresos)} color="primary" loading={loading} />
          <StatCard icon={TrendingUp} label="Ganancia neta" value={formatCOP(metricas.ganancia)} color="success" loading={loading} />
          <StatCard icon={BarChart2} label="Margen neto" value={`${Math.round(metricas.margen * 100)}%`} color="info" loading={loading} />
          <StatCard icon={ShoppingBag} label="Pedidos" value={metricas.cantidad} sub={`Ticket prom: ${formatCOP(metricas.ticket)}`} color="warning" loading={loading} />
        </motion.div>

        {/* Gráfico de línea — evolución mensual */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold text-foreground mb-4">Evolución últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={porMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A4A" />
              <XAxis dataKey="mes" tick={{ fill: '#A0A0B0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#A0A0B0', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
              <Tooltip {...tooltipStyle} formatter={(v, n) => [formatCOP(v), n === 'ingresos' ? 'Ingresos' : 'Ganancia']} />
              <Line type="monotone" dataKey="ingresos" stroke="#E94560" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ganancia" stroke="#27AE60" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-primary rounded"/><span className="text-xs text-muted-foreground">Ingresos</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-green-400 rounded"/><span className="text-xs text-muted-foreground">Ganancia</span></div>
          </div>
        </div>

        {/* Tabla resumen del período */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <p className="text-sm font-semibold text-foreground px-4 py-3 border-b border-border">
            Resumen del período
          </p>
          <div className="divide-y divide-border">
            {[
              { label: 'Ingresos totales', value: formatCOP(metricas.ingresos), color: '' },
              { label: 'Costos totales', value: formatCOP(metricas.costos), color: 'text-red-400' },
              { label: 'Ganancia neta', value: formatCOP(metricas.ganancia), color: 'text-green-400' },
              { label: 'Margen neto', value: `${Math.round(metricas.margen * 100)}%`, color: metricas.margen >= 0.4 ? 'text-green-400' : metricas.margen >= 0.2 ? 'text-yellow-400' : 'text-red-400' },
              { label: 'Número de pedidos', value: metricas.cantidad, color: '' },
              { label: 'Ticket promedio', value: formatCOP(metricas.ticket), color: '' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-semibold text-foreground ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de pedidos del período */}
        {entregados.length > 0 && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <p className="text-sm font-semibold text-foreground px-4 py-3 border-b border-border">
              Pedidos del período ({entregados.length})
            </p>
            <div className="divide-y divide-border max-h-64 overflow-y-auto">
              {entregados.map(p => {
                const margen = p.totalCOP > 0 ? p.gananciaTotal / p.totalCOP : 0
                return (
                  <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm text-foreground">{p.clienteNombre}</p>
                      <p className="text-xs text-muted-foreground">{p.codigo} · {formatDate(p.creadoEn)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{formatCOP(p.totalCOP)}</p>
                      <p className={`text-xs font-medium ${margen >= 0.4 ? 'text-green-400' : margen >= 0.2 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {Math.round(margen * 100)}% margen
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
