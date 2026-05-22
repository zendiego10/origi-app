import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'
import toast from 'react-hot-toast'
import TopBar from '@/components/layout/TopBar'
import { calcularCosto, calcularGanancia, calcularResumenPedido } from '@/utils/calculadora'
import { formatCOP, formatPct, getColorMargen } from '@/utils/formatters'
import { ENVIO_COLOMBIA_DEFAULT, TAXES_USA } from '@/utils/constants'
import { useCalculadoraStore } from '@/store/calculadoraStore'
import { obtenerTRM } from '@/utils/trm'
import { Spinner } from '@/components/ui/Loader'

const productoSchema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  marca: z.string().min(1, 'Requerido'),
  tipo: z.string().min(1, 'Requerido'),
  precioUSD: z.coerce.number().positive('Debe ser > 0'),
  tieneEnvioUSA: z.boolean(),
  envioUSA: z.coerce.number().min(0),
  trm: z.coerce.number().positive(),
  envioColombia: z.coerce.number().min(0),
  elBagre: z.boolean(),
  precioVentaCOP: z.coerce.number().positive('Debe ser > 0'),
})

const schema = z.object({
  clienteNombre: z.string().min(1, 'Requerido'),
  clienteTelefono: z.string().min(6, 'Requerido'),
  anticipoPagado: z.coerce.number().min(0),
  productos: z.array(productoSchema).min(1),
})

