import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronRight, RotateCcw, Pencil, Info, RefreshCw } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import { calcularCosto, calcularGanancia } from '@/utils/calculadora'
import { formatCOP, formatUSD, formatPct, getColorMargen } from '@/utils/formatters'
import { ENVIO_COLOMBIA_DEFAULT, ENVIO_EL_BAGRE } from '@/utils/constants'
import { useCalculadoraStore } from '@/store/calculadoraStore'
import { obtenerTRM } from '@/utils/trm'

export default function Calculadora() {
  const navigate = useNavigate()
  const { setDatosCalculadora } = useCalculadoraStore()
  const [envioEditando, setEnvioEditando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [trmConfig, setTrmConfig] = useState(4200)
  const [trmFuente, setTrmFuente] = useState('')
  const [cargandoTRM, setCargandoTRM] = useState(false)
  const [precioVenta, setPrecioVenta] = useState('')

  const { register, watch, setValue, reset } = useForm({
    defaultValues: {
      precioUSD: '',
      tieneEnvioUSA: false,
      envioUSA: '',
      trm: 4200,
      envioColombia: ENVIO_COLOMBIA_DEFAULT,
      elBagre: false,
    },
  })

  const valores = watch()

  // Obtener TRM automáticamente al cargar
  useEffect(() => {
    cargarTRM()
  }, [])

  async function cargarTRM() {
    setCargandoTRM(true)
    try {
      const { valor, fuente } = await obtenerTRM()
      setTrmConfig(valor)
      setValue('trm', valor)
      setTrmFuente(fuente)
    } finally {
      setCargandoTRM(false)
    }
  }

  // Calcular en tiempo real
  useEffect(() => {
    const precio = Number(valores.precioUSD)
    if (precio > 0) {
      const res = calcularCosto({
        precioUSD: precio,
        envioUSA: valores.tieneEnvioUSA ? Number(valores.envioUSA) || 0 : 0,
        trm: Number(valores.trm) || trmConfig,
        envioColombia: Number(valores.envioColombia) || ENVIO_COLOMBIA_DEFAULT,
        elBagre: valores.elBagre,
      })
      setResultado(res)
    } else {
      setResultado(null)
    }
  }, [valores, trmConfig])

  function handleLimpiar() {
    reset({ precioUSD: '', tieneEnvioUSA: false, envioUSA: '', trm: trmConfig, envioColombia: ENVIO_COLOMBIA_DEFAULT, elBagre: false })
    setResultado(null)
    setEnvioEditando(false)
    setPrecioVenta('')
  }

  function handleCrearPedido() {
    if (!resultado) return
    setDatosCalculadora({
      precioUSD: Number(valores.precioUSD),
      envioUSA: valores.tieneEnvioUSA ? Number(valores.envioUSA) || 0 : 0,
      trm: Number(valores.trm),
      envioColombia: Number(valores.envioColombia),
      elBagre: valores.elBagre,
      costoTotalCOP: resultado.costoTotalCOP,
      precioVentaCOP: Number(precioVenta) || 0,
    })
    navigate('/pedidos/nuevo')
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Calculadora de Costo" />

      <div className="flex-1 p-4 max-w-lg mx-auto w-full space-y-4 pb-6">
        {/* Campo: Precio USD */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <Label>Precio del producto en EE.UU. (USD)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input
              {...register('precioUSD')}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full pl-7 pr-3 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
            />
          </div>

          {/* Taxes automáticos */}
          <AnimatePresence>
            {Number(valores.precioUSD) > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between text-xs py-1"
              >
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Info size={12} />
                  Taxes EE.UU. (7%)
                </span>
                <span className="text-yellow-400 font-medium">
                  {formatUSD(Number(valores.precioUSD) * 0.07)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Envío en EE.UU. */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label>¿Hubo envío en EE.UU.?</Label>
            <Toggle
              value={valores.tieneEnvioUSA}
              onChange={v => setValue('tieneEnvioUSA', v)}
            />
          </div>

          <AnimatePresence>
            {valores.tieneEnvioUSA && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    {...register('envioUSA')}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* TRM */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Label>TRM del día (COP por USD)</Label>
            <div className="flex items-center gap-2">
              {trmFuente === 'api' && (
                <span className="text-xs text-green-400 font-medium">● Actualizada</span>
              )}
              {trmFuente === 'cache' && (
                <span className="text-xs text-yellow-400 font-medium">● En caché</span>
              )}
              <button
                type="button"
                onClick={cargarTRM}
                disabled={cargandoTRM}
                className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
                title="Actualizar TRM"
              >
                <RefreshCw size={13} className={cargandoTRM ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input
              {...register('trm')}
              type="number"
              min="0"
              className="w-full pl-7 pr-3 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Editable manualmente si necesitas ajustar</p>
        </div>

        {/* Envío a Colombia */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <Label>Envío a Colombia (COP)</Label>
            <button
              type="button"
              onClick={() => setEnvioEditando(v => !v)}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Pencil size={14} />
            </button>
          </div>
          {envioEditando ? (
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                {...register('envioColombia')}
                type="number"
                min="0"
                className="w-full pl-7 pr-3 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
              />
            </div>
          ) : (
            <p className="text-sm font-medium text-foreground mt-1">
              {formatCOP(Number(valores.envioColombia))}
            </p>
          )}
        </div>

        {/* El Bagre */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>¿El pedido llega hasta El Bagre?</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Suma {formatCOP(ENVIO_EL_BAGRE)} adicionales
              </p>
            </div>
            <Toggle
              value={valores.elBagre}
              onChange={v => setValue('elBagre', v)}
            />
          </div>
        </div>

        {/* Resultado */}
        <AnimatePresence>
          {resultado && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-card border border-border rounded-xl p-4 space-y-2"
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Desglose de costos
              </p>

              {resultado.desglose.map((item, i) => {
                if (item.esTRM) {
                  return (
                    <div key={i} className="flex justify-between text-xs text-muted-foreground py-0.5">
                      <span>TRM aplicada</span>
                      <span>${item.trm?.toLocaleString('es-CO')}</span>
                    </div>
                  )
                }
                const valorMostrado = item.valorUSD !== null
                  ? formatUSD(item.valorUSD)
                  : item.valorCOP !== null
                  ? formatCOP(item.valorCOP)
                  : '—'

                return (
                  <div
                    key={i}
                    className={`flex justify-between text-xs py-0.5 ${
                      item.esSubtotal
                        ? 'text-foreground font-semibold border-t border-border pt-1.5 mt-1'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span>{valorMostrado}</span>
                  </div>
                )
              })}

              <div className="border-t border-border pt-3 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-foreground">COSTO TOTAL</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCOP(resultado.costoTotalCOP)}
                  </span>
                </div>
              </div>

              {/* Precio de venta + ganancia + margen */}
              <div className="border-t border-border pt-3 mt-2 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Precio de venta
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    value={precioVenta}
                    onChange={e => setPrecioVenta(e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                  />
                </div>
                {(() => {
                  const venta = Number(precioVenta)
                  if (!venta || venta <= 0) return null
                  const { gananciaCOP, margen } = calcularGanancia(venta, resultado.costoTotalCOP)
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-secondary rounded-lg px-3 py-2.5 text-center">
                        <p className="text-xs text-muted-foreground">Ganancia</p>
                        <p className={`text-base font-bold mt-0.5 ${getColorMargen(margen)}`}>
                          {formatCOP(gananciaCOP)}
                        </p>
                      </div>
                      <div className="bg-secondary rounded-lg px-3 py-2.5 text-center">
                        <p className="text-xs text-muted-foreground">Margen</p>
                        <p className={`text-base font-bold mt-0.5 ${getColorMargen(margen)}`}>
                          {formatPct(margen)}
                        </p>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botones — Crear pedido primero (más importante), Limpiar secundario */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={handleCrearPedido}
            disabled={!resultado}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-primary hover:bg-[#C73652] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            Crear pedido con estos datos
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={handleLimpiar}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary hover:bg-border text-muted-foreground hover:text-foreground font-medium rounded-xl transition-colors text-sm"
          >
            <RotateCcw size={14} />
            Limpiar campos
          </button>
        </div>
      </div>
    </div>
  )
}

function Label({ children }) {
  return <p className="text-sm font-medium text-foreground">{children}</p>
}

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        value ? 'bg-primary' : 'bg-border'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          value ? 'translate-x-4.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
