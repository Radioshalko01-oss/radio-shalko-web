# SALES-8 — Go-live controlado de Sales OS v1

**Proyecto:** Radio Shalko WEB  
**Fase:** SALES-8 (cierre gaps QA · documentación go-live)  
**Fecha:** 2026-06-22

---

## 1. Resumen de cambios

Preparación de Sales OS v1 para prueba real controlada:

| Área | Acción |
|------|--------|
| Notificaciones | `order_created` al checkout; `order_approved` al aprobar disponibilidad |
| Header admin | Indicador operativo (cola pendiente + aprobados sin pago), no pedidos personales |
| Migración | Tipo `order_created` en `customer_notifications` |
| Documentación | `GO_LIVE_CHECKLIST_RADIO_SHALKO.md`, `.env.example` ampliado |
| Copy | `payment_available` titulado “Pago disponible” (distinto de aprobación) |

Sin inventario, Sicar, envíos, push ni rediseño global.

---

## 2. Gaps cerrados (desde SALES-7.3 QA)

| Gap QA | Estado SALES-8 |
|--------|----------------|
| QA-2 Sin notificación al crear pedido | ✅ `order_created` en checkout |
| QA-3 `order_approved` no emitido | ✅ Al confirmar disponibilidad (aprobación) |
| QA-4 `hasOrderAttention` admin personal | ✅ `getAdminHeaderOrderAttention()` — cola operativa |
| QA-6 Cron documentado | ✅ Checklist + `.env.example` |
| Stripe E2E documentado | ✅ Checklist local + producción |
| Variables de entorno | ✅ `.env.example` + checklist §3 |

---

## 3. Archivos modificados / creados

### Creados

| Archivo | Propósito |
|---------|-----------|
| `supabase/migrations/20260533000000_customer_notifications_order_created.sql` | Tipo `order_created` en BD |
| `GO_LIVE_CHECKLIST_RADIO_SHALKO.md` | Checklist go-live completo |
| `SALES-8_REPORT.md` | Este documento |

### Modificados

| Archivo | Cambio |
|---------|--------|
| `src/lib/notifications/customer-notifications.ts` | Tipo `order_created`; copy `order_approved` / `payment_available` |
| `src/lib/orders/actions.ts` | Notificación al crear solicitud |
| `src/lib/orders/admin-actions.ts` | `order_approved` en revisión; título pago disponible |
| `src/lib/orders/notification-queries.ts` | `getAdminHeaderOrderAttention()` |
| `src/app/(site)/layout.tsx` | Header admin usa atención operativa |
| `.env.example` | Documentación variables ampliada |

---

## 4. Checklist de variables (sin valores reales)

Ver **`GO_LIVE_CHECKLIST_RADIO_SHALKO.md` §3** y **`.env.example`**.

**Requeridas para Sales OS completo:**

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`
- Cron: `CRON_SECRET` (si se usa recordatorio carrito)

**Opcionales:** `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_ORDER_NOTIFICATION_EMAIL`, `CUSTOMER_ORDER_EMAILS_ENABLED`

---

## 5. Cómo probar Stripe local

```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # de stripe listen
NEXT_PUBLIC_SITE_URL=http://localhost:3000

npm run dev

# Otra terminal
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Flujo: solicitud → admin aprueba → genera enlace → cliente paga con `4242 4242 4242 4242` → webhook marca `paid`.

La URL `?paid=success` **no** marca pagado; solo muestra banner de confirmación pendiente.

---

## 6. Cómo configurar Stripe producción

1. Dashboard → Webhooks → Add endpoint  
   `https://TU-DOMINIO.com/api/stripe/webhook`
2. Evento: `checkout.session.completed`
3. Copiar signing secret → `STRIPE_WEBHOOK_SECRET` en el host
4. `STRIPE_SECRET_KEY` test o live según entorno
5. `NEXT_PUBLIC_SITE_URL=https://TU-DOMINIO.com`

**Recomendación:** primera prueba en staging con keys **test** antes de live.

---

## 7. Cómo probar cron

```bash
# Sin secreto → 401 (verificado SALES-8)
curl -X POST http://localhost:3000/api/jobs/cart-reminders

# Con secreto
curl -X POST http://localhost:3000/api/jobs/cart-reminders \
  -H "Authorization: Bearer $CRON_SECRET"
```

Condiciones: carrito draft ≥2h inactivo, sin pedido reciente 24h, sin reminder previo 24h.

---

## 8. Resultado de `npm run build`

```
✓ Compiled successfully
✓ TypeScript OK
Exit code: 0
```

Cron sin auth: **401** confirmado en entorno local.

---

## 9. Riesgos pendientes

| Riesgo | Mitigación |
|--------|------------|
| Migración `20260533000000` no aplicada en prod | Aplicar antes de deploy (insert `order_created` fallará sin ella) |
| Webhook prod mal configurado | Seguir checklist §5; probar un pago test |
| Cron no programado | Recordatorios carrito no corren solos |
| Admin con pedidos personales | Seguir usando cuentas separadas operación vs compra |
| Cobros live prematuros | Prueba controlada en test mode primero |

---

## 10. Recomendación de siguiente fase

**SALES-9 — Prueba real en staging:**

1. Aplicar migraciones en Supabase staging.
2. Deploy con variables test.
3. Ejecutar checklist `GO_LIVE_CHECKLIST_RADIO_SHALKO.md` §16 (producto bajo riesgo).
4. Validar webhook en dominio público.
5. Solo entonces evaluar Stripe live y operación diaria.

**Fuera de alcance inmediato:** inventario automático, Sicar, envíos, rediseño global.

---

## Criterios de aceptación SALES-8

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Notificación al enviar solicitud | ✅ `order_created` |
| 2 | `order_approved` emitido | ✅ |
| 3 | Header admin no confunde pedidos personales | ✅ |
| 4–5 | Admin `/admin` · cliente `/cuenta` | ✅ (sin cambios regresivos) |
| 6 | Cron documentado | ✅ |
| 7–8 | Stripe + env documentados | ✅ |
| 9 | `GO_LIVE_CHECKLIST_RADIO_SHALKO.md` | ✅ |
| 10–12 | Sin inventario / Sicar / envíos | ✅ |
| 13 | Sales OS v1 intacto | ✅ |
| 14 | Build verde | ✅ |
