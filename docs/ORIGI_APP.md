# Origi App — Documentación de la Aplicación

## Qué es Origi Importaciones

Origi Importaciones es una empresa colombiana que importa productos 100% originales de Estados Unidos (Nike, Adidas, Michael Kors, Calvin Klein, etc.) y los vende en Colombia, principalmente a través de WhatsApp. El negocio opera en la región de El Bagre y ciudades aledañas.

Esta aplicación es una herramienta **interna** para el equipo de Origi — no es una tienda pública. Permite gestionar pedidos, clientes, pagos, finanzas y comunicación con clientes desde un panel centralizado y mobile-first.

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework UI | React | 19 |
| Build tool | Vite | 8 |
| Estilos | Tailwind CSS v4 | 4.x (plugin `@tailwindcss/vite`) |
| Animaciones | Motion.dev (`motion/react`) | 12 |
| Backend / DB | Firebase Firestore | 12 |
| Auth | Firebase Auth | 12 |
| Storage | Firebase Storage | 12 |
| Routing | React Router DOM | 7 |
| Formularios | React Hook Form + Zod | 7 + 4 |
| State global | Zustand | 5 |
| Gráficos | Recharts | 3 |
| Fechas | date-fns | 4 |
| Iconos | lucide-react | 1 |
| Toasts | react-hot-toast | 2 |
| Tipografía | Geist Variable (`@fontsource-variable/geist`) | — |
| Deploy | Vercel | — |

**Repositorio:** https://github.com/zendiego10/origi-app

---

## Arquitectura general

```
src/
├── pages/              # Cada pantalla de la app
├── components/
│   ├── layout/         # AppLayout, TopBar, BottomNav, Sidebar
│   ├── ui/             # Componentes reutilizables
│   └── shared/         # ProtectedRoute
├── hooks/              # useAuth
├── lib/
│   ├── motion.js       # Sistema de animaciones centralizado
│   └── utils.js        # Helpers (cn)
├── services/
│   └── firebase.js     # Inicialización de Firebase
├── store/
│   └── calculadoraStore.js  # Estado global de la calculadora (Zustand)
└── utils/
    ├── calculadora.js  # Lógica de cálculo de precios
    ├── constants.js    # Constantes del negocio
    ├── formatters.js   # formatCOP, formatDate, diasDesde
    ├── mensajes.js     # 14 plantillas de WhatsApp
    ├── trm.js          # Obtención automática de TRM
    └── animations.js   # Variantes de animación adicionales
```

### Alias configurado

`@/` apunta a `src/` (definido en `vite.config.js`).

---

## Pantallas y funcionalidades

### `/` — Dashboard

Vista ejecutiva con métricas en tiempo real calculadas desde Firestore.

**Métricas financieras (mes actual):**
- Ventas totales
- Ganancia total
- Margen promedio (%)
- Saldo por cobrar (cartera)

**Métricas operativas:**
- Pedidos activos (pendiente + en_proceso)
- Pedidos en Colombia (listos para entregar)
- Pedidos retrasados (más de 20 días sin actualizar)
- Pedidos entregados en el mes

**Secciones adicionales:**
- Gráfico de barras: ventas y ganancia por mes (últimos 6 meses) — Recharts
- Top 3 clientes por volumen de compra (pedidos entregados)
- Últimos 5 pedidos con acceso rápido

---

### `/calculadora` — Calculadora de precios

Herramienta para calcular el precio de venta correcto antes de cotizar a un cliente.

**Entradas:**
- Precio en USD del producto
- Envío dentro de EE.UU. (USD)
- TRM (se carga automáticamente, editable)
- Envío a Colombia (COP) — default $20.000
- Check "¿El Bagre?" — agrega $10.000 adicionales
- Precio de venta al cliente (COP)

**Cálculo interno:**
```
taxes = precioUSD × 0.07
subtotalUSD = precioUSD + taxes + envioUSA
subtotalCOP = subtotalUSD × TRM
costoTotal = subtotalCOP + envioColombia [+ envioElBagre]
ganancia = precioVenta - costoTotal
margen = ganancia / precioVenta
```

