# SALES-5 — Notificaciones internas y alertas de solicitudes

**Proyecto:** Radio Shalko WEB  
**Fase:** SALES-5 (señales operativas · sin Stripe)  
**Fecha:** 2026-06-22

---

## 1. Resumen de cambios

Capa de **alertas internas** para que el admin detecte rápido qué pedidos requieren atención:

| Feature | Descripción |
|---------|-------------|
| **Badge sidebar** | Contador junto a “Pedidos” si hay `pending` + `unpaid` (oculto si 0) |
| **Alerta admin** | Banner discreto en todo `/admin`: “Tienes N solicitudes…” + botón Revisar pedidos |
| **Resumen operativo** | Cards en `/admin/pedidos`: pendientes, aprobados esperando pago, no disponibles, recientes (30 días) |
| **Priorización lista** | En filtro “Todos”: pendientes → aprobados sin pago → resto; más recientes primero |
| **Señales visuales** | Badge “Requiere revisión”; borde ámbar suave en tarjetas pendientes |
| **Filtro nuevo** | “Aprobados · esperando pago” (`confirmed` + `unpaid`) |
| **Email interno** | Capa preparada con Resend REST; activa solo con env vars |

**No incluido:** Stripe, webhooks, email al cliente, WhatsApp API, inventario.

---

## 2. Archivos creados / modificados

### Creados

| Archivo | Propósito |
|---------|-----------|
| `src/lib/orders/notification-queries.ts` | Contadores operativos admin |
| `src/lib/notifications/internal-order-email.ts` | Abstracción email admin (Resend) |
| `src/components/admin/admin-pending-orders-alert.tsx` | Banner alerta pendientes |
| `src/components/admin/orders-summary-cards.tsx` | Resumen en `/admin/pedidos` |
| `SALES-5_REPORT.md` | Este documento |

### Modificados

| Archivo | Cambio |
|---------|--------|
| `src/app/admin/layout.tsx` | Summary + alerta + badge sidebar |
| `src/app/admin/pedidos/page.tsx` | Resumen + filtros |
| `src/app/admin/page.tsx` | Acceso rápido a pedidos con conteo |
| `src/components/layout/admin-sidebar.tsx` | Badge numérico en Pedidos |
| `src/components/admin/orders-manager.tsx` | Filtro approved, prioridad visual |
| `src/lib/orders/admin-queries.ts` | Orden por prioridad, filtro approved |
| `src/lib/orders/status-labels.ts` | “Requiere revisión” en pendientes |
| `src/lib/orders/actions.ts` | Hook email post-checkout (no bloqueante) |
| `.env.example` | Variables opcionales de email |

**Migración:** ninguna.

---

## 3. Email real vs capa preparada

**Implementación:** capa **lista para envío real** vía [Resend REST API](https://resend.com/docs/api-reference/emails/send-email) (sin dependencia npm).

| Estado | Condición |
|--------|-----------|
| **No envía** (default) | Faltan variables de entorno |
| **Envía** | Las 3 variables configuradas correctamente |

Al crear solicitud desde checkout → `notifyAdminNewOrder()` en background (`void`). **Fallo de email no bloquea el pedido.**

No hay proveedor de email preinstalado en el proyecto; sin env vars el build y checkout funcionan igual.

---

## 4. Variables de entorno (opcionales)

```env
ADMIN_ORDER_NOTIFICATION_EMAIL=operaciones@tudominio.com
EMAIL_FROM=Radio Shalko <notificaciones@tudominio.com>
RESEND_API_KEY=re_xxxxxxxx
```

También se usa `NEXT_PUBLIC_SITE_URL` para el enlace al detalle en el email.

---

## 5. Cómo probar

### A. Sin pendientes

- Admin → sidebar sin badge en Pedidos
- Sin banner ámbar en admin

### B. Con solicitud pendiente

1. Checkout → enviar solicitud
2. Admin → badge “1” en Pedidos
3. Banner: “Tienes 1 solicitud pendiente…”
4. `/admin/pedidos` → resumen + tarjeta arriba con “Requiere revisión”

### C. Tras aprobar (SALES-4)

- Sale del conteo pendiente
- Lista: “Aprobado · esperando pago”
- Filtro “Aprobados · esperando pago”

### D. No disponible

- “No disponible” en badge
- No cuenta como pendiente

### E. Email (opcional)

1. Configurar las 3 variables + dominio verificado en Resend
2. Crear solicitud desde checkout
3. Verificar bandeja `ADMIN_ORDER_NOTIFICATION_EMAIL`

### F. Seguridad

- Usuario no admin: sin acceso a `/admin`

### G. Build

```bash
npm run build
```

---

## 6. Resultado de `npm run build`

**Exit code: 0**

---

## 7. Riesgos pendientes

| Riesgo | Nota |
|--------|------|
| Prioridad en lista | Con >300 pedidos y filtro “Todos”, orden por prioridad usa límite en memoria |
| Email sin dominio Resend | Envío fallará con log; pedido OK |
| Alerta en todas las páginas admin | Intencional; desaparece al no haber pendientes |
| Sin push/real-time | Admin debe refrescar o reentrar; no hay websockets |

---

## 8. Qué queda para SALES-6

- **Stripe Payment Link** tras aprobación
- Email al **cliente** (instrucciones de pago)
- Webhooks de pago
- “Mis pedidos” del cliente
- Notificaciones push / realtime (opcional)
- Cola de preparación post-pago

---

## Criterios de aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1–2 | Badge pendientes / oculto si 0 | ✅ |
| 3 | Resumen operativo | ✅ |
| 4 | Pendientes primero | ✅ |
| 5–7 | Etiquetas Requiere revisión / Aprobado / No disponible | ✅ |
| 8–9 | Alerta admin / no visible público | ✅ |
| 10–12 | Sin Stripe / webhooks / email cliente | ✅ |
| 13–14 | Email opcional, no bloquea pedido | ✅ |
| 15 | Build verde | ✅ |
