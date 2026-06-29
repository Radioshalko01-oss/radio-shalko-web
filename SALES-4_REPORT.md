# SALES-4 — Revisión y aprobación de disponibilidad

**Proyecto:** Radio Shalko WEB  
**Fase:** SALES-4 (revisión admin · sin Stripe)  
**Fecha:** 2026-06-22

---

## 1. Resumen de cambios

Se agregó la **revisión de disponibilidad** en el detalle admin de pedidos. El administrador puede:

- Aprobar con **Disponible hoy**, **Disponible mañana** o **Fecha personalizada**
- Marcar **No disponible**
- Editar el **mensaje para el cliente** (autopoblado, editable)
- Agregar **nota interna** (solo admin)
- Tras guardar: ver decisión en lectura y abrir **WhatsApp manual** con el mensaje guardado

**Transiciones de estado:**

| Acción | `status` | `payment_status` | `fulfillment_status` |
|--------|----------|------------------|----------------------|
| Aprobar | `confirmed` | `unpaid` | `unfulfilled` |
| No disponible | `cancelled` | `unpaid` | `cancelled` |

**UI actualizada:**

- Pendiente → “Pendiente de revisión”
- Aprobado sin pago → “Aprobado · esperando pago”
- Cancelado → “No disponible”
- Lista y detalle muestran hints: “Disponible hoy / mañana / el DD/MM/YYYY”

**No incluido (por diseño):** Stripe, emails, WhatsApp API, inventario.

---

## 2. Archivos creados / modificados

### Creados

| Archivo | Propósito |
|---------|-----------|
| `supabase/migrations/20260529000000_order_availability_review.sql` | Columnas de revisión en `orders` |
| `src/lib/orders/admin-actions.ts` | Server Action `submitOrderAvailabilityReview` |
| `src/lib/orders/dates.ts` | Fechas CDMX (hoy, mañana, formato) |
| `src/components/admin/order-availability-review.tsx` | Formulario y vista lectura de decisión |
| `SALES-4_REPORT.md` | Este documento |

### Modificados

| Archivo | Cambio |
|---------|--------|
| `src/lib/orders/types.ts` | Tipos checkout + `AvailabilityDecision` |
| `src/lib/orders/status-labels.ts` | Etiquetas, mensajes cliente, WhatsApp post-revisión |
| `src/lib/orders/admin-queries.ts` | Lee columnas nuevas |
| `src/components/admin/order-detail-view.tsx` | Integra sección de revisión |
| `src/components/admin/order-detail-actions.tsx` | WA pre-revisión solo en pendientes |
| `src/components/admin/orders-manager.tsx` | Estados y fecha en tarjetas |
| `src/types/database.generated.ts` | Tipos Supabase actualizados |

---

## 3. Migración

**Archivo:** `supabase/migrations/20260529000000_order_availability_review.sql`

**Columnas en `orders`:**

- `reviewed_at` (timestamptz)
- `reviewed_by` (uuid → auth.users)
- `availability_decision` (`available_today` | `available_tomorrow` | `available_custom` | `unavailable`)
- `pickup_available_date` (date)
- `admin_internal_note` (text)
- `customer_message` (text)

**RLS:** sin cambios. `orders_update_admin` e `order_status_history_insert_admin` ya cubren escritura admin.

---

## 4. Cómo aplicar migración

En Supabase (proyecto Radio Shalko):

```bash
supabase db push
```

O ejecutar el SQL del archivo en el SQL Editor del dashboard.

---

## 5. Cómo probar

### A. Pedido pendiente

1. Login → checkout → enviar solicitud.
2. Admin → `/admin/pedidos/[id]`.
3. Ver sección **“Revisión de disponibilidad”** con opciones.

### B. Aprobar hoy / mañana / custom

1. Elegir opción → verificar mensaje autopoblado (editable).
2. **Confirmar disponibilidad**.
3. Estado → “Aprobado · esperando pago”.
4. Fecha guardada correctamente.
5. **Enviar mensaje por WhatsApp** abre `wa.me` con texto guardado.

### C. No disponible

1. Elegir **No disponible** → **Marcar no disponible**.
2. Estado → “No disponible”.
3. `payment_status` sigue `unpaid`.

### D. Seguridad

- Usuario no admin: no accede a `/admin/pedidos` ni puede ejecutar la action.
- Pedido ya revisado: action rechaza con error.

### E. Build

```bash
npm run build
```

---

## 6. Resultado de `npm run build`

**Exit code: 0**

---

## 7. Riesgos pendientes

| Riesgo | Mitigación / nota |
|--------|-------------------|
| Migración no aplicada en prod | Columnas faltantes → error al guardar; aplicar migración antes de usar |
| Zona horaria | Hoy/mañana usan `America/Mexico_City` |
| Historial parcial | Si falla insert en `order_status_history`, el pedido sí se actualiza (se loguea error) |
| Re-edición | Pedidos ya confirmados/cancelados no se pueden revisar de nuevo desde esta UI |
| Cliente no ve mensaje | SALES-5+ (email / “Mis pedidos”) |

---

## 8. Qué queda para SALES-5

- Generar **Stripe Payment Link** tras aprobación (`confirmed` + `unpaid`)
- Notificar cliente (email o UI “Mis pedidos”)
- Webhooks de pago → `payment_status = paid`
- Cola de preparación / listo para recolección
- Decremento de inventario al confirmar pago o al preparar
- Estados avanzados del Sales OS

---

## Criterios de aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1–7 | Sección revisión, opciones, mensaje, nota interna | ✅ |
| 8–10 | Estados confirmed/cancelled, unpaid | ✅ |
| 11–13 | Sin pago, sin Stripe, sin inventario | ✅ |
| 14–17 | Fecha, mensaje, nota, historial | ✅ |
| 18–19 | Lista actualizada, WhatsApp manual | ✅ |
| 20–22 | Admin-only, sin ops internas, build verde | ✅ |
