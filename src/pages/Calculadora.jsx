import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, ChevronRight, RotateCcw, Pencil, Info } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import { calcularCosto } from '@/utils/calculadora'
import { formatCOP, formatUSD } from '@/utils/formatters'
import { ENVIO_COLOMBIA_DEFAULT, ENVIO_EL_BAGRE } from '@/utils/constants'
import { useCalculadoraStore } from '@/store/calculadoraStore'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'

export default function Calculadora() {
  const navigate = useNavigate()
  const { setDatosCalculadora } = useCalculadoraStore()
  const [envioEditando, setEnvioEditando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [trmConfig, setTrmConfig] = useState(4200)

  const { register, watch, setValue, reset, handleSubmit } = useForm({
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

  // Cargar TRM desde Firebase config
  useEffect(() => {
    getDoc(doc(db, 'config', 'trm_actual'))
      .then(snap => {
        if (snap.exists()) {
          const trm = Number(snap.data().valor)
          setTrmConfig(trm)
          setValue('trm', trm)
        }
      })
      .catch(() => {}) // Si falla, usa el default
  }, [setValue])

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
          <Label>TRM del día (COP por USD)</Label>
          <div className="relative mt-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input
              {...register('trm')}
              type="number"
              min="0"
              className="w-full pl-7 pr-3 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
            />
          </div>
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleLimpiar}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary hover:bg-border text-foreground font-medium rounded-lg transition-colors text-sm"
          >
            <RotateCcw size={15} />
            Limpiar
          </button>
          <button
            type="button"
            onClick={handleCrearPedido}
            disabled={!resultado}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-[#C73652] disabled:opacity-40 text-white font-medium rounded-lg transition-colors text-sm"
          >
            Crear pedido
            <ChevronRight size={15} />
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
