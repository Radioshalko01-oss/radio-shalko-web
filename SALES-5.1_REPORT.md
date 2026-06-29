# SALES-5.1 — Pulido Admin Pedidos, alertas y navegación

**Proyecto:** Radio Shalko WEB  
**Fase:** SALES-5.1 (UX admin · sin Stripe)  
**Fecha:** 2026-06-22

---

## 1. Resumen de cambios

Corrección fina del panel admin antes de Stripe:

- **Visual:** eliminados contornos y fondos ámbar dominantes; diseño neutral zinc/blanco
- **Estados:** badges sobrios compartidos vía `orderStatusBadgeClass()`
- **Labels:** `pending + unpaid` → “Pendiente de revisión”
- **Cache:** `revalidatePath("/admin", "layout")` tras decisión SALES-4 → badge/banner se actualizan al volver
- **Sidebar:** oculto “Solicitudes / Carritos” (ruta `/admin/cotizaciones` sigue existiendo)
- **Espaciado:** resumen, filtros y lista más compactos y alineados

Sin cambios de lógica de negocio, Stripe ni migraciones.

---

## 2. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/lib/orders/status-labels.ts` | Badges neutros centralizados; label pendiente |
| `src/lib/orders/admin-actions.ts` | Revalidación layout admin |
| `src/components/admin/admin-pending-orders-alert.tsx` | Banner zinc (sin ámbar) |
| `src/components/admin/orders-summary-cards.tsx` | Cards uniformes, sin highlight ámbar |
| `src/components/admin/orders-manager.tsx` | Tarjetas neutras, badges sobrios, espaciado |
| `src/components/admin/order-detail-view.tsx` | Badges y hints neutros |
| `src/components/admin/order-availability-review.tsx` | Nota interna neutra |
| `src/components/layout/admin-sidebar.tsx` | Sin cotizaciones; badge zinc/negro |
| `src/app/admin/pedidos/page.tsx` | Espaciado título |
| `SALES-5.1_REPORT.md` | Este documento |

---

## 3. Borde amarillo

**Antes:** cards de resumen, pedidos y banner con `border-amber-*`, `ring-amber-*`.

**Ahora:**
- Todas las cards: `border-zinc-200`, hover `border-zinc-300`
- Banner: `bg-zinc-50/80 border-zinc-200`
- Badge sidebar: pill `bg-zinc-900 text-white` (discreto)
- Status badges: `bg-zinc-100 text-zinc-700` (pending/approved/cancelled sobrios)
- Solo “Pagado” mantiene verde suave

---

## 4. Banner / badge y contador

**Conteo:** sigue siendo `status = pending` AND `payment_status = unpaid` (sin cambio).

**Actualización tras decisión:**
- `submitOrderAvailabilityReview` ahora también ejecuta:
  - `revalidatePath("/admin", "layout")`
  - `revalidatePath("/admin")`
- En detalle: `router.refresh()` tras guardar (sin redirección automática, para permitir WhatsApp post-aprobación)

Al navegar de vuelta a `/admin/pedidos` o cualquier ruta admin, layout recarga contadores y el banner desaparece si `pendingCount = 0`.

---

## 5. “Solicitudes / Carritos”

- **Removido del sidebar** en grupo Ventas
- **Ruta intacta:** `/admin/cotizaciones` accesible por URL directa
- **Código intacto:** sin borrar archivos
- **Carrito tienda** (`/carrito`) permanece — flujo distinto a Pedidos

Orden Ventas en sidebar: Carrito tienda → Pedidos → Clientes (pronto)

---

## 6. Resultado de `npm run build`

**Exit code: 0**

---

## 7. Riesgos pendientes

| Riesgo | Nota |
|--------|------|
| Banner en detalle tras aprobar | Si el admin permanece en detalle, el banner del layout se actualiza con `router.refresh()`; si no refresca, puede ver contador viejo hasta navegar |
| Cotizaciones legacy | Accesible solo por URL; considerar deprecar en fase futura |
| Sin “visto/no visto” | No implementado (por diseño); solo pending real |

---

## 8. Qué queda para SALES-6

- Stripe Payment Link tras aprobación
- Email al cliente con instrucciones de pago
- Webhooks de pago
- “Mis pedidos” del cliente

---

## Criterios de aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Sin borde amarillo dominante | ✅ |
| 2 | Pendientes sobrios con badge | ✅ |
| 3–5 | Banner/badge actualizados post-decisión | ✅ |
| 6 | Cotizaciones fuera del sidebar | ✅ |
| 7–9 | Pedidos lista/detalle OK, SALES-4 intacto | ✅ |
| 10–11 | Sin Stripe, build verde | ✅ |
