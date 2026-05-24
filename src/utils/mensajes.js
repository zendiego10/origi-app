/**
 * Plantillas de mensajes WhatsApp para Origi Importaciones.
 * Variables disponibles: {nombre}, {codigo}, {total}, {saldo}, {estado}
 *
 * La función sustituirVars reemplaza las variables por los valores reales
 * antes de enviar o copiar el mensaje.
 */

export const CATEGORIAS = {
  estado:       { label: 'Estado del pedido',    emoji: '📦' },
  fidelizacion: { label: 'Fidelización',          emoji: '🤝' },
  seguimiento:  { label: 'Seguimiento y novedades', emoji: '📣' },
}

export const MENSAJES = [
  // ─── ESTADO DEL PEDIDO ──────────────────────────────────────
  {
    id: 'pedido_confirmado',
    categoria: 'estado',
    emoji: '📦',
    titulo: 'Pedido confirmado',
    requiereCodigo: true,
    template:
      '{nombre}! ✅ *Tu pedido {codigo} está confirmado.*\nYa lo estamos tramitando con cuidado.\n¡Gracias por confiar en Origi! 🙌',
  },
  {
    id: 'comprando_eeuu',
    categoria: 'estado',
    emoji: '🛍️',
    titulo: 'Comprando en EE.UU.',
    requiereCodigo: true,
    template:
      '{nombre}! 🛍️ *¡Ya compramos tu pedido en EE.UU.!*\nEn 10-15 días llega a Colombia.\nTe avisamos apenas aterrice 📦',
  },
  {
    id: 'llego_colombia',
    categoria: 'estado',
    emoji: '🇨🇴',
    titulo: 'Llegó a Colombia',
    requiereCodigo: true,
    template:
      '{nombre}! 🇨🇴 *¡Tu pedido {codigo} ya llegó a Colombia!*\nEn 1-2 días hábiles lo tienes en tus manos.\n¡Ya casi! 🎉',
  },
  {
    id: 'pedido_entregado',
    categoria: 'estado',
    emoji: '✅',
    titulo: 'Pedido entregado',
    requiereCodigo: true,
    template:
      '{nombre}! 🎉 *¡Tu pedido {codigo} fue entregado!*\nEsperamos que lo disfrutes muchísimo.\n¿Quedaste contento/a? Cuéntanos 😊',
  },
  {
    id: 'pedido_cancelado',
    categoria: 'estado',
    emoji: '❌',
    titulo: 'Pedido cancelado',
    requiereCodigo: true,
    template:
      '{nombre}, el pedido *{codigo}* fue cancelado.\nLo sentimos. Si quieres, podemos ayudarte a encontrar otra opción 😊\nAquí estamos para lo que necesites.',
  },

  // ─── FIDELIZACIÓN ────────────────────────────────────────────
  {
    id: 'bienvenida',
    categoria: 'fidelizacion',
    emoji: '👋',
    titulo: 'Bienvenida cliente nuevo',
    requiereCodigo: false,
    template:
      '{nombre}! 👋 *¡Bienvenido/a a Origi Importaciones!*\nTraemos productos 100% originales de EE.UU. directo a ti 🇺🇸\n\n⚠️ *Guarda este número* — por aquí te enviamos catálogos, novedades y ofertas exclusivas antes que nadie.\n¡No te pierdas nada! 🙌',
  },
  {
    id: 'gracias_confianza',
    categoria: 'fidelizacion',
    emoji: '🙏',
    titulo: 'Gracias por tu confianza',
    requiereCodigo: false,
    template:
      '{nombre}! 🌟 *Gracias por volver a elegirnos.*\nClientes como tú son los que hacen todo esto posible.\nEstamos para servirte siempre con lo mejor 🙏',
  },
  {
    id: 'satisfaccion',
    categoria: 'fidelizacion',
    emoji: '😊',
    titulo: 'Satisfacción post-entrega',
    requiereCodigo: false,
    template:
      '{nombre}! ¿Llegó bien tu pedido? 😊\n*Tu opinión nos importa* — cuéntanos cómo te fue.\nCualquier detalle, aquí estamos para resolverlo.',
  },
  {
    id: 'recomendar',
    categoria: 'fidelizacion',
    emoji: '🌟',
    titulo: 'Invitación a recomendar',
    requiereCodigo: false,
    template:
      '{nombre}! Si quedaste feliz con tu compra 🌟\n*Recomiéndanos con alguien de confianza.*\nProductos originales de EE.UU., directo a Colombia — garantizados.',
  },

  // ─── SEGUIMIENTO Y NOVEDADES ─────────────────────────────────
  {
    id: 'actualizacion',
    categoria: 'seguimiento',
    emoji: '🔔',
    titulo: 'Actualización de pedido',
    requiereCodigo: true,
    template:
      '{nombre}! 🔔 Actualización de tu pedido *{codigo}*:\nEstado actual: *{estado}*\nCualquier novedad, te avisamos de inmediato.',
  },
  {
    id: 'demora',
    categoria: 'seguimiento',
    emoji: '⏳',
    titulo: 'Demora inesperada',
    requiereCodigo: true,
    template:
      '{nombre}, queremos ser honestos contigo 🙏\nTu pedido *{codigo}* tiene una pequeña demora.\n*Estamos encima de esto* — te avisamos en cuanto se resuelva.',
  },
  {
    id: 'nuevos_productos',
    categoria: 'seguimiento',
    emoji: '🎁',
    titulo: 'Nuevos productos disponibles',
    requiereCodigo: false,
    template:
      '{nombre}! 🎁 *¡Llegaron cosas nuevas a Origi!*\nMarcas originales directo de EE.UU. — antes de que se agoten.\n¿Quieres ver qué hay? Escríbenos 👇',
  },
  {
    id: 'reactivar',
    categoria: 'seguimiento',
    emoji: '💬',
    titulo: '¿Qué te gustaría pedir?',
    requiereCodigo: false,
    template:
      '{nombre}! 😊 Hace un tiempo no sabemos de ti.\n*¿Qué te gustaría pedir?*\nTenemos novedades que te pueden interesar — cuéntanos 🛍️',
  },
  {
    id: 'pago_recibido',
    categoria: 'seguimiento',
    emoji: '💳',
    titulo: 'Pago recibido',
    requiereCodigo: true,
    template:
      '{nombre}! ✅ *Pago recibido, gracias.*\nQueda un saldo de *{saldo}* para el pedido *{codigo}*.\nEstamos al día. Cualquier duda, aquí estamos 🙌',
  },
]

/**
 * Sustituye las variables de una plantilla con los valores reales.
 * @param {string} template
 * @param {Record<string, string>} vars - { nombre, codigo, total, saldo, estado }
 * @returns {string}
 */
export function sustituirVars(template, vars = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '')
}

/**
 * Construye el link wa.me con el mensaje pre-cargado.
 * @param {string} telefono - número con o sin código de país
 * @param {string} mensaje
 * @returns {string}
 */
export function buildWaLink(telefono, mensaje) {
  const numero = (telefono || '').replace(/\D/g, '')
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
}
