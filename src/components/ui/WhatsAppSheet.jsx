/**
 * WhatsAppSheet — sheet deslizable con plantillas de mensajes para WhatsApp.
 *
 * Props:
 *   open       — boolean, controla visibilidad
 *   onClose    — función para cerrar
 *   telefono   — número del cliente (con o sin código de país)
 *   variables  — { nombre, codigo, total, saldo, estado } — las que apliquen
 *
 * Comportamiento:
 *   - Si no hay codigo/saldo, filtra las plantillas que no los necesiten
 *   - "Enviar" → abre WhatsApp con el mensaje pre-cargado
 *   - "Copiar" → copia al portapapeles + toast de confirmación
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Copy, Send, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { MENSAJES, CATEGORIAS, sustituirVars, buildWaLink } from '@/utils/mensajes'
import { spring, dur, ease, backdropVariants } from '@/lib/motion'

export default function WhatsAppSheet({ open, onClose, telefono, variables = {} }) {
  const [expandidos, setExpandidos] = useState({})

  function toggleExpand(id) {
    setExpandidos(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function handleEnviar(template) {
    const mensaje = sustituirVars(template, variables)
    const url = buildWaLink(telefono, mensaje)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleCopiar(template) {
    const mensaje = sustituirVars(template, variables)
    try {
      await navigator.clipboard.writeText(mensaje)
      toast.success('Mensaje copiado')
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  // Mostrar plantillas que tienen todas sus variables disponibles
  const tieneCodigo = Boolean(variables.codigo)
  const mensajesFiltrados = MENSAJES.filter(m => !m.requiereCodigo || tieneCodigo)

  // Agrupar por categoría manteniendo el orden definido en CATEGORIAS
  const porCategoria = Object.entries(CATEGORIAS).map(([key, info]) => ({
    key,
    ...info,
    items: mensajesFiltrados.filter(m => m.categoria === key),
  })).filter(cat => cat.items.length > 0)

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={spring.smooth}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl border-t border-border flex flex-col"
            style={{ maxHeight: '88vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-green-500/15 flex items-center justify-center">
                  <MessageCircle size={14} className="text-green-400" />
                </div>
                <p className="font-semibold text-foreground text-sm">Mensajes WhatsApp</p>
              </div>
              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.88 }}
                transition={spring.snap}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* Si hay nombre disponible, mostrarlo */}
            {variables.nombre && (
              <div className="px-5 py-2 border-b border-border flex-shrink-0">
                <p className="text-xs text-muted-foreground">
                  Para: <span className="text-foreground font-medium">{variables.nombre}</span>
                  {variables.codigo && (
                    <span className="ml-2 text-muted-foreground">· {variables.codigo}</span>
                  )}
                </p>
              </div>
            )}

            {/* Lista de plantillas — scrollable */}
            <div className="flex-1 overflow-y-auto">
              {porCategoria.map(({ key, label, emoji, items }) => (
                <div key={key} className="px-4 pt-4 pb-2">
                  {/* Cabecera de categoría */}
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span>{emoji}</span> {label}
                  </p>

                  <div className="space-y-2">
                    {items.map(msg => {
                      const textoFinal = sustituirVars(msg.template, variables)
                      const estaExpandido = expandidos[msg.id]
                      const preview = textoFinal.slice(0, 90) + (textoFinal.length > 90 ? '...' : '')

                      return (
                        <motion.div
                          key={msg.id}
                          layout
                          className="bg-secondary rounded-xl border border-border overflow-hidden"
                        >
                          {/* Cabecera de la tarjeta */}
                          <div className="flex items-center justify-between px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{msg.emoji}</span>
                              <p className="text-sm font-medium text-foreground">{msg.titulo}</p>
                            </div>
                            <motion.button
                              type="button"
                              onClick={() => toggleExpand(msg.id)}
                              whileTap={{ scale: 0.88 }}
                              transition={spring.snap}
                              className="text-muted-foreground hover:text-foreground p-1"
                            >
                              {estaExpandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </motion.button>
                          </div>

                          {/* Preview del mensaje */}
                          <div className="px-3 pb-2">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {estaExpandido ? textoFinal : preview}
                            </p>
                            {textoFinal.length > 90 && !estaExpandido && (
                              <button
                                type="button"
                                onClick={() => toggleExpand(msg.id)}
                                className="text-xs text-primary mt-0.5 hover:underline"
                              >
                                Ver completo
                              </button>
                            )}
                          </div>

                          {/* Botones de acción */}
                          <div className="flex gap-2 px-3 pb-3">
                            <motion.button
                              type="button"
                              onClick={() => handleCopiar(msg.template)}
                              whileTap={{ scale: 0.92 }}
                              transition={spring.snap}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Copy size={12} />
                              Copiar
                            </motion.button>
                            <motion.button
                              type="button"
                              onClick={() => handleEnviar(msg.template)}
                              whileTap={{ scale: 0.92 }}
                              transition={spring.snap}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/20 rounded-lg text-xs font-medium transition-colors"
                            >
                              <Send size={12} />
                              Enviar en WhatsApp
                            </motion.button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Padding inferior seguro */}
              <div className="h-6" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
