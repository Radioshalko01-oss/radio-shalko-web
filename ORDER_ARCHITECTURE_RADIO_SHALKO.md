# ORDER-1 — Arquitectura de Pedidos y Checkout · Radio Shalko

**Fase:** ORDER-1 (análisis y diseño únicamente)  
**Fecha:** Junio 2026  
**Estado:** Documento de arquitectura — sin implementación  
**Alcance:** Pedidos, checkout, envíos, clientes, pagos (diseño para fases ORDER-2 en adelante)

---

## Resumen ejecutivo

Radio Shalko opera hoy como **catálogo digital + carrito + asesoría por WhatsApp**. La infraestructura de catálogo, inventario por sucursal, autenticación y panel administrativo es sólida para escalar hacia ecommerce transaccional, pero **no existe dominio de pedidos**: no hay checkout, pagos, fulfillment ni historial de compras.

La arquitectura recomendada introduce un **modelo de pedidos independiente** de `quotes` (carrito) y `shared_carts` (snapshots compartibles), con precios congelados en línea, estados de ciclo de vida claros, y una estrategia de pagos centrada en **Mercado Pago + pago en tienda + transferencia** para el mercado mexicano, dejando Stripe/PayPal como fase posterior.

---

## 1. Auditoría del estado actual

### 1.1 Inventario de capacidades existentes

| Dominio | Implementación actual | Archivos / tablas clave |
|---------|----------------------|-------------------------|
| **Carrito cliente** | `quotes` + `quote_items` (auth) o `localStorage` (invitado) | `src/lib/quotes/actions.ts`, `QuoteProvider`, `/carrito` |
| **Carrito admin** | Mismo carrito unificado + compartir | `CartShareActions`, `createSharedCart()` |
| **Shared carts** | Snapshots con precio congelado, TTL 7 días | `shared_carts`, `shared_cart_items`, `/carrito/s/[token]` |
| **Cotizaciones admin** | Lista y cambio de estado de `quotes` | `/admin/cotizaciones`, `QuotesManager` |
| **Productos** | Catálogo publicado, precio entero MXN, SKU opcional | `products`, `is_published`, `price` |
| **Inventario** | Stock por sucursal, edición manual | `product_inventory`, `branches`, `/admin/inventario` |
| **Sucursales** | Chalco + Amecameca en BD; horarios en `site-contact.ts` | `branches`, `SITE_CONTACT` |
| **Auth** | Google OAuth, `profiles.role` (`user` \| `admin`) | `getCurrentAccount()`, middleware `/admin` |
| **Pedidos** | **No existe** | Sidebar `/admin/pedidos` marcado `soon` |
| **Clientes** | Solo `profiles` básico | `/admin/clientes` marcado `soon`, `/cuenta` sin pedidos |
| **Pagos** | **No existe** | Botón "Comprar" deshabilitado en carrito |
| **Audit** | Tabla `admin_audit_log` sin escritura desde app | Migración 20260522000000 |

### 1.2 Fortalezas (listas para soportar pedidos)

1. **Catálogo maduro** — productos publicados, imágenes, marcas, categorías, PDP funcional.
2. **Precios enteros en MXN** — alineado con `shared_cart_items.unit_price` y formato de moneda existente.
3. **Patrón de precio congelado** — `shared_cart_items` ya demuestra snapshot de línea; reutilizable conceptualmente en `order_items`.
4. **Inventario por sucursal** — `product_inventory` + `branches` permite fulfillment multi-tienda.
5. **Auth y roles** — separación admin/cliente con RLS y `requireAdmin()`.
6. **Carrito persistente** — `quotes`/`quote_items` pueden servir como **origen** de conversión a pedido (no como pedido).
7. **Panel admin** — estructura de sidebar y patrones CRUD (productos, cotizaciones) reutilizables.
8. **Shared carts** — canal de venta asistida ya operativo; convertible a pedido manual por admin en fase intermedia.

### 1.3 Debilidades y limitaciones

