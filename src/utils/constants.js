export const ESTADOS_PEDIDO = {
  pendiente: { label: 'Pendiente', color: 'warning', next: 'en_proceso' },
  en_proceso: { label: 'En proceso', color: 'info', next: 'en_colombia' },
  en_colombia: { label: 'En Colombia', color: 'accent', next: 'entregado' },
  entregado: { label: 'Entregado', color: 'success', next: null },
  cancelado: { label: 'Cancelado', color: 'danger', next: null },
}

export const TIPOS_PRODUCTO_DEFAULT = [
  'Sandalias', 'Zapatos', 'Camiseta', 'Buzo', 'Pantalón',
  'Bolso', 'Perfume', 'Suplemento', 'Medias', 'Accesorio', 'Otro',
]

export const MARCAS_DEFAULT = [
  'Nike', 'Adidas', 'Puma', 'Michael Kors', 'Calvin Klein',
  'Guess', 'Tommy Hilfiger', 'Karl Lagerfeld', 'Coach',
  'Victoria\'s Secret', 'Nature Made', 'Tissot',
]

export const TAXES_USA = 0.07
export const ENVIO_COLOMBIA_DEFAULT = 20000
export const ENVIO_EL_BAGRE = 10000
export const DIAS_ALERTA_RETRASO = 20
export const DIAS_ALERTA_PAGO = 15
export const MARGEN_MINIMO = 0.40

export const ETIQUETAS_CLIENTE = {
  nuevo: { label: 'Nuevo', color: 'info' },
  recurrente: { label: 'Recurrente', color: 'success' },
  vip: { label: 'VIP', color: 'warning' },
  inactivo: { label: 'Inactivo', color: 'muted' },
}
