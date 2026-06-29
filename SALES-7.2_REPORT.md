# SALES-7.2 — Centro de notificaciones del cliente + recordatorios de carrito

**Proyecto:** Radio Shalko WEB  
**Fase:** SALES-7.2 (comunicación in-app · sin WhatsApp API)  
**Fecha:** 2026-06-22

---

## 1. Resumen de cambios

Canal principal de comunicación al cliente dentro de la web:

| Canal | Qué hace |
|-------|----------|
| `customer_notifications` | Tabla persistente de avisos por usuario |
| `/cuenta/notificaciones` | Centro de notificaciones con marcar leídas |
| Header / cuenta | Contador discreto de no leídas |
| Eventos automáticos | Pago, preparación, listo, entregado |
| Job carrito | Recordatorio tras abandono (cron protegido) |
| Email opcional | Resend si está configurado |

WhatsApp queda como respaldo manual; el cliente se entera en su cuenta.

---

## 2. Archivos creados / modificados

### Creados

| Archivo | Propósito |
|---------|-----------|
| `supabase/migrations/20260532000000_customer_notifications.sql` | Tabla + RLS |
| `src/lib/notifications/customer-notifications.ts` | Helper crear notificaciones |
| `src/lib/notifications/customer-notification-queries.ts` | Lectura y resumen |
| `src/lib/notifications/notification-actions.ts` | Marcar leídas |
| `src/lib/notifications/customer-email-events.ts` | Emails opcionales extra |
| `src/lib/notifications/cart-reminder-job.ts` | Lógica recordatorio carrito |
| `src/app/api/jobs/cart-reminders/route.ts` | Endpoint cron |
| `src/components/account/customer-notifications-list.tsx` | UI lista |
| `src/app/(site)/cuenta/notificaciones/page.tsx` | Página notificaciones |
| `SALES-7.2_REPORT.md` | Este documento |

### Modificados

| Archivo | Cambio |
|---------|--------|
| `src/lib/orders/admin-actions.ts` | Notificaciones en pago/preparación/entrega |
| `src/lib/stripe/process-payment-webhook.ts` | Notificación + email pago confirmado |
| `src/app/(site)/layout.tsx` | Resumen notificaciones + contador carrito |
| `src/components/site/header.tsx` | Enlace Notificaciones + badges |
| `src/app/(site)/cuenta/page.tsx` | Tarjetas Notificaciones y carrito dinámico |
| `src/types/database.generated.ts` | Tipos `customer_notifications` |
| `.env.example` | `CRON_SECRET` |

---

## 3. Migración creada

**Nombre:** `supabase/migrations/20260532000000_customer_notifications.sql`

Tabla `customer_notifications` con tipos:
- `payment_available`, `payment_confirmed`, `order_preparing`, `order_ready_for_pickup`, `order_delivered`, `cart_reminder`, `order_approved`

RLS:
- SELECT propias
- UPDATE `read_at` propias
- INSERT solo servidor (service role)

---

## 4. Variables nuevas requeridas

| Variable | Requerida | Uso |
|----------|-----------|-----|
| `CRON_SECRET` | Para job carrito | Protege `/api/jobs/cart-reminders` |

Opcionales (email, ya existentes):
- `CUSTOMER_ORDER_EMAILS_ENABLED=true`
- `RESEND_API_KEY`
- `EMAIL_FROM`

---

## 5. Cómo aplicar migración

```bash
npm run db:migrate
```

---

## 6. Cómo probar notificaciones

1. Aplicar migración.
2. Login como cliente con pedido.
3. Admin genera enlace Stripe → cliente ve badge en cuenta.
4. `/cuenta/notificaciones` → “Tu pedido fue aprobado”.
5. Pagar con Stripe test → “Pago confirmado”.
6. Admin: preparando → listo → entregado → cada paso crea notificación.
7. Clic en notificación → marca leída y navega al pedido.
8. “Marcar todas como leídas” limpia contador.

---

## 7. Cómo probar recordatorio de carrito

1. Usuario autenticado con productos en carrito (draft quote).
2. Esperar 2+ horas sin actividad en carrito (`quotes.updated_at`), o ajustar temporalmente `CART_STALE_HOURS` en dev.
3. Configurar `CRON_SECRET` en `.env.local`.
4. Ejecutar:

```bash
curl -X POST http://localhost:3000/api/jobs/cart-reminders \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

5. Debe crear notificación `cart_reminder` (máx. 1 cada 24h por usuario).
6. Repetir → debe omitir duplicado.

**Cron sugerido (Vercel, opcional):**

```json
{
  "crons": [{ "path": "/api/jobs/cart-reminders", "schedule": "0 14 * * *" }]
}
```

Documentar en despliegue; no incluido automáticamente en repo.

---

## 8. Resultado de `npm run build`

**Exit code: 0**

Rutas nuevas: `/cuenta/notificaciones`, `/api/jobs/cart-reminders`

---

## 9. Riesgos pendientes

| Riesgo | Nota |
|--------|------|
| Carrito solo en Supabase si autenticado | Invitados usan localStorage; sin recordatorio |
| Abandono 2h | Umbral configurable en `cart-reminder-job.ts` |
| Sin push navegador | Solo in-app + email opcional |
| Duplicados | Se evitan no leídas del mismo type+order |

---

## 10. Qué queda para la siguiente fase

- Push notifications del navegador
- Inventario automático al entregar (SALES-8)
- Regeneración Stripe expirado
- Dashboard admin de comunicaciones
- WhatsApp API (si se decide más adelante)

---

## Criterios de aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1–6 | Tabla, RLS, contador, página, marcar leídas | ✅ |
| 7–12 | Eventos automáticos con enlaces | ✅ |
| 13–15 | Email opcional, carrito, cron protegido | ✅ |
| 16–19 | Sin WhatsApp API/push, build verde | ✅ |