| Área | Limitación | Impacto en pedidos |
|------|------------|-------------------|
| **quotes ≠ pedidos** | `quotes.status` (`draft`/`sent`/`closed`/`cancelled`) es workflow de asesoría, no de venta | Requiere tabla `orders` separada |
| **unit_price en quote_items** | Campo existe pero **no se escribe** al agregar al carrito | Sin snapshot hasta checkout |
| **Contacto en quotes** | `contact_name/phone/email` sin uso en UI | Checkout debe capturar o reutilizar perfil |
| **Inventario** | Solo lectura/escritura manual; sin reserva ni decremento | Riesgo de sobreventa sin capa de reservas |
| **Sucursales duplicadas** | BD (`branches`) vs estático (`SITE_CONTACT`) | Fulfillment debe unificar fuente de verdad |
| **shared_carts** | Sin listado admin, expiran sin auditoría | No sustituyen pedidos |
| **POS legacy** | `seller-session` en localStorage, desacoplado | Ventas en tienda no persistidas |
| **Sin direcciones** | No hay tabla de shipping/billing | Requerido para envío nacional |
| **Sin impuestos** | Precio único, sin IVA desglosado | Aceptable para B2C México si precio incluye IVA |
| **Sin variantes** | Un producto = un SKU | Simplifica ORDER-2; limita escalabilidad futura |

### 1.4 Riesgos futuros si no se diseña bien

1. **Reutilizar `quotes` como pedidos** — mezcla carrito activo con venta cerrada; imposible tener carrito + historial simultáneo.
2. **No congelar precios en checkout** — disputas si el catálogo cambia entre carrito y pago.
3. **Decrementar stock sin reserva** — race conditions en productos de alta demanda.
4. **Checkout largo** — abandono alto en mercado mexicano (WhatsApp ya funciona como atajo).
5. **Un solo proveedor de pago** — sin fallback manual (transferencia / tienda) se pierden ventas locales.
6. **Invitado sin trazabilidad** — pedidos huérfanos difíciles de atender post-venta.

### 1.5 Qué está listo vs qué falta

| Listo para pedidos reales | Falta |
|---------------------------|-------|
| Catálogo + PDP + precios | Tablas `orders`, `order_items` |
| Carrito unificado | Flujo checkout |
| Inventario por sucursal | Reserva / asignación de stock |
| Auth Google + perfiles | Direcciones de envío |
| Admin panel base | Módulo pedidos, clientes, pagos |
| Precio congelado (patrón en shared carts) | Integración pasarela |
| RLS + roles | Webhooks de pago |
| WhatsApp asesoría (canal paralelo) | Confirmación email / página de gracias |
| Audit log (schema) | Escritura en transiciones críticas |

---

## 2. Flujo de compra ideal

### 2.1 Diagrama general

```
Producto (PDP)
    ↓  Agregar
Carrito (/carrito)          ← quotes + quote_items (existente)
    ↓  Comprar
Checkout (/checkout)        ← NUEVO: datos + envío + pago
    ↓  Confirmar pago
Pedido (orders)             ← NUEVO: registro inmutable
    ↓
Confirmación (/pedido/[número])
    ↓
Fulfillment (admin)         ← preparar → enviar / listo para recoger
```

### 2.2 Detalle por paso

#### Paso 1 — Producto

- **Datos:** producto, precio visible, stock por sucursal (informativo).
- **Acción:** Agregar al carrito (existente).
- **Evitar:** Forzar login antes de agregar (genera abandono).

#### Paso 2 — Carrito

- **Datos:** líneas con cantidad; total estimado (precio vivo del catálogo).
- **Acciones cliente:** Solicitar asesoría (WhatsApp), **Comprar** (habilitar en ORDER-3).
- **Acciones admin:** Compartir carrito (sin cambio).
- **Evitar:** Pedir dirección o pago aquí.

#### Paso 3 — Checkout (NUEVO)

Diseño **de un solo paso con secciones progresivas** (estilo Shopify), no wizard de 5 pantallas.

| Sección | Datos | Cuándo | Obligatorio |
|---------|-------|--------|-------------|
| **Contacto** | Nombre, teléfono, email | Siempre | Sí |
| **Entrega** | Método + sucursal o dirección | Siempre | Sí |
| **Pago** | Método seleccionado | Siempre | Sí |
| **Resumen** | Líneas con precio congelado al iniciar checkout | Al entrar | — |

**Reglas anti-abandono:**

- Pre-llenar desde `profiles` + último pedido si existe sesión.
- Invitado permitido; ofrecer "crear cuenta al final" (no bloquear).
- No pedir RFC ni facturación salvo que el usuario la solicite.
- Mostrar total con envío antes de elegir pago.
- Guardar checkout incompleto en sesión (recuperación).

