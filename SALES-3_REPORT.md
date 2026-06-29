# SALES-3 — Panel admin de solicitudes de compra

**Proyecto:** Radio Shalko WEB  
**Fase:** SALES-3 (solo visibilidad administrativa)  
**Fecha:** 2026-06-22

---

## 1. Resumen de cambios

Se implementó el panel administrativo **`/admin/pedidos`** para revisar solicitudes de compra creadas desde el checkout (SALES-2). Es **solo lectura**: no aprueba, no rechaza, no genera Stripe, no cambia estados ni envía emails.

Incluye:

- Lista en tarjetas operativas (no tabla genérica)
- Búsqueda por número de pedido, nombre, teléfono y correo
- Filtros: Todos, Pendientes de revisión, Chalco, Amecameca, Pagados, Cancelados
- Detalle en **`/admin/pedidos/[id]`** con cliente, recolección, productos (snapshots), resumen, notas e historial
- Acciones: copiar teléfono, copiar número de pedido, abrir WhatsApp manual (`wa.me`)
- Estados UI: “Pendiente de revisión” para `pending` + `unpaid`
- Protección admin existente (`requireAdmin` en layout + queries)
- Entrada activa en sidebar admin (sin badge “Pronto”)

**Migración:** ninguna. RLS existente (`orders_select_admin`, `order_items_select_admin`, `order_status_history_select_admin`) ya permite lectura admin.

---

## 2. Archivos creados / modificados

### Creados

| Archivo | Propósito |
|---------|-----------|
| `src/app/admin/pedidos/page.tsx` | Lista de pedidos |
| `src/app/admin/pedidos/[id]/page.tsx` | Detalle de pedido |
| `src/components/admin/orders-manager.tsx` | UI lista, búsqueda, filtros, paginación |
| `src/components/admin/order-detail-view.tsx` | Vista detalle (server-friendly) |
| `src/components/admin/order-detail-actions.tsx` | Copiar + WhatsApp (client) |
| `src/lib/orders/admin-queries.ts` | Consultas Supabase admin-only |
| `src/lib/orders/status-labels.ts` | Etiquetas UI, microcopy sucursal, mensaje WA |
| `SALES-3_REPORT.md` | Este documento |

### Modificados

| Archivo | Cambio |
|---------|--------|
| `src/components/layout/admin-sidebar.tsx` | Pedidos activo con icono `ClipboardList` |

---

## 3. Migración

**No se creó migración.**

Las políticas RLS de `20260526000000_orders.sql` ya cubren lectura admin vía `is_admin()`.

---

## 4. Cómo probar

### A. Admin

1. Iniciar sesión como admin.
2. Ir a **`/admin/pedidos`** (o sidebar → Pedidos).
3. Verificar lista de solicitudes reales del checkout.
4. Buscar por número de pedido (ej. `RS-2026-…`).
5. Filtrar **Chalco** / **Amecameca** / **Pendientes de revisión**.
6. Clic **Ver detalle** → `/admin/pedidos/[id]`.
7. Revisar productos (precios/nombres desde `order_items` snapshot).
8. **Copiar teléfono**, **Copiar número de pedido**, **Abrir WhatsApp**.

### B. No admin

1. Usuario sin rol admin → `/admin/pedidos` debe redirigir/bloquear (mismo patrón que resto de `/admin`).

### C. Pedido nuevo

1. Login → checkout → enviar solicitud (Chalco o Amecameca).
2. Refrescar `/admin/pedidos` → debe aparecer con estado “Pendiente de revisión”.

### D. Datos

- Total en lista = total en detalle = suma de snapshots.
- Sucursal coincide con `branch_id` / `branches.slug`.
- Resumen indica: “El pago aún no ha sido solicitado.”

### E. Build

```bash
npm run build
```

---

## 5. Resultado de `npm run build`

**Exit code: 0** (TypeScript OK, rutas generadas incl. `/admin/pedidos` y `/admin/pedidos/[id]`).

---

## 6. Riesgos pendientes

| Riesgo | Notas |
|--------|-------|
| Sin pedidos en DB | Empty state normal hasta primer checkout en prod |
| Imágenes de producto | Se enriquecen desde `product_images`; si el producto ya no tiene imagen, se muestra placeholder |
| Teléfono WhatsApp | Normalización MX (`52` + 10 dígitos); números mal formateados pueden no abrir WA |
| Filtro sucursal | Depende de `branches.slug` = `chalco` / `amecameca` |
| Historial vacío | Fallback: “Solicitud recibida” con `orders.created_at` |
| Errores Supabase | Lista muestra banner de error; no hay retry automático |

---

## 7. Qué queda para SALES-4+

- Aprobar / rechazar solicitud
- Confirmar disponibilidad por línea
- Generar link Stripe tras aprobación
- Cambiar estados (`orders`, `payment_status`, `fulfillment_status`)
- Notificaciones (email / WhatsApp API)
- “Mis pedidos” del cliente
- Decremento de inventario al confirmar
- Cola de preparación / listo para recolección
- Migración formal de estados del Sales OS

---

## Criterios de aceptación SALES-3

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Existe `/admin/pedidos` | ✅ |
| 2 | Solo admin | ✅ |
| 3 | Solicitudes reales del checkout | ✅ |
| 4–10 | Datos lista (número, cliente, contacto, sucursal, total, productos, estado) | ✅ |
| 11–12 | Búsqueda y filtros | ✅ |
| 13–15 | Detalle con snapshots y total | ✅ |
| 16–17 | WhatsApp manual + copiar teléfono | ✅ |
| 18–21 | Sin aprobar / Stripe / estados / ops internas | ✅ |
| 22 | Build verde | ✅ |
