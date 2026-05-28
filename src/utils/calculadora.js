import { TAXES_USA, ENVIO_COLOMBIA_DEFAULT, ENVIO_EL_BAGRE } from './constants'

/**
 * Calcula el costo total de traer un producto desde EE.UU. a Colombia.
 * Esta lógica es crítica para el negocio — no modificar sin pruebas.
 */
export function calcularCosto({
  precioUSD = 0,
  envioUSA = 0,
  trm = 4200,
  envioColombia = ENVIO_COLOMBIA_DEFAULT,
  elBagre = false,
  tieneTaxes = true,
}) {
  const taxes = tieneTaxes ? precioUSD * TAXES_USA : 0
  const subtotalUSD = precioUSD + taxes + Number(envioUSA)
  const subtotalCOP = subtotalUSD * trm
  const costoElBagre = elBagre ? ENVIO_EL_BAGRE : 0
  const costoTotalCOP = subtotalCOP + Number(envioColombia) + costoElBagre

  return {
    precioUSD: Number(precioUSD),
    taxes,
    tieneTaxes,
    envioUSA: Number(envioUSA),
    subtotalUSD,
    trm: Number(trm),
    subtotalCOP,
    envioColombia: Number(envioColombia),
    costoElBagre,
    costoTotalCOP,
    desglose: [
      { label: 'Precio producto', valorUSD: Number(precioUSD), valorCOP: null },
      ...(tieneTaxes ? [{ label: 'Taxes EE.UU. (7%)', valorUSD: taxes, valorCOP: null }] : []),
      { label: 'Envío en EE.UU.', valorUSD: Number(envioUSA), valorCOP: null },
      { label: 'Subtotal USD', valorUSD: subtotalUSD, valorCOP: null, esSubtotal: true },
      { label: 'TRM aplicada', valorUSD: null, valorCOP: null, esTRM: true, trm: Number(trm) },
      { label: 'Subtotal COP', valorUSD: null, valorCOP: subtotalCOP, esSubtotal: true },
      { label: 'Envío a Colombia', valorUSD: null, valorCOP: Number(envioColombia) },
      ...(elBagre ? [{ label: 'Envío El Bagre', valorUSD: null, valorCOP: ENVIO_EL_BAGRE }] : []),
    ],
  }
}

/**
 * Calcula ganancia y margen dado un precio de venta y costo total.
 */
export function calcularGanancia(precioVentaCOP, costoTotalCOP) {
  const gananciaCOP = precioVentaCOP - costoTotalCOP
  const margen = precioVentaCOP > 0 ? gananciaCOP / precioVentaCOP : 0
  return { gananciaCOP, margen }
}

/**
 * Genera el resumen financiero de todos los productos de un pedido.
 */
export function calcularResumenPedido(productos) {
  return productos.reduce(
    (acc, p) => ({
      costoTotal: acc.costoTotal + (p.costoTotalCOP || 0),
      ventaTotal: acc.ventaTotal + (p.precioVentaCOP || 0),
      gananciaTotal: acc.gananciaTotal + (p.gananciaCOP || 0),
    }),
    { costoTotal: 0, ventaTotal: 0, gananciaTotal: 0 }
  )
}