#### Paso 4 — Pago

- Redirección a pasarela (Mercado Pago) o instrucciones (transferencia / tienda).
- Webhook confirma → actualiza pedido.
- **No crear pedido `paid` sin confirmación** (excepto pago en tienda con flujo manual admin).

#### Paso 5 — Pedido

- Registro inmutable con líneas y precios congelados.
- Número legible: `RS-2026-00042` (prefijo + año + secuencia).
- Vaciar o archivar carrito (`quotes`) tras conversión exitosa.

#### Paso 6 — Confirmación

- Página `/pedido/[número]` o `/gracias?order=RS-2026-00042`.
- Resumen, método de entrega, siguiente paso ("Te contactaremos", "Recoge en Chalco").
- Email opcional en ORDER-5.

### 2.3 Flujo paralelo: asesoría WhatsApp (mantener)

El flujo actual **no se elimina**. Convive con checkout:

- Cliente indeciso → WhatsApp → admin puede compartir carrito → cliente importa → checkout.
- Admin puede crear pedido manual desde cotización compartida (ORDER-4, acción admin).

---

## 3. Modelo de pedidos

### 3.1 Principio de diseño

> **Un pedido es un contrato de venta cerrado.** El carrito es intención; el pedido es compromiso.

`quotes` permanece como carrito. `orders` es entidad nueva.

### 3.2 Tabla `orders` (propuesta)

| Campo | Tipo | Necesario | Notas |
|-------|------|-----------|-------|
| `id` | uuid PK | Sí | Interno |
| `order_number` | text UNIQUE | Sí | Humano: `RS-2026-00042` |
| `user_id` | uuid FK nullable | Sí | Null = invitado |
| `status` | text enum | Sí | Ver sección 4 |
| `currency` | text | Sí | Default `MXN` |
| `subtotal` | int | Sí | Centavos o pesos enteros (consistente con app actual: **pesos enteros**) |
| `shipping_amount` | int | Sí | 0 si recoger en tienda |
| `discount_amount` | int | No* | *Fase posterior |
| `total` | int | Sí | subtotal + shipping - discount |
| `fulfillment_type` | text enum | Sí | `pickup` \| `local_delivery` \| `national_shipping` |
| `branch_id` | uuid FK nullable | Condicional | Obligatorio si `pickup` |
| `customer_name` | text | Sí | Snapshot |
| `customer_email` | text | Sí | Snapshot |
| `customer_phone` | text | Sí | Snapshot |
| `shipping_address` | jsonb nullable | Condicional | Ver sección 6 |
| `customer_note` | text | No | Comentarios del cliente |
| `admin_note` | text | No | Interno |
| `payment_method` | text enum | Sí | Ver sección 7 |
| `payment_status` | text enum | Sí | `pending` \| `paid` \| `failed` \| `refunded` |
| `payment_reference` | text nullable | No | ID externo Mercado Pago |
| `source` | text | Sí | `checkout` \| `admin_manual` \| `whatsapp_conversion` |
| `quote_id` | uuid FK nullable | No | Trazabilidad carrito origen |
| `shared_cart_id` | uuid FK nullable | No | Trazabilidad share origen |
| `created_at` | timestamptz | Sí | |
| `updated_at` | timestamptz | Sí | |
| `paid_at` | timestamptz nullable | No | |
| `cancelled_at` | timestamptz nullable | No | |

**Campos NO necesarios en v1:**

- `tax_lines` — precio público puede incluir IVA (común en retail MX).
- `coupon_code` — sin promociones en v1.
- `weight_total` — sin cálculo automático de envío en v1.
- `invoice_rfc` — facturación bajo demanda manual.
- `seller_id` — sin comisiones multi-vendedor.

### 3.3 Tabla `order_items` (propuesta)

| Campo | Tipo | Necesario | Notas |
|-------|------|-----------|-------|
| `id` | uuid PK | Sí | |
| `order_id` | uuid FK | Sí | |
| `product_id` | uuid FK | Sí | restrict on delete |
| `product_name` | text | Sí | Snapshot |
| `product_slug` | text | Sí | Snapshot para enlaces |
| `sku` | text nullable | No | Si existe en producto |
| `quantity` | int | Sí | > 0 |
| `unit_price` | int | Sí | **Congelado** al crear pedido |
| `line_total` | int | Sí | unit_price × quantity |
| `image_url` | text nullable | No | UX en confirmación/email |
| `sort_order` | int | Sí | |

