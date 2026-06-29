# SALES-7 — Preparación, listo para recoger y entrega de pedidos pagados

**Proyecto:** Radio Shalko WEB  
**Fase:** SALES-7 (operación post-pago · pickup en tienda)  
**Fecha:** 2026-06-22

---

## 1. Resumen de cambios

Flujo operativo después del pago Stripe:

| Paso admin | `fulfillment_status` | Cliente ve |
|------------|----------------------|------------|
| Pago confirmado (webhook) | `unfulfilled` | Pago confirmado |
| Marcar preparando | `preparing` | Preparando pedido |
| Marcar listo + mensaje | `ready_for_pickup` | Listo para recoger |
| Marcar entregado | `delivered` | Pedido entregado |

**Incluye:**
- Sección admin **Preparación y entrega**
- Mensaje y hora estimada para recolección
- WhatsApp manual al marcar listo
- Email opcional (Resend) al marcar listo
- Notificaciones cliente: prioridad “listo para recoger”
- Admin en `/cuenta/pedidos/[id]`: sin WhatsApp, con enlace al panel admin
- Filtros admin: Listos para recoger · Entregados

**Sin:** inventario automático, envíos, WhatsApp API, Sicar.

---

## 2. Archivos creados / modificados

### Creados

| Archivo | Propósito |
|---------|-----------|
| `supabase/migrations/20260531000000_order_fulfillment_pickup.sql` | Campos de preparación/entrega |
| `src/components/admin/order-fulfillment-section.tsx` | UI admin operativa |
| `src/lib/notifications/customer-pickup-email.ts` | Email opcional listo para recoger |
| `SALES-7_REPORT.md` | Este documento |

### Modificados

| Archivo | Cambio |
|---------|--------|
| `src/lib/orders/admin-actions.ts` | `markOrderPreparing`, `markOrderReadyForPickup`, `markOrderDelivered` |
| `src/lib/orders/admin-queries.ts` | Campos fulfillment, filtros, prioridad lista |
| `src/lib/orders/customer-queries.ts` | Campos fulfillment, resumen `readyForPickupCount` |
| `src/lib/orders/status-labels.ts` | Labels admin post-pago, WhatsApp pickup |
| `src/lib/orders/customer-status-labels.ts` | Labels y copy cliente por fulfillment |
| `src/components/admin/order-detail-view.tsx` | Sección Preparación y entrega |
| `src/components/admin/orders-manager.tsx` | Badges y filtros nuevos |
| `src/components/account/customer-order-detail-view.tsx` | Bloques por estado + vista admin |
| `src/components/account/customer-orders-list.tsx` | Badge con fulfillment |
| `src/app/(site)/cuenta/pedidos/[id]/page.tsx` | Pasa `isAdminViewer` |
| `src/app/(site)/cuenta/page.tsx` | Badge prioriza listo para recoger |
| `src/types/database.generated.ts` | Tipos nuevos |

---

## 3. Migración creada

**Nombre:** `supabase/migrations/20260531000000_order_fulfillment_pickup.sql`

Columnas:
- `prepared_at`
- `ready_for_pickup_at`
- `delivered_at`
- `pickup_ready_message`
- `pickup_ready_estimate`
- `fulfillment_updated_by`

Sin cambios RLS.

**Aplicar:**

```bash
npm run db:migrate
```

---

## 4. Cómo probar

### A. Pedido pagado

1. Pedido con `payment_status = paid`, `fulfillment_status = unfulfilled`
2. Admin → `/admin/pedidos/[id]` → sección **Preparación y entrega**
3. **Marcar como preparando**

### B. Preparando

1. Cliente en `/cuenta/pedidos/[id]` → “Preparando pedido”
2. Admin completa mensaje + estimado → **Marcar como listo para recoger**

### C. Listo para recoger

1. Cliente ve mensaje y hora estimada
2. `/cuenta` muestra “1 listo para recoger”
3. Admin → **Enviar aviso por WhatsApp** (manual)

### D. Entregado

1. Admin → **Marcar como entregado**
2. Cliente ve “Pedido entregado”
3. Admin ya no muestra acciones operativas

### E. Admin en vista cliente

1. Login como admin con pedido propio
2. `/cuenta/pedidos/[id]` → aviso administrativo + **Gestionar en panel admin**
3. No aparece “Contactar a Radio Shalko”

### F. Email (opcional)

Con `CUSTOMER_ORDER_EMAILS_ENABLED=true` + Resend → email al marcar listo.

### G. Build

```bash
npm run build
```

---

## 5. Resultado de `npm run build`

**Exit code: 0**

---

## 6. Riesgos pendientes

| Riesgo | Nota |
|--------|------|
| Admin en `/cuenta` solo ve pedidos propios (RLS) | Para gestionar pedidos de clientes usar `/admin/pedidos` |
| Sin regenerar enlace Stripe expirado | Pendiente SALES-8+ |
| Sin inventario al entregar | Decremento manual o fase futura |
| Email opcional | Flujo no depende del correo |

---

## 7. Qué queda para SALES-8

- Decremento automático de inventario al entregar
- Regeneración de sesión Stripe expirada
- Integración Sicar (si aplica)
- QR / firma de entrega
- Refunds y devoluciones
- Notificaciones push adicionales

---

## Criterios de aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1–7 | Admin preparación, listo, WhatsApp, entregado | ✅ |
| 8–11 | Cliente ve estados y mensajes | ✅ |
| 12–14 | Notificaciones + vista admin en cuenta | ✅ |
| 15–19 | Email opcional, sin envíos/inventario | ✅ |