**Salidas:**
- Desglose completo paso a paso (USD y COP)
- Ganancia en COP
- Margen % (alerta visual si < 40% — mínimo del negocio)
- Botón "Crear pedido" — transfiere todos los datos al formulario de NuevoPedido

**Estado:** Persiste en Zustand (`calculadoraStore.js`) para transferencia de datos entre páginas.

---

### `/pedidos` — Lista de pedidos

Lista completa de todos los pedidos con búsqueda y filtros.

**Funcionalidades:**
- Buscador por nombre de cliente o código de pedido
- Filtro por estado (todos / pendiente / en_proceso / en_colombia / entregado / cancelado)
- Tarjetas con: nombre cliente, código, estado, monto total, fecha
- Acceso directo al detalle de cada pedido
- Botón "Nuevo pedido" en el TopBar

---

### `/pedidos/nuevo` — Nuevo pedido

Formulario para registrar un nuevo pedido.

**Campos:**
- Cliente: búsqueda/selección de cliente existente o creación de uno nuevo
- Productos: lista dinámica con campos por ítem:
  - Marca (selector con campo personalizable — botón `+`)
  - Tipo de producto (selector con campo personalizable — botón `+`)
  - Precio USD, Envío USA, TRM, Envío Colombia, El Bagre
  - Precio de venta COP
  - Ganancia y margen calculados automáticamente
- Anticipo recibido (COP) — genera saldo pendiente automáticamente
- Código del pedido (auto-generado: `ORG-XXX`)

**Precarga desde Calculadora:**
Si viene de `/calculadora`, los campos se pre-llenan con los valores calculados.

---

### `/pedidos/:id` — Detalle del pedido

Vista completa de un pedido individual.

**Información mostrada:**
- Código, cliente, fecha de creación
- Estado actual con badge de color
- Lista de productos con desglose de costos
- Totales: costo, venta, ganancia, margen
- Historial de pagos (monto, fecha, nota)
- Saldo pendiente

**Acciones disponibles:**
- Avanzar estado (pendiente → en_proceso → en_colombia → entregado)
- Registrar pago — bottom sheet con monto y nota opcional
- Cancelar pedido
- Eliminar pedido (solo pedidos cancelados/entregados)
- Botón WhatsApp directo al cliente
- Botón "Mensajes" → abre WhatsAppSheet con contexto completo del pedido

---

### `/clientes` — Lista de clientes

Lista de todos los clientes registrados.

**Funcionalidades:**
- Buscador por nombre o teléfono
- Resumen en 3 tarjetas: Total / Recurrentes / Nuevos
- Por cliente: nombre, etiqueta, teléfono, total de pedidos, total comprado, saldo pendiente
- Botón WhatsApp rápido (`wa.me`)
- Botón de acceso al perfil completo
- Botón "Nuevo" en TopBar — abre bottom sheet para crear cliente sin pedido

**Creación de cliente desde esta pantalla:**
- Bottom sheet animado con formulario: nombre, teléfono/WhatsApp, etiqueta
- Escribe en Firestore (`clientes` collection) con `serverTimestamp`
- Actualización optimista del estado local (sin re-fetch)

---

### `/clientes/:id` — Perfil del cliente

Vista completa del historial de un cliente.

**Información:**
- Nombre, teléfono, etiqueta (editable)
- Métricas: total pedidos, total comprado, saldo pendiente
- Lista de pedidos del cliente con acceso directo
- Saldo por pedido

**Acciones:**
- Cambiar etiqueta (nuevo / recurrente / VIP / inactivo)
- Botón "Mensajes" → abre WhatsAppSheet con contexto del cliente
- Botón WhatsApp directo
- Eliminar cliente

---

### `/pagos` — Registro de pagos

Lista de todos los pagos registrados en la aplicación.

**Información por pago:**
- Cliente, código de pedido, monto, fecha, nota

---