**Campos NO necesarios en v1:**

- `variant_id` — sin variantes.
- `tax_rate` — simplificado.
- `fulfilled_quantity` — usar estado a nivel pedido primero; split parcial en fase posterior.

### 3.4 Tabla auxiliar `order_status_history` (recomendada)

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `order_id` | uuid FK | |
| `from_status` | text nullable | |
| `to_status` | text | |
| `actor_id` | uuid nullable | admin o sistema |
| `note` | text nullable | |
| `created_at` | timestamptz | |

Permite auditoría y timeline en panel admin.

### 3.5 Relación con entidades existentes

```
quotes (carrito activo)
    └── convertir a ──→ orders (una vez pagado/confirmado)
                              └── order_items

shared_carts (snapshot)
    └── admin puede crear ──→ orders (manual, ORDER-4+)

product_inventory
    └── decrementar en ──→ status = confirmed|paid (ORDER-4)
```

---

## 4. Estados del pedido

### 4.1 Máquina de estados propuesta

```
                    ┌─────────────┐
                    │  pendiente  │ ← creado, pago no confirmado
                    └──────┬──────┘
           cancelar        │ pagar / confirmar (admin)
              ┌────────────┼────────────┐
              ▼            ▼            │
        ┌──────────┐  ┌──────────┐     │
        │cancelado │  │ confirmado│     │
        └──────────┘  └─────┬────┘     │
                              │          │
                              ▼          │
                        ┌──────────┐     │
                        │   pagado  │◄───┘ (si pago online automático)
                        └─────┬────┘
                              │
                              ▼
                        ┌──────────┐
                        │preparando│
                        └─────┬────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ listo_   │   │ enviado  │   │ entregado│
        │ recoger  │   │          │   │          │
        └──────────┘   └──────────┘   └──────────┘
```

### 4.2 Definición de estados

| Estado | Significado | Quién lo asigna | Dispara |
|--------|-------------|-----------------|---------|
| `pendiente` | Pedido creado; esperando pago | Sistema (checkout) | Email/WhatsApp opcional "orden recibida" |
| `confirmado` | Pago recibido o aprobado manualmente (transferencia/tienda) | Sistema (webhook) o Admin | Reserva stock; notifica admin |
| `pagado` | Equivalente financiero confirmado (puede fusionarse con `confirmado` en v1) | Sistema | — |
| `preparando` | Almacén preparando pedido | Admin | — |
| `listo_recoger` | Disponible en sucursal | Admin | Notifica cliente |
| `enviado` | En tránsito (paquetería o reparto propio) | Admin | Tracking opcional |
| `entregado` | Cierre exitoso | Admin o Sistema | Decremento stock definitivo si no se hizo antes |
| `cancelado` | Anulado antes de entregar | Admin o Sistema (timeout pago) | Libera reserva stock |

**Recomendación v1:** Usar `confirmado` como estado único post-pago y omitir `pagado` redundante. Mantener `payment_status` separado para finanzas.

### 4.3 `payment_status` (paralelo)

| Valor | Uso |
|-------|-----|
| `pending` | Esperando pago |
| `paid` | Cobrado |
| `failed` | Rechazado |
| `refunded` | Devuelto (fase posterior) |

Separar **estado operativo** (`orders.status`) de **estado financiero** (`payment_status`) evita mezclar "enviado" con "pagado".

---

## 5. Clientes

### 5.1 Recomendación: ambas opciones (invitado + cuenta)

| Opción | Ventajas | Desventajas |
|--------|----------|-------------|
| **Solo invitado** | Menor fricción | Sin historial; soporte difícil |
| **Solo cuenta** | Trazabilidad; repetición de datos | Abandono alto; Google ya reduce fricción |
| **Ambas (recomendado)** | Mejor conversión + retención opcional | Más lógica de vinculación post-compra |

### 5.2 Estrategia propuesta

1. **Checkout como invitado por defecto** — nombre, teléfono, email.
2. **Si hay sesión Google** — pre-llenar desde `profiles`.
3. **Post-compra** — "Guarda tu pedido: continúa con Google" (vincula `orders.user_id`).
4. **Cuenta existente** — historial en `/cuenta/pedidos` (ORDER-4).

