import { useState, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import {
  Download, TrendingUp, DollarSign, ShoppingBag,
  Package, AlertTriangle, BarChart2, Percent,
} from 'lucide-react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/services/firebase'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import TopBar from '@/components/layout/TopBar'
import StatCard from '@/components/ui/StatCard'
import { formatCOP, formatPct } from '@/utils/formatters'
import { LIST_CONTAINER, ITEM_VARIANT } from '@/utils/animations'
import toast from 'react-hot-toast'

const PERIODOS = [
  { key: 'mes', label: 'Este mes' },
  { key: 'trimestre', label: 'Trimestre' },
  { key: 'semestre', label: '6 meses' },
  { key: 'año', label: 'Este año' },
]
const CHART_COLORS = ['#E94560', '#27AE60', '#F39C12', '#2980B9', '#9B59B6', '#1ABC9C', '#E67E22']

function getRango(periodo) {
  const ahora = new Date()
  const ini = (meses) => startOfMonth(subMonths(ahora, meses))
  const fin = endOfMonth(ahora)
  return {
    mes:       { inicio: startOfMonth(ahora), fin },
    trimestre: { inicio: ini(2), fin },
    semestre:  { inicio: ini(5), fin },
    año:       { inicio: new Date(ahora.getFullYear(), 0, 1), fin },
  }[periodo]
}

// ─── TOOLTIP PERSONALIZADO ───────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatCOP(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function Finanzas() {
  const [periodo, setPeriodo] = useState('mes')
  const [pedidos, setPedidos] = useState([])
  const [productos, setProductos] = useState([]) // todos los productos de todos los pedidos
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      try {
        const pedidosSnap = await getDocs(collection(db, 'pedidos'))
        const todosPedidos = pedidosSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setPedidos(todosPedidos)

        // Cargar todos los productos para análisis por marca/tipo
        const productosPromises = todosPedidos.map(p =>
          getDocs(collection(db, 'pedidos', p.id, 'productos'))
            .then(snap => snap.docs.map(d => ({
              ...d.data(),
              pedidoId: p.id,
              estadoPedido: p.estado,
              fechaPedido: p.creadoEn,
            })))
        )
        const todosProductos = (await Promise.all(productosPromises)).flat()
        setProductos(todosProductos)
      } catch (_) {}
      finally { setLoading(false) }
    }
    cargar()
  }, [])

  const datos = useMemo(() => {
    const rango = getRango(periodo)
    const enRango = (p) => {
      const f = p.creadoEn?.toDate?.() || new Date(p.creadoEn)
      return isWithinInterval(f, { start: rango.inicio, end: rango.fin })
    }

    // Pedidos del período (todos los estados, excepto cancelados)
    const delPeriodo = pedidos.filter(p => enRango(p) && p.estado !== 'cancelado')
    const entregados = pedidos.filter(p => enRango(p) && p.estado === 'entregado')
    const pendientesCobro = pedidos.filter(p => (p.saldoPendiente || 0) > 0)

    // ── MÉTRICAS PRINCIPALES ──────────────────────────────
    const inversionTotal = delPeriodo.reduce((s, p) => s + ((p.totalCOP || 0) - (p.gananciaTotal || 0)), 0)
    const ventaTotal = delPeriodo.reduce((s, p) => s + (p.totalCOP || 0), 0)
    const gananciaTotal = delPeriodo.reduce((s, p) => s + (p.gananciaTotal || 0), 0)
    const cobrado = pedidos.reduce((s, p) => s + Math.max(0, (p.totalCOP || 0) - (p.saldoPendiente || 0)), 0)
    const carteraPendiente = pendientesCobro.reduce((s, p) => s + (p.saldoPendiente || 0), 0)
    const margenNeto = ventaTotal > 0 ? gananciaTotal / ventaTotal : 0
    const roi = inversionTotal > 0 ? gananciaTotal / inversionTotal : 0
    const ticketPromedio = delPeriodo.length > 0 ? ventaTotal / delPeriodo.length : 0

    // ── GASTOS DESGLOSADOS ────────────────────────────────
    const productosDelPeriodo = productos.filter(pr => {
      const f = pr.fechaPedido?.toDate?.() || new Date(pr.fechaPedido)
      return pr.estadoPedido !== 'cancelado' && isWithinInterval(f, { start: rango.inicio, end: rango.fin })
    })

    const gastoEnvioCol = productosDelPeriodo.reduce((s, p) => s + (p.envioColombia || 0), 0)
    const gastoEnvioBagre = productosDelPeriodo.reduce((s, p) => s + (p.costoElBagre || 0), 0)
    const gastoTaxes = productosDelPeriodo.reduce((s, p) => s + ((p.taxesUSD || 0) * (p.trm || 4200)), 0)
    const gastoEnvioUSA = productosDelPeriodo.reduce((s, p) => s + ((p.envioUSA || 0) * (p.trm || 4200)), 0)

    // ── TOP MARCAS ────────────────────────────────────────
    const marcaMap = {}
    productosDelPeriodo.forEach(p => {
      const k = p.marca || 'Sin marca'
      if (!marcaMap[k]) marcaMap[k] = { ingresos: 0, ganancia: 0, unidades: 0 }
      marcaMap[k].ingresos += p.precioVentaCOP || 0
      marcaMap[k].ganancia += p.gananciaCOP || 0
      marcaMap[k].unidades += 1
    })
    const topMarcas = Object.entries(marcaMap)
      .map(([nombre, v]) => ({ nombre, ...v, margen: v.ingresos > 0 ? v.ganancia / v.ingresos : 0 }))
      .sort((a, b) => b.ganancia - a.ganancia)
      .slice(0, 6)

    // ── TOP TIPOS ─────────────────────────────────────────
    const tipoMap = {}
    productosDelPeriodo.forEach(p => {
      const k = p.tipo || 'Sin tipo'
      if (!tipoMap[k]) tipoMap[k] = { ingresos: 0, ganancia: 0, unidades: 0 }
      tipoMap[k].ingresos += p.precioVentaCOP || 0
      tipoMap[k].ganancia += p.gananciaCOP || 0
      tipoMap[k].unidades += 1
    })
    const topTipos = Object.entries(tipoMap)
      .map(([nombre, v]) => ({ nombre, ...v, margen: v.ingresos > 0 ? v.ganancia / v.ingresos : 0 }))
      .sort((a, b) => b.ganancia - a.ganancia)
      .slice(0, 6)

    // ── GRÁFICO MENSUAL (siempre 6 meses) ────────────────
    const graficoBars = Array.from({ length: 6 }, (_, i) => {
      const fecha = subMonths(new Date(), 5 - i)
      const ini = startOfMonth(fecha)
      const fin = endOfMonth(fecha)
      const delMes = pedidos.filter(p => {
        if (p.estado === 'cancelado') return false
        const f = p.creadoEn?.toDate?.() || new Date(p.creadoEn)
        return isWithinInterval(f, { start: ini, end: fin })
      })
      return {
        mes: format(fecha, 'MMM', { locale: es }),
        ventas: delMes.reduce((s, p) => s + (p.totalCOP || 0), 0),
        ganancia: delMes.reduce((s, p) => s + (p.gananciaTotal || 0), 0),
        inversion: delMes.reduce((s, p) => s + Math.max(0, (p.totalCOP || 0) - (p.gananciaTotal || 0)), 0),
      }
    })

    return {
      inversionTotal, ventaTotal, gananciaTotal, cobrado,
      carteraPendiente, margenNeto, roi, ticketPromedio,
      gastoEnvioCol, gastoEnvioBagre, gastoTaxes, gastoEnvioUSA,
      topMarcas, topTipos, graficoBars,
      cantidadPedidos: delPeriodo.length,
    }
  }, [pedidos, productos, periodo])

  function exportarCSV() {
    const rango = getRango(periodo)
    const delPeriodo = pedidos.filter(p => {
      const f = p.creadoEn?.toDate?.() || new Date(p.creadoEn)
      return p.estado !== 'cancelado' && isWithinInterval(f, { start: rango.inicio, end: rango.fin })
    })
    const filas = [
      ['Código', 'Cliente', 'Fecha', 'Estado', 'Total COP', 'Inversión COP', 'Ganancia COP', 'Margen %'],
      ...delPeriodo.map(p => {
        const inv = (p.totalCOP || 0) - (p.gananciaTotal || 0)
        const margen = p.totalCOP > 0 ? Math.round((p.gananciaTotal / p.totalCOP) * 100) : 0
        return [p.codigo, p.clienteNombre, format(p.creadoEn?.toDate?.() || new Date(p.creadoEn), 'dd/MM/yyyy'), p.estado, p.totalCOP, inv, p.gananciaTotal, `${margen}%`]
      }),
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
            <span className="hidden sm:inline">CSV</span>
          </button>
        }
      />

      <motion.div
        variants={LIST_CONTAINER}
        initial="initial"
        animate="enter"
        className="flex-1 p-4 space-y-5"
      >
        {/* Selector de período */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {PERIODOS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriodo(p.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                periodo === p.key ? 'bg-primary text-white' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* ── MÉTRICAS PRINCIPALES ─────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: DollarSign,  label: 'Ventas totales',    value: formatCOP(datos.ventaTotal),    color: 'primary'  },
            { icon: TrendingUp,  label: 'Ganancia neta',     value: formatCOP(datos.gananciaTotal), color: 'success'  },
            { icon: Package,     label: 'Inversión total',   value: formatCOP(datos.inversionTotal),color: 'info'     },
            { icon: Percent,     label: 'ROI del período',   value: `${Math.round(datos.roi * 100)}%`, color: datos.roi >= 0.4 ? 'success' : datos.roi >= 0.2 ? 'warning' : 'danger' },
            { icon: BarChart2,   label: 'Margen neto',       value: formatPct(datos.margenNeto),    color: datos.margenNeto >= 0.4 ? 'success' : 'warning' },
            { icon: ShoppingBag, label: 'Pedidos',           value: datos.cantidadPedidos, sub: `Ticket: ${formatCOP(datos.ticketPromedio)}`, color: 'info' },
            { icon: DollarSign,  label: 'Total cobrado',     value: formatCOP(datos.cobrado),       color: 'success'  },
            { icon: AlertTriangle, label: 'Cartera pendiente', value: formatCOP(datos.carteraPendiente), color: 'warning' },
          ].map((card, i) => (
            <motion.div key={i} variants={ITEM_VARIANT}>
              <StatCard {...card} loading={loading} />
            </motion.div>
          ))}
        </div>

        {/* ── GRÁFICO TENDENCIA 6 MESES ─────────────────── */}
        <motion.div variants={ITEM_VARIANT} className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold text-foreground mb-4">Ventas, ganancia e inversión — 6 meses</p>
          {loading ? (
            <div className="h-48 bg-secondary rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={192}>
              <LineChart data={datos.graficoBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A4A" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: '#A0A0B0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#A0A0B0', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="ventas"   name="Ventas"    stroke="#E94560" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ganancia" name="Ganancia"  stroke="#27AE60" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="inversion" name="Inversión" stroke="#2980B9" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          )}
          <div className="flex gap-5 mt-2 justify-center flex-wrap">
            {[['#E94560','Ventas'], ['#27AE60','Ganancia'], ['#2980B9','Inversión']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 rounded" style={{ background: c }} />
                <span className="text-xs text-muted-foreground">{l}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── DESGLOSE DE GASTOS ────────────────────────── */}
        <motion.div variants={ITEM_VARIANT} className="bg-card border border-border rounded-xl overflow-hidden">
          <p className="text-sm font-semibold text-foreground px-4 py-3 border-b border-border">
            Desglose de gastos operativos
          </p>
          <div className="divide-y divide-border">
            {[
              { label: 'Costo de productos (base USD)',    value: datos.inversionTotal - datos.gastoEnvioCol - datos.gastoEnvioBagre - datos.gastoTaxes - datos.gastoEnvioUSA, pct: null },
              { label: 'Taxes EE.UU. (7%)',               value: datos.gastoTaxes,      pct: datos.inversionTotal },
              { label: 'Envío en EE.UU.',                 value: datos.gastoEnvioUSA,   pct: datos.inversionTotal },
              { label: 'Envío a Colombia',                value: datos.gastoEnvioCol,   pct: datos.inversionTotal },
              { label: 'Envío a El Bagre',                value: datos.gastoEnvioBagre, pct: datos.inversionTotal },
            ].map(({ label, value, pct }) => (
              <div key={label} className="flex items-start justify-between gap-2 px-4 py-2.5">
                <span className="text-sm text-muted-foreground flex-1 min-w-0">{label}</span>
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-medium text-foreground">{formatCOP(Math.max(0, value))}</span>
                  {pct > 0 && (
                    <span className="text-xs text-muted-foreground ml-1.5">
                      {Math.round((value / pct) * 100)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/30">
              <span className="text-sm font-bold text-foreground">Total invertido</span>
              <span className="text-sm font-bold text-primary">{formatCOP(datos.inversionTotal)}</span>
            </div>
          </div>
        </motion.div>

        {/* ── RESUMEN FINANCIERO ────────────────────────── */}
        <motion.div variants={ITEM_VARIANT} className="bg-card border border-border rounded-xl overflow-hidden">
          <p className="text-sm font-semibold text-foreground px-4 py-3 border-b border-border">
            Resumen del período
          </p>
          <div className="divide-y divide-border">
            {[
              { label: 'Ingresos (precio venta)',    value: formatCOP(datos.ventaTotal),         color: '' },
              { label: '− Inversión total',           value: `− ${formatCOP(datos.inversionTotal)}`, color: 'text-red-400' },
              { label: '= Ganancia neta',             value: formatCOP(datos.gananciaTotal),      color: 'text-green-400' },
              { label: 'Margen neto',                 value: formatPct(datos.margenNeto),         color: datos.margenNeto >= 0.4 ? 'text-green-400' : 'text-yellow-400' },
              { label: 'ROI (retorno sobre inversión)', value: `${Math.round(datos.roi * 100)}%`, color: datos.roi >= 0.4 ? 'text-green-400' : 'text-yellow-400' },
              { label: 'Ticket promedio',             value: formatCOP(datos.ticketPromedio),     color: '' },
              { label: 'Total cobrado',               value: formatCOP(datos.cobrado),            color: 'text-green-400' },
              { label: 'Cartera por cobrar',          value: formatCOP(datos.carteraPendiente),   color: datos.carteraPendiente > 0 ? 'text-yellow-400' : 'text-green-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center gap-2 px-4 py-2.5 text-sm">
                <span className="text-muted-foreground flex-1 min-w-0">{label}</span>
                <span className={`font-semibold text-foreground flex-shrink-0 ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── TOP MARCAS ────────────────────────────────── */}
        {datos.topMarcas.length > 0 && (
          <motion.div variants={ITEM_VARIANT} className="bg-card border border-border rounded-xl overflow-hidden">
            <p className="text-sm font-semibold text-foreground px-4 py-3 border-b border-border">
              Marcas más rentables
            </p>
            <div className="divide-y divide-border">
              {datos.topMarcas.map(({ nombre, ingresos, ganancia, unidades, margen }, i) => (
                <div key={nombre} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-foreground truncate">{nombre}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">× {unidades}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-green-400">{formatCOP(ganancia)}</p>
                      <p className="text-xs text-muted-foreground">{formatPct(margen)} margen</p>
                    </div>
                  </div>
                  {/* Barra de ganancia relativa */}
                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${datos.topMarcas[0].ganancia > 0 ? (ganancia / datos.topMarcas[0].ganancia) * 100 : 0}%`,
                        background: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── TOP TIPOS DE PRODUCTO ─────────────────────── */}
        {datos.topTipos.length > 0 && (
          <motion.div variants={ITEM_VARIANT} className="bg-card border border-border rounded-xl overflow-hidden">
            <p className="text-sm font-semibold text-foreground px-4 py-3 border-b border-border">
              Categorías más rentables
            </p>
            <div className="divide-y divide-border">
              {datos.topTipos.map(({ nombre, ingresos, ganancia, unidades, margen }, i) => (
                <div key={nombre} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-foreground truncate">{nombre}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">× {unidades}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-green-400">{formatCOP(ganancia)}</p>
                      <p className="text-xs text-muted-foreground">{formatPct(margen)} margen</p>
                    </div>
                  </div>
                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${datos.topTipos[0].ganancia > 0 ? (ganancia / datos.topTipos[0].ganancia) * 100 : 0}%`,
                        background: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