export default function NuevoPedido() {
  const navigate = useNavigate()
  const { datosCalculadora, limpiarCalculadora } = useCalculadoraStore()
  const [buscandoCliente, setBuscandoCliente] = useState('')
  const [clientesSugeridos, setClientesSugeridos] = useState([])
  const [clienteId, setClienteId] = useState(null)
  const [expandido, setExpandido] = useState([0])
  const [marcas, setMarcas] = useState([])
  const [tipos, setTipos] = useState([])
  const [trm, setTrm] = useState(4200)
  const [guardando, setGuardando] = useState(false)

  const { register, control, watch, setValue, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      clienteNombre: '',
      clienteTelefono: '',
      anticipoPagado: 0,
      productos: [{
        nombre: '', marca: '', tipo: '',
        precioUSD: datosCalculadora?.precioUSD || '',
        tieneEnvioUSA: datosCalculadora ? (datosCalculadora.envioUSA > 0) : false,
        envioUSA: datosCalculadora?.envioUSA || 0,
        trm: datosCalculadora?.trm || 4200,
        envioColombia: datosCalculadora?.envioColombia || ENVIO_COLOMBIA_DEFAULT,
        elBagre: datosCalculadora?.elBagre || false,
        precioVentaCOP: '',
      }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'productos' })
  const valores = watch()

  // Cargar catálogos y TRM
  useEffect(() => {
    async function cargar() {
      try {
        const [marcasSnap, tiposSnap, trmResult] = await Promise.all([
          getDocs(collection(db, 'marcas')),
          getDocs(collection(db, 'tiposProducto')),
          obtenerTRM(),
        ])
        setMarcas(marcasSnap.docs.map(d => d.data().nombre))
        setTipos(tiposSnap.docs.map(d => d.data().nombre))
        setTrm(trmResult.valor)
        // Precargar TRM en el primer producto si no viene de la Calculadora
        if (!datosCalculadora) {
          setValue('productos.0.trm', trmResult.valor)
        }
      } catch (_) {}
    }
    cargar()
  }, [])

  // Precargar datos de la Calculadora en el formulario
  // Usamos useEffect + setValue en lugar de defaultValues para evitar
  // el problema de StrictMode que borra el store antes del segundo mount
  useEffect(() => {
    if (!datosCalculadora) return
    setValue('productos.0.precioUSD', datosCalculadora.precioUSD)
    setValue('productos.0.tieneEnvioUSA', datosCalculadora.envioUSA > 0)
    setValue('productos.0.envioUSA', datosCalculadora.envioUSA)
    setValue('productos.0.trm', datosCalculadora.trm)
    setValue('productos.0.envioColombia', datosCalculadora.envioColombia)
    setValue('productos.0.elBagre', datosCalculadora.elBagre)
    if (datosCalculadora.precioVentaCOP) {
      setValue('productos.0.precioVentaCOP', datosCalculadora.precioVentaCOP)
    }
  }, [datosCalculadora, setValue])

  // Buscar clientes
  useEffect(() => {
    if (buscandoCliente.length < 2) { setClientesSugeridos([]); return }
    const timer = setTimeout(async () => {
      try {
        const snap = await getDocs(collection(db, 'clientes'))
        const resultados = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(c => c.nombre?.toLowerCase().includes(buscandoCliente.toLowerCase()))
          .slice(0, 5)
        setClientesSugeridos(resultados)
      } catch (_) {}
    }, 300)
    return () => clearTimeout(timer)
  }, [buscandoCliente])

  function seleccionarCliente(cliente) {
    setClienteId(cliente.id)
    setValue('clienteNombre', cliente.nombre)
    setValue('clienteTelefono', cliente.telefono)
    setBuscandoCliente('')
    setClientesSugeridos([])
  }

  async function onSubmit(data) {
    setGuardando(true)
    try {
      const productosCalculados = data.productos.map(p => {
        const costo = calcularCosto({
          precioUSD: p.precioUSD,
          envioUSA: p.tieneEnvioUSA ? p.envioUSA : 0,
          trm: p.trm,
          envioColombia: p.envioColombia,
          elBagre: p.elBagre,
        })
        const { gananciaCOP, margen } = calcularGanancia(p.precioVentaCOP, costo.costoTotalCOP)
        return {
          ...p,
          taxes: p.precioUSD * TAXES_USA,
          costoTotalCOP: costo.costoTotalCOP,
          gananciaCOP,
          margenPct: margen,
        }
      })

      const resumen = calcularResumenPedido(productosCalculados)
      const saldoPendiente = resumen.ventaTotal - (data.anticipoPagado || 0)

      const snap = await getDocs(collection(db, 'pedidos'))
      const codigo = `ORG-${String(snap.size + 1).padStart(3, '0')}`

      let cId = clienteId
      if (!cId) {
        const nuevoCliente = await addDoc(collection(db, 'clientes'), {
          nombre: data.clienteNombre,
          telefono: data.clienteTelefono,
          etiqueta: 'nuevo',
          creadoEn: serverTimestamp(),
        })
        cId = nuevoCliente.id
      }

      const pedidoRef = await addDoc(collection(db, 'pedidos'), {
        codigo,
        clienteId: cId,
        clienteNombre: data.clienteNombre,
        clienteTelefono: data.clienteTelefono,
        estado: 'pendiente',
        historialEstados: [{ estado: 'pendiente', fecha: new Date().toISOString() }],
        anticipoPagado: data.anticipoPagado || 0,
        saldoPendiente,
        totalCOP: resumen.ventaTotal,
        gananciaTotal: resumen.gananciaTotal,
        elBagre: productosCalculados.some(p => p.elBagre),
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
      })

      for (const prod of productosCalculados) {
        await addDoc(collection(db, 'pedidos', pedidoRef.id, 'productos'), prod)
      }

      limpiarCalculadora()
      toast.success(`Pedido ${codigo} creado`)
      navigate(`/pedidos/${pedidoRef.id}`)
    } catch (err) {
      toast.error('Error al crear el pedido')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Nuevo Pedido" backTo="/pedidos" />

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4 pb-8">
        {/* Cliente */}
        <section className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Cliente</h2>

          <div className="relative">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={buscandoCliente}
                onChange={e => setBuscandoCliente(e.target.value)}
                placeholder="Buscar cliente existente..."
                className="w-full pl-9 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              />
            </div>
            {clientesSugeridos.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                {clientesSugeridos.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => seleccionarCliente(c)}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-secondary transition-colors"
                  >
                    <p className="font-medium text-foreground">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground">{c.telefono}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Field label="Nombre completo" error={errors.clienteNombre?.message}>
            <input {...register('clienteNombre')} placeholder="Nombre del cliente" className={inputClass} />
          </Field>
          <Field label="Teléfono / WhatsApp" error={errors.clienteTelefono?.message}>
            <input {...register('clienteTelefono')} placeholder="+57 300..." className={inputClass} />
          </Field>
          <Field label="Anticipo recibido (COP)">
            <input {...register('anticipoPagado')} type="number" min="0" placeholder="0" className={inputClass} />
          </Field>
        </section>

        {/* Productos */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Productos</h2>

          {fields.map((field, idx) => {
            const p = valores.productos?.[idx] || {}
            const costo = calcularCosto({
              precioUSD: Number(p.precioUSD) || 0,
              envioUSA: p.tieneEnvioUSA ? Number(p.envioUSA) || 0 : 0,
              trm: Number(p.trm) || trm,
              envioColombia: Number(p.envioColombia) || ENVIO_COLOMBIA_DEFAULT,
              elBagre: p.elBagre,
            })
            const { gananciaCOP, margen } = calcularGanancia(Number(p.precioVentaCOP) || 0, costo.costoTotalCOP)
            const estaExpandido = expandido.includes(idx)

            return (
              <div key={field.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandido(prev =>
                    prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
                  )}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">
                    {p.nombre || `Producto ${idx + 1}`}
                  </span>
                  <div className="flex items-center gap-3">
                    {costo.costoTotalCOP > 0 && (
                      <span className="text-xs text-primary font-medium">{formatCOP(costo.costoTotalCOP)}</span>
                    )}
                    {estaExpandido ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>
                </button>

                <AnimatePresence>
                  {estaExpandido && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                        <Field label="Nombre del producto" error={errors.productos?.[idx]?.nombre?.message}>
                          <input {...register(`productos.${idx}.nombre`)} placeholder="Ej: Sandalias Michael Kors" className={inputClass} />
                        </Field>

                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Marca">
                            <select {...register(`productos.${idx}.marca`)} className={inputClass}>
                              <option value="">Seleccionar</option>
                              {marcas.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </Field>
                          <Field label="Tipo">
                            <select {...register(`productos.${idx}.tipo`)} className={inputClass}>
                              <option value="">Seleccionar</option>
                              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Precio USD" error={errors.productos?.[idx]?.precioUSD?.message}>
                            <input {...register(`productos.${idx}.precioUSD`)} type="number" step="0.01" min="0" placeholder="0.00" className={inputClass} />
                          </Field>
                          <Field label="TRM">
                            <input {...register(`productos.${idx}.trm`)} type="number" min="0" className={inputClass} />
                          </Field>
                        </div>

                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm text-muted-foreground">¿Envío en EE.UU.?</span>
                          <input type="checkbox" {...register(`productos.${idx}.tieneEnvioUSA`)} className="w-4 h-4 accent-primary" />
                        </div>

                        {p.tieneEnvioUSA && (
                          <Field label="Costo envío EE.UU. (USD)">
                            <input {...register(`productos.${idx}.envioUSA`)} type="number" step="0.01" min="0" className={inputClass} />
                          </Field>
                        )}

                        <Field label="Envío a Colombia (COP)">
                          <input {...register(`productos.${idx}.envioColombia`)} type="number" min="0" className={inputClass} />
                        </Field>

                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm text-muted-foreground">¿Llega a El Bagre?</span>
                          <input type="checkbox" {...register(`productos.${idx}.elBagre`)} className="w-4 h-4 accent-primary" />
                        </div>

                        {/* Costo calculado */}
                        {costo.costoTotalCOP > 0 && (
                          <div className="bg-secondary rounded-lg px-3 py-2 flex justify-between text-sm">
                            <span className="text-muted-foreground">Costo total</span>
                            <span className="font-semibold text-foreground">{formatCOP(costo.costoTotalCOP)}</span>
                          </div>
                        )}

                        <Field label="Precio de venta (COP)" error={errors.productos?.[idx]?.precioVentaCOP?.message}>
                          <input {...register(`productos.${idx}.precioVentaCOP`)} type="number" min="0" placeholder="0" className={inputClass} />
                        </Field>

                        {/* Ganancia y margen */}
                        {Number(p.precioVentaCOP) > 0 && costo.costoTotalCOP > 0 && (
                          <div className="flex gap-3">
                            <div className="flex-1 bg-secondary rounded-lg px-3 py-2 text-center">
                              <p className="text-xs text-muted-foreground">Ganancia</p>
                              <p className={`text-sm font-bold mt-0.5 ${getColorMargen(margen)}`}>{formatCOP(gananciaCOP)}</p>
                            </div>
                            <div className="flex-1 bg-secondary rounded-lg px-3 py-2 text-center">
                              <p className="text-xs text-muted-foreground">Margen</p>
                              <p className={`text-sm font-bold mt-0.5 ${getColorMargen(margen)}`}>{formatPct(margen)}</p>
                            </div>
                          </div>
                        )}

                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(idx)}
                            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors pt-1"
                          >
                            <Trash2 size={13} />
                            Eliminar producto
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}

          {fields.length < 5 && (
            <button
              type="button"
              onClick={() => {
                const newIdx = fields.length
                append({
                  nombre: '', marca: '', tipo: '',
                  precioUSD: '', tieneEnvioUSA: false, envioUSA: 0,
                  trm, envioColombia: ENVIO_COLOMBIA_DEFAULT, elBagre: false,
                  precioVentaCOP: '',
                })
                setExpandido(prev => [...prev, newIdx])
              }}
              className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              <Plus size={15} />
              Agregar producto
            </button>
          )}
        </section>

        {/* Resumen */}
        {valores.productos?.some(p => Number(p.precioVentaCOP) > 0) && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-4 space-y-2"
          >
            <h2 className="text-sm font-semibold text-foreground mb-3">Resumen del pedido</h2>
            {(() => {
              const prods = (valores.productos || []).map(p => {
                const c = calcularCosto({
                  precioUSD: Number(p.precioUSD) || 0,
                  envioUSA: p.tieneEnvioUSA ? Number(p.envioUSA) || 0 : 0,
                  trm: Number(p.trm) || trm,
                  envioColombia: Number(p.envioColombia) || ENVIO_COLOMBIA_DEFAULT,
                  elBagre: p.elBagre,
                })
                const { gananciaCOP } = calcularGanancia(Number(p.precioVentaCOP) || 0, c.costoTotalCOP)
                return { costoTotalCOP: c.costoTotalCOP, precioVentaCOP: Number(p.precioVentaCOP) || 0, gananciaCOP }
              })
              const resumen = calcularResumenPedido(prods)
              const margenTotal = resumen.ventaTotal > 0 ? resumen.gananciaTotal / resumen.ventaTotal : 0
              return (
                <>
                  <Row label="Costo total" value={formatCOP(resumen.costoTotal)} />
                  <Row label="Precio de venta" value={formatCOP(resumen.ventaTotal)} />
                  <Row label="Ganancia esperada" value={<span className={getColorMargen(margenTotal)}>{formatCOP(resumen.gananciaTotal)}</span>} />
                  <Row label="Margen total" value={<span className={getColorMargen(margenTotal)}>{formatPct(margenTotal)}</span>} />
                </>
              )
            })()}
          </motion.section>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/pedidos')}
            className="flex-1 px-4 py-2.5 bg-secondary hover:bg-border text-foreground font-medium rounded-lg transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-[#C73652] disabled:opacity-60 text-white font-medium rounded-lg transition-colors text-sm"
          >
            {guardando ? <Spinner /> : null}
            {guardando ? 'Guardando...' : 'Hacer pedido'}
          </button>
        </div>
      </form>
    </div>
  )
}

const inputClass = 'w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm'

function Field({ label, error, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}