### 5.3 Tabla `customer_addresses` (fase ORDER-2, opcional v1)

Para clientes recurrentes con envío nacional:

| Campo | Notas |
|-------|-------|
| `user_id` | FK profiles |
| `label` | "Casa", "Estudio" |
| `street`, `colony`, `city`, `state`, `postal_code` | México |
| `references` | Entre calles |
| `is_default` | bool |

**v1 mínimo:** `shipping_address` jsonb en `orders` sin tabla separada.

### 5.4 Relación con `profiles`

No duplicar `customers` como tabla aparte en v1. `profiles` + snapshot en `orders` es suficiente. Tabla `customers` solo si se necesita CRM avanzado (ORDER-7).

---

## 6. Envíos

Radio Shalko tiene **dos sucursales físicas**: Valle de Chalco y Amecameca (Estado de México).

### 6.1 Métodos de fulfillment

| Método | `fulfillment_type` | Datos requeridos | Checkout UX |
|--------|-------------------|------------------|-------------|
| **Recoger en tienda** | `pickup` | Sucursal (`branch_id`), nombre, teléfono | Selector Chalco / Amecameca + horarios |
| **Envío local** | `local_delivery` | Dirección en zona metropolitana, teléfono, referencias | CP + colonia + calle; validar zona |
| **Envío nacional** | `national_shipping` | Dirección completa, CP, estado, teléfono | Formulario completo; costo fijo o por cotización |

### 6.2 Impacto en checkout

```
┌─────────────────────────────────────┐
│ ¿Cómo quieres recibir tu pedido?    │
├─────────────────────────────────────┤
│ ○ Recoger en tienda (sin costo)     │
│   → [Chalco] [Amecameca]            │
│ ○ Envío local ($X o "por confirmar") │
│   → Dirección                       │
│ ○ Envío nacional ($X o cotización)   │
│   → Dirección completa              │
└─────────────────────────────────────┘
```

### 6.3 Estrategia de costos v1

| Método | Costo v1 recomendado |
|--------|---------------------|
| Pickup | $0 |
| Local | Tarifa fija o "Se confirma por WhatsApp" (`shipping_amount = 0`, nota admin) |
| Nacional | Tarifa fija por zona o cotización manual post-pedido |

**No integrar paquetería automática (Estafeta, DHL) en v1** — admin actualiza tracking manualmente.

### 6.4 Unificación sucursales

**Decisión ORDER-2:** `branches` en BD es fuente de verdad. `SITE_CONTACT` debe leer de BD o sincronizarse. `orders.branch_id` referencia `branches.id`.

### 6.5 Stock y sucursal

- **Pickup:** verificar stock en `branch_id` seleccionado.
- **Envío:** descontar de sucursal asignada por admin (default: Chalco como hub).

---

## 7. Pagos (diseño únicamente)

### 7.1 Contexto México · retail musical

Radio Shalko vende instrumentos de ticket medio-alto ($3,000–$50,000+ MXN). El cliente mezcla:
- compradores locales que prefieren **ver y probar** en tienda;
- compradores online que necesitan **tarjeta, MSI y confianza**;
- flujo actual fuerte por **WhatsApp y transferencia**.

### 7.2 Comparativa de métodos

| Método | Ventajas | Desventajas | Costo aprox. | Complejidad |
|--------|----------|-------------|--------------|-------------|
| **Mercado Pago** | Dominante en MX; tarjetas, SPEI, OXXO, MSI; buena documentación | Comisiones; onboarding business | ~3.5% + $4 tarjeta; MSI adicional | Media |
| **Stripe** | Excelente DX; internacional | Menor adopción directa MX; sin OXXO nativo | ~3.6% + $3 MXN | Media-baja |
| **PayPal** | Confianza internacional | Menos usado en retail local MX | ~3.95% + fijo | Media |
| **Transferencia SPEI** | Sin comisión pasarela; común en MX | Conciliación manual; fraude si no se valida | $0 | Baja (operativa alta) |
| **Pago en tienda** | Cero fricción online; alinea con showroom | No cobra online; requiere reserva | $0 | Baja |

### 7.3 Recomendación para Radio Shalko

**Fase ORDER-5 (pagos):**

