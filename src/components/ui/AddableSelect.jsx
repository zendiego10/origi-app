/**
 * Select con botón + para agregar un item nuevo a Firebase y seleccionarlo
 * al instante, sin salir del formulario.
 *
 * Props:
 *   name       — nombre del campo en react-hook-form
 *   register   — register de react-hook-form
 *   setValue   — setValue de react-hook-form
 *   items      — array de strings (opciones actuales)
 *   onItemAdded(nombre) — callback cuando se agrega item nuevo
 *   placeholder
 */

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Check, X } from 'lucide-react'
import { spring } from '@/lib/motion'

export default function AddableSelect({
  name,
  register,
  setValue,
  items = [],
  onItemAdded,
  placeholder = 'Seleccionar',
}) {
  const [agregando, setAgregando] = useState(false)
  const [nuevoItem, setNuevoItem] = useState('')
  const [guardando, setGuardando] = useState(false)
  const inputRef = useRef(null)

  function abrirInput() {
    setAgregando(true)
    setNuevoItem('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function cancelar() {
    setAgregando(false)
    setNuevoItem('')
  }

  async function confirmar() {
    const nombre = nuevoItem.trim()
    if (!nombre) return
    setGuardando(true)
    try {
      await onItemAdded(nombre)
      setValue(name, nombre)   // selecciona automáticamente el nuevo item
      setAgregando(false)
      setNuevoItem('')
    } catch (_) {}
    finally { setGuardando(false) }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); confirmar() }
    if (e.key === 'Escape') cancelar()
  }

  const inputCls = 'w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm'

  return (
    <div className="space-y-2">
      {/* Select + botón + */}
      <div className="flex gap-2 items-center">
        <select
          {...register(name)}
          className={`flex-1 ${inputCls}`}
        >
          <option value="">{placeholder}</option>
          {items.map(item => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <motion.button
          type="button"
          onClick={abrirInput}
          whileTap={{ scale: 0.88 }}
          transition={spring.snap}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-secondary border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
          title="Agregar nuevo"
        >
          <Plus size={15} />
        </motion.button>
      </div>

      {/* Input inline para el nuevo item */}
      <AnimatePresence>
        {agregando && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="flex gap-2 overflow-hidden"
          >
            <input
              ref={inputRef}
              value={nuevoItem}
              onChange={e => setNuevoItem(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Nombre del nuevo item..."
              className={`flex-1 ${inputCls}`}
            />
            <motion.button
              type="button"
              onClick={confirmar}
              disabled={!nuevoItem.trim() || guardando}
              whileTap={{ scale: 0.88 }}
              transition={spring.snap}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white disabled:opacity-40 flex-shrink-0"
            >
              <Check size={14} />
            </motion.button>
            <motion.button
              type="button"
              onClick={cancelar}
              whileTap={{ scale: 0.88 }}
              transition={spring.snap}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary border border-border text-muted-foreground flex-shrink-0"
            >
              <X size={14} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