### `/finanzas` — Finanzas

Vista financiera consolidada con gráficos y métricas de rentabilidad.

---

### `/inventario` — Inventario

Gestión de productos en inventario.

---

### `/login` — Login

Autenticación con Firebase Auth (email + contraseña). Ruta pública — todas las demás están protegidas por `ProtectedRoute`.

---

## Flujo del estado de un pedido

```
pendiente → en_proceso → en_colombia → entregado
                                    ↘ cancelado (desde cualquier estado)
```

| Estado | Color | Significado |
|--------|-------|-------------|
| `pendiente` | Amarillo | Pedido registrado, aún no comprado en EE.UU. |
| `en_proceso` | Azul | Comprado en EE.UU., en tránsito |
| `en_colombia` | Violeta/Acento | Llegó a Colombia, coordinando entrega |
| `entregado` | Verde | Entregado al cliente |
| `cancelado` | Rojo | Cancelado |

---

## Sistema de mensajes WhatsApp

**Archivo:** `src/utils/mensajes.js`
**Componente:** `src/components/ui/WhatsAppSheet.jsx`

14 plantillas de mensajes pre-escritos con variables dinámicas. Se envían abriendo `wa.me/{telefono}?text={mensaje}` — WhatsApp se abre con el mensaje ya escrito, el operador solo presiona Enviar.

### Variables disponibles

| Variable | Valor |
|----------|-------|
| `{nombre}` | Nombre del cliente |
| `{codigo}` | Código del pedido (ej. `ORG-003`) |
| `{total}` | Total del pedido en COP formateado |
| `{saldo}` | Saldo pendiente en COP formateado |
| `{estado}` | Estado actual del pedido en español |

### Plantillas por categoría

**📦 Estado del pedido**
1. Pedido confirmado — al crear el pedido
2. Comprando en EE.UU. — al pasar a "en proceso"
3. Llegó a Colombia — al pasar a "en Colombia"
4. Pedido entregado — al marcar como entregado
5. Pedido cancelado — si se cancela

**🤝 Fidelización**
6. Bienvenida cliente nuevo — primer pedido (incluye solicitud de guardar número)
7. Gracias por tu confianza — clientes recurrentes
8. Satisfacción post-entrega — 1-2 días después de entregar
9. Invitación a recomendar — clientes satisfechos

**📣 Seguimiento y novedades**
10. Actualización de pedido — sin novedad en varios días
11. Demora inesperada — si hay retraso
12. Nuevos productos disponibles — marketing
13. ¿Qué te gustaría pedir? — reactivar cliente inactivo
14. Confirmación de pago recibido — al registrar un pago

---

## TRM automática

**Archivo:** `src/utils/trm.js`

La TRM (Tasa Representativa del Mercado — valor del dólar en COP) se obtiene automáticamente con un sistema de 3 capas:

1. **Cache localStorage** — válido por 4 horas (`origi_trm_cache`)
2. **API externa** — `open.er-api.com/v6/latest/USD` (gratuita, sin API key, CORS habilitado). Sanity check: solo acepta valores entre 3.000 y 8.000 COP.
3. **Firebase Firestore** — colección `config`, documento `trm_actual`. Se actualiza automáticamente cuando la API responde bien.
4. **Fallback hardcoded** — 4.200 COP si todo falla.

---

## Constantes del negocio

**Archivo:** `src/utils/constants.js`

| Constante | Valor | Descripción |
|-----------|-------|-------------|
| `TAXES_USA` | 0.07 (7%) | Impuestos sobre compras en EE.UU. |
| `ENVIO_COLOMBIA_DEFAULT` | $20.000 COP | Envío estándar a Colombia |
| `ENVIO_EL_BAGRE` | $10.000 COP | Costo adicional para El Bagre |
| `MARGEN_MINIMO` | 0.40 (40%) | Margen mínimo aceptable |
| `DIAS_ALERTA_RETRASO` | 20 días | Días sin actualizar para marcar como retrasado |
| `DIAS_ALERTA_PAGO` | 15 días | Días sin pago para mostrar alerta |