1. **Primario:** Mercado Pago Checkout Pro o Bricks — tarjeta + SPEI + OXXO.
2. **Secundario:** Transferencia bancaria con upload de comprobante o validación admin.
3. **Terciario:** Pago en tienda al recoger — pedido `pendiente` hasta confirmación admin.
4. **Postergar:** Stripe (si se expande B2B internacional), PayPal (bajo volumen esperado).

**MSI (meses sin intereses):** activar en Mercado Pago para tickets >$3,000 — crítico en categoría musical.

### 7.4 Flujo técnico (diseño)

```
Checkout selecciona payment_method
    │
    ├─ mercado_pago → crear preferencia → redirect → webhook → orders.payment_status = paid
    ├─ bank_transfer → orders pendiente → admin confirma → confirmado
    └─ pay_in_store → orders pendiente → admin confirma al recibir → confirmado
```

**Tabla `payments` (ORDER-2, opcional):** registrar intentos, IDs externos, montos, para conciliación.

---

## 8. Panel administrativo — sección Ventas

### 8.1 Estructura propuesta

```
Ventas
├── Carritos          → /admin/cotizaciones (existente; renombrar copy)
├── Pedidos           → /admin/pedidos (NUEVO)
├── Clientes          → /admin/clientes (NUEVO)
├── Pagos             → /admin/pagos (NUEVO, ORDER-5)
└── Reportes          → /admin/reportes (NUEVO, ORDER-7)
```

### 8.2 Pedidos — qué debe ver el admin

| Vista | Contenido |
|-------|-----------|
| **Lista** | Número, fecha, cliente, total, estado, método pago, fulfillment |
| **Filtros** | Estado, fecha, sucursal, método pago, fuente |
| **Detalle** | Líneas con snapshot, dirección, notas, timeline de estados |
| **Acciones** | Cambiar estado, confirmar pago manual, cancelar, agregar nota, imprimir |

### 8.3 Métricas importantes (v1)

- Pedidos hoy / semana / mes
- Ingresos brutos (`sum(total)` donde `payment_status = paid`)
- Tasa de conversión carrito → pedido (fase posterior, requiere analytics)
- Pedidos pendientes de pago
- Pedidos listos para recoger
- Top productos vendidos

### 8.4 Clientes — qué debe ver el admin

- Lista de compradores (desde `orders` agrupado por email/teléfono)
- Historial de pedidos por cliente
- Total gastado
- Última compra
- **No CRM completo en v1** — sin campañas, sin segmentación avanzada

### 8.5 Pagos — qué debe ver el admin

- Cola de transferencias pendientes de validar
- Referencias Mercado Pago
- Conciliación: pedido ↔ pago ↔ monto

### 8.6 Reportes — fase ORDER-7

- Ventas por período
- Ventas por sucursal
- Ventas por categoría/marca
- Export CSV

---

## 9. Roadmap completo

### ORDER-1 — Arquitectura ✅ (esta fase)

- Documento de diseño
- Decisiones de modelo y flujo
- Sin código ni migraciones

### ORDER-2 — Modelo de datos

| Entregable | Detalle |
|------------|---------|
| Migraciones | `orders`, `order_items`, `order_status_history`, opcional `payments` |
| RLS | Cliente lee sus pedidos; admin CRUD |
| Tipos | Regenerar `database.generated.ts` |
| Secuencia | `order_number` via función SQL o tabla contador |

**Depende de:** ORDER-1  
**Riesgo:** Acoplar mal `quotes` — mantener separados  
**Prioridad:** Alta

### ORDER-3 — Checkout

| Entregable | Detalle |
|------------|---------|
| Ruta `/checkout` | UI una página, secciones contacto/entrega/pago |
| Server Action | `createOrderFromCart()` — congela precios, vacía carrito |
| Validación | Stock disponible, productos publicados |
| Invitado | Flujo sin login |

**Depende de:** ORDER-2  
**Riesgo:** Checkout largo — mantener mínimo viable  
**Prioridad:** Alta

### ORDER-4 — Pedidos

| Entregable | Detalle |
|------------|---------|
| `/admin/pedidos` | Lista + detalle + cambio estado |
| `/cuenta/pedidos` | Historial cliente |
| `/pedido/[número]` | Confirmación pública (token o auth) |
| Stock | Reserva al `confirmado`; liberar al `cancelado` |
| Conversión | Admin: shared cart → pedido manual |

