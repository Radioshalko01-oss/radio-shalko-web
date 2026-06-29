# SALES-5.2 — Mis pedidos del cliente y notificaciones en cuenta

**Proyecto:** Radio Shalko WEB  
**Fase:** SALES-5.2 (seguimiento cliente · sin Stripe)  
**Fecha:** 2026-06-22

---

## 1. Resumen de cambios

El cliente autenticado puede ver y dar seguimiento a sus solicitudes de compra:

| Feature | Ruta / ubicación |
|---------|------------------|
| Lista de pedidos | `/cuenta/pedidos` |
| Detalle de pedido | `/cuenta/pedidos/[id]` |
| Tarjeta activa en cuenta | `/cuenta` → Pedidos (ya no “Pronto”) |
| Notificaciones | Badge en tarjeta + punto en icono cuenta (header) |
| Enlace header | “Mis pedidos” en menú de cuenta |

Estados con lenguaje claro para el cliente, mensaje de Radio Shalko (`customer_message`), bloque “Pago pendiente” preparado (botón deshabilitado), WhatsApp manual.

**Sin Stripe, sin email al cliente, sin cambios de RLS** (políticas existentes suficientes).

---

## 2. Archivos creados / modificados

### Creados

| Archivo | Propósito |
|---------|-----------|
| `src/lib/orders/customer-queries.ts` | Consultas y resumen de pedidos del cliente |
| `src/lib/orders/customer-status-labels.ts` | Labels y copy orientados al cliente |
| `src/components/account/customer-orders-list.tsx` | Lista y empty state |
| `src/components/account/customer-order-detail-view.tsx` | Detalle completo |
| `src/app/(site)/cuenta/pedidos/page.tsx` | Página lista |
| `src/app/(site)/cuenta/pedidos/[id]/page.tsx` | Página detalle |
| `SALES-5.2_REPORT.md` | Este documento |

### Modificados

| Archivo | Cambio |
|---------|--------|
| `src/app/(site)/cuenta/page.tsx` | Pedidos activo con resumen dinámico |
| `src/app/(site)/layout.tsx` | Resumen de atención para header |
| `src/components/site/header.tsx` | Punto discreto + enlace Mis pedidos |
| `src/lib/orders/admin-actions.ts` | `revalidatePath` de rutas `/cuenta/*` tras revisión admin |

---

## 3. Migración RLS

**No se creó migración.**

RLS existente en `20260526000000_orders.sql`:

- `orders_select_own` → `auth.uid() = user_id`
- `order_items_select_own` → vía pedido propio
- `order_status_history_select_own` → vía pedido propio

Las consultas del cliente **no seleccionan** `admin_internal_note` ni otros campos internos.

---

## 4. Cómo probar

### A. Sin pedidos

1. Login → `/cuenta/pedidos`
2. Ver empty state + “Explorar productos”

### B. Solicitud pending

1. Checkout → enviar solicitud
2. `/cuenta/pedidos` → “Solicitud recibida”
3. `/cuenta` → tarjeta Pedidos con “1 en revisión”

### C. Admin aprueba

1. Admin confirma disponibilidad (SALES-4)
2. Cliente refresca `/cuenta/pedidos`
3. Ver “Aprobado · esperando pago” + mensaje de Radio Shalko
4. Detalle: bloque “Pago pendiente” + botón “Pago aún no disponible”

### D. No disponible

1. Admin marca no disponible
2. Cliente ve “No disponible”

### E. Seguridad

1. Usuario A no accede al pedido de B (`404`)
2. Sin sesión → redirect `/login?next=/cuenta/pedidos`

### F. Header

1. Con pedido que requiere atención → punto en icono cuenta
2. Menú → “Mis pedidos”

### G. Build

```bash
npm run build
```

---

## 5. Resultado de `npm run build`

**Exit code: 0**

Rutas nuevas: `/cuenta/pedidos`, `/cuenta/pedidos/[id]`

---

## 6. Riesgos pendientes

| Riesgo | Nota |
|--------|------|
| Sin “visto/no visto” | Cancelados recientes cuentan en `hasAttention` 14 días; no hay migración de lectura |
| Cache cliente | Tras aprobación admin, cliente debe refrescar; se revalida `/cuenta` desde admin-actions |
| `product_images` | Thumbnails opcionales; placeholder si no hay imagen |
| Pedidos sin `user_id` legacy | No visibles al cliente (RLS) |

---

## 7. Qué queda para SALES-6

- **Stripe Payment Link** en bloque “Pago pendiente”
- Email al cliente con instrucciones de pago
- Webhooks → `payment_status = paid`
- Actualización automática de estado “Pagado” en `/cuenta/pedidos`
- Preparación / listo para recolección post-pago

---

## Criterios de aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1–5 | Cuenta activa, rutas, auth, solo propios | ✅ |
| 6–11 | Lista y detalle con snapshots y mensaje | ✅ |
| 12–14 | Estados correctos | ✅ |
| 15–17 | Sin pago real, sin Stripe, sin ops internas | ✅ |
| 18 | Build verde | ✅ |