**Marcas predeterminadas:** Nike, Adidas, Puma, Michael Kors, Calvin Klein, Guess, Tommy Hilfiger, Karl Lagerfeld, Coach, Victoria's Secret, Nature Made, Tissot.

**Tipos de producto predeterminados:** Sandalias, Zapatos, Camiseta, Buzo, Pantalón, Bolso, Perfume, Suplemento, Medias, Accesorio, Otro.

**Etiquetas de cliente:** `nuevo` / `recurrente` / `vip` / `inactivo`

---

## Sistema de animaciones

**Archivo:** `src/lib/motion.js`

Sistema de animaciones centralizado estilo Linear/Vercel, construido sobre Motion.dev.

### Springs (física de muelle)

| Spring | Uso |
|--------|-----|
| `spring.snap` | Botones, iconos — respuesta instantánea |
| `spring.snappy` | Tarjetas, elementos interactivos |
| `spring.smooth` | Modales, drawers, bottom sheets |
| `spring.layout` | Reorganización de listas (layout animations) |
| `spring.gentle` | Hover states |

### Variantes reutilizables

| Variante | Uso |
|----------|-----|
| `pageVariants` | Transición entre páginas |
| `listVariants` + `itemVariants` | Listas de tarjetas con stagger |
| `fadeVariants` | Fade in/out simple |
| `slideUp` | Elementos que entran desde abajo |
| `backdropVariants` | Fondo oscuro de modales |
| `tap.*` / `hover.*` | Microinteracciones (`whileTap`, `whileHover`) |

---

## Base de datos Firestore

### Colecciones

**`clientes`**
```
{
  nombre: string,
  telefono: string,
  etiqueta: 'nuevo' | 'recurrente' | 'vip' | 'inactivo',
  creadoEn: Timestamp
}
```

**`pedidos`**
```
{
  codigo: string,           // ORG-001, ORG-002...
  clienteId: string,
  clienteNombre: string,
  clienteTelefono: string,
  estado: 'pendiente' | 'en_proceso' | 'en_colombia' | 'entregado' | 'cancelado',
  productos: Product[],
  totalCOP: number,
  costoTotal: number,
  gananciaTotal: number,
  anticipo: number,
  saldoPendiente: number,
  creadoEn: Timestamp,
  actualizadoEn: Timestamp
}
```

**`pagos`**
```
{
  pedidoId: string,
  clienteId: string,
  clienteNombre: string,
  monto: number,
  nota: string,
  fecha: Timestamp
}
```

**`config`**
```
// Documento: trm_actual
{
  clave: 'trm_actual',
  valor: string   // TRM como string numérico
}
```

### Reglas de seguridad

Solo usuarios autenticados con Firebase Auth pueden leer y escribir. Actualmente no hay restricciones por rol (cualquier usuario autenticado tiene acceso total).

```
allow read, write: if request.auth != null;
```

---

## Variables de entorno

El archivo `.env` debe estar en la raíz del proyecto (no se sube al repo):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

---

## Configuración de Vercel

**Archivo:** `vercel.json`

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

Necesario para que la SPA no dé 404 al refrescar en rutas como `/pedidos/abc123`.

---

## Comandos de desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Previsualizar build
npm run preview

# Lint
npm run lint
```

---

## Convenciones del proyecto

- **Idioma del código:** español para variables, funciones, estados y texto UI; inglés para props y estructura de componentes
- **Archivos:** PascalCase para componentes (`DetallePedido.jsx`), camelCase para utils (`calculadora.js`)
- **Rutas:** kebab-case en URL (`/nuevo-pedido`), snake_case en IDs de estado (`en_proceso`)
- **Alias:** usar siempre `@/` en lugar de rutas relativas (`../../../`)
- **Animaciones:** siempre usar `src/lib/motion.js` — no definir springs o easings ad-hoc
- **Formateo de moneda:** siempre usar `formatCOP()` de `src/utils/formatters.js`