**Depende de:** ORDER-2, ORDER-3  
**Riesgo:** Sobreventa sin reservas — implementar check atómico  
**Prioridad:** Alta

### ORDER-5 — Pagos

| Entregable | Detalle |
|------------|---------|
| Mercado Pago | Preferencias + webhooks |
| Transferencia | Instrucciones + confirmación admin |
| Pago en tienda | Flujo manual |
| `payment_status` | Sincronización con webhooks |

**Depende de:** ORDER-3, ORDER-4  
**Riesgo:** Webhooks en dev; idempotencia  
**Prioridad:** Media-alta (puede lanzar antes con solo transferencia/tienda)

### ORDER-6 — Envíos

| Entregable | Detalle |
|------------|---------|
| Tarifas | Config admin o constantes |
| Zonas | CP válidos para envío local |
| Tracking | Campo `tracking_number` en orders |
| Notificaciones | "Tu pedido fue enviado" |

**Depende de:** ORDER-3, ORDER-4  
**Riesgo:** Cotización manual al inicio — aceptable  
**Prioridad:** Media

### ORDER-7 — Panel administrativo avanzado

| Entregable | Detalle |
|------------|---------|
| `/admin/clientes` | Vista agregada |
| `/admin/pagos` | Conciliación |
| `/admin/reportes` | Métricas + export |
| `admin_audit_log` | Escribir en acciones críticas |
| Dashboard | KPIs en `/admin` |

**Depende de:** ORDER-4, ORDER-5  
**Riesgo:** Scope creep — priorizar pedidos primero  
**Prioridad:** Media-baja

### Diagrama de dependencias

```
ORDER-1 (arquitectura)
    └── ORDER-2 (datos)
            ├── ORDER-3 (checkout)
            │       └── ORDER-5 (pagos)
            └── ORDER-4 (pedidos)
                    ├── ORDER-5
                    ├── ORDER-6 (envíos)
                    └── ORDER-7 (panel avanzado)
```

### Lanzamiento incremental sugerido

| Milestone | Capacidad | Valor de negocio |
|-----------|-----------|------------------|
| **M1** | ORDER-2 + ORDER-3 + pago en tienda/transferencia | Pedidos reales sin pasarela |
| **M2** | ORDER-4 completo + cuenta pedidos | Operación y cliente ven historial |
| **M3** | ORDER-5 Mercado Pago | Cobro online automatizado |
| **M4** | ORDER-6 + ORDER-7 | Escala operativa y reportes |

---

## 10. Decisiones de arquitectura clave (ADRs resumidas)

| # | Decisión | Alternativa rechazada | Razón |
|---|----------|----------------------|-------|
| ADR-1 | Tabla `orders` separada de `quotes` | Promover quotes a pedidos | Carrito activo vs venta cerrada |
| ADR-2 | Precio congelado en `order_items` | Precio vivo del catálogo | Integridad contractual |
| ADR-3 | Checkout invitado + cuenta opcional | Solo cuenta | Conversión en mercado MX |
| ADR-4 | Mercado Pago como pasarela primaria | Solo Stripe | Adopción local, OXXO, MSI |
| ADR-5 | Fulfillment manual v1 | Integración paquetería API | Complejidad vs volumen inicial |
| ADR-6 | `branches` BD como fuente de verdad | Solo SITE_CONTACT | Consistencia inventario/pickup |
| ADR-7 | Estados operativos ≠ payment_status | Un solo campo status | Claridad operativa/financiera |

---

## 11. Glosario

| Término | Definición en Radio Shalko |
|---------|---------------------------|
| **Carrito** | `quotes` + `quote_items` — intención de compra editable |
| **Cotización / Solicitud** | Quote con status ≠ draft; flujo asesoría |
| **Shared cart** | Snapshot temporal compartible por vendedor |
| **Pedido** | `orders` — venta registrada con precios congelados |
| **Checkout** | Proceso de cierre entre carrito y pedido |
| **Fulfillment** | Entrega, recogida o envío del pedido |

---

## 12. Próximo paso

**ORDER-2:** Traducir este documento a migraciones SQL, políticas RLS, tipos TypeScript y contrato de Server Actions — sin implementar UI de checkout hasta que el modelo de datos esté aprobado.

---

*Documento generado en fase ORDER-1. No modifica código, Supabase ni componentes existentes.*
