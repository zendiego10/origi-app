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
      'Hola {nombre}! 😊 Tu pedido *{codigo}* quedó registrado en Origi. Ya lo estamos tramitando. Te avisamos en cuanto tengamos novedades. Gracias por confiar en nosotros!',
  },
  {
    id: 'comprando_eeuu',
    categoria: 'estado',
    emoji: '🛍️',
    titulo: 'Comprando en EE.UU.',
    requiereCodigo: true,
    template:
      'Hola {nombre}! 🛍️ Ya compramos tu pedido *{codigo}* en Estados Unidos. En los próximos 10-15 días llega a Colombia. Te mantenemos informado/a de cada novedad.',
  },
  {
    id: 'llego_colombia',
    categoria: 'estado',
    emoji: '🇨🇴',
    titulo: 'Llegó a Colombia',
    requiereCodigo: true,
    template:
      'Buenas noticias {nombre}! 🇨🇴 Tu pedido *{codigo}* ya llegó a Colombia. En 1-2 días hábiles lo tendrás contigo. Estamos coordinando la entrega!',
  },
  {
    id: 'pedido_entregado',
    categoria: 'estado',
    emoji: '✅',
    titulo: 'Pedido entregado',
    requiereCodigo: true,
    template:
      'Hola {nombre}! ✅ Tu pedido *{codigo}* fue entregado exitosamente. Gracias por confiar en Origi. Esperamos que lo disfrutes muchísimo! 🎉 Estamos para servirte cuando quieras.',
  },
  {
    id: 'pedido_cancelado',
    categoria: 'estado',
    emoji: '❌',
    titulo: 'Pedido cancelado',
    requiereCodigo: true,
    template:
      'Hola {nombre}, te informamos que el pedido *{codigo}* fue cancelado. Si tienes preguntas o deseas hacer otro pedido, con mucho gusto te ayudamos. Disculpa cualquier inconveniente 🙏',
  },

  // ─── FIDELIZACIÓN ────────────────────────────────────────────
  {
    id: 'bienvenida',
    categoria: 'fidelizacion',
    emoji: '👋',
    titulo: 'Bienvenida cliente nuevo',
    requiereCodigo: false,
    template:
      'Hola {nombre}! 👋 Bienvenido/a a *Origi Importaciones*. Somos tu aliado para traerte lo mejor de EE.UU. a Colombia con garantía de originalidad. Que disfrutes mucho tu compra! 🎁',
  },
  {
    id: 'gracias_confianza',
    categoria: 'fidelizacion',
    emoji: '🙏',
    titulo: 'Gracias por tu confianza',
    requiereCodigo: false,
    template:
      'Hola {nombre}! 🙏 Gracias por elegirnos de nuevo. Tu confianza es lo que nos impulsa a seguir mejorando cada día. Estamos para servirte siempre con lo mejor.',
  },
  {
    id: 'satisfaccion',
    categoria: 'fidelizacion',
    emoji: '😊',
    titulo: 'Satisfacción post-entrega',
    requiereCodigo: false,
    template:
      'Hola {nombre}! Esperamos que tu pedido llegó en perfectas condiciones. ¿Todo bien con tu compra? Tu opinión nos importa mucho 😊 Cualquier comentario, aquí estamos.',
  },
  {
    id: 'recomendar',
    categoria: 'fidelizacion',
    emoji: '🌟',
    titulo: 'Invitación a recomendar',
    requiereCodigo: false,
    template:
      'Hola {nombre}! Si quedaste contento/a con tu pedido, cuéntale a tus amigos y familia sobre *Origi*. Traemos lo mejor de EE.UU. a Colombia con garantía de originalidad. 🌟 Tu recomendación nos ayuda muchísimo!',
  },

  // ─── SEGUIMIENTO Y NOVEDADES ─────────────────────────────────
  {
    id: 'actualizacion',
    categoria: 'seguimiento',
    emoji: '🔔',
    titulo: 'Actualización de pedido',
    requiereCodigo: true,
    template:
      'Hola {nombre}! 🔔 Te escribimos para darte una actualización sobre tu pedido *{codigo}*. Por el momento se encuentra en estado: *{estado}*. Cualquier novedad te avisamos de inmediato.',
  },
  {
    id: 'demora',
    categoria: 'seguimiento',
    emoji: '⏳',
    titulo: 'Demora inesperada',
    requiereCodigo: true,
    template:
      'Hola {nombre}, queremos informarte que tu pedido *{codigo}* presenta una pequeña demora. Estamos trabajando para resolverla lo antes posible. Disculpa los inconvenientes 🙏 Te avisamos en cuanto haya novedad.',
  },
  {
    id: 'nuevos_productos',
    categoria: 'seguimiento',
    emoji: '🎁',
    titulo: 'Nuevos productos disponibles',
    requiereCodigo: false,
    template:
      'Hola {nombre}! 🎁 Tenemos nuevos productos disponibles en *Origi*. Marcas originales directas de EE.UU. ¿Te interesa ver qué hay de nuevo? Con gusto te mostramos las novedades.',
  },
  {
    id: 'reactivar',
    categoria: 'seguimiento',
    emoji: '💬',
    titulo: '¿Qué te gustaría pedir?',
    requiereCodigo: false,
    template:
      'Hola {nombre}! 😊 Hace un tiempo no sabemos de ti. ¿Qué te gustaría pedir esta vez? Tenemos excelentes productos y precios. Escríbenos cuando quieras, con gusto te ayudamos.',
  },
  {
    id: 'pago_recibido',
    categoria: 'seguimiento',
    emoji: '💳',
    titulo: 'Pago recibido',
    requiereCodigo: true,
    template:
      'Hola {nombre}! ✅ Confirmamos que recibimos tu pago. Queda un saldo de *{saldo}* pendiente para el pedido *{codigo}*. Gracias por estar al día con nosotros! 🙌',
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
