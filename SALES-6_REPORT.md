# SALES-6 — Stripe Checkout después de aprobación + pago visible para el cliente

**Proyecto:** Radio Shalko WEB  
**Fase:** SALES-6 (pago Stripe post-aprobación admin)  
**Fecha:** 2026-06-22

---

## 1. Resumen de cambios

Integración de **Stripe Checkout Session** para pedidos aprobados (`confirmed` + `unpaid`):

| Capa | Qué hace |
|------|----------|
| Admin | Genera enlace de pago, copia, abre, envía WhatsApp manual |
| Cliente | Ve “Pagar ahora” en `/cuenta/pedidos/[id]` cuando existe URL |
| Webhook | `checkout.session.completed` → `payment_status = paid` |
| Email | Opcional vía Resend al generar enlace |

**Reglas respetadas:**
- Pago solo después de aprobación admin
- No se marca pagado desde frontend (`?paid=success` solo muestra mensaje de espera)
- Webhook verifica firma y metadata
- Reutiliza URL existente si el pedido sigue unpaid
- Secrets solo en servidor

---

## 2. Archivos creados / modificados

### Creados

| Archivo | Propósito |
|---------|-----------|
| `supabase/migrations/20260530000000_order_stripe_checkout.sql` | Columnas Stripe en `orders` |
| `src/lib/stripe/client.ts` | Cliente Stripe servidor |
| `src/lib/stripe/checkout.ts` | Validación + creación de Checkout Session |
| `src/lib/stripe/process-payment-webhook.ts` | Procesamiento idempotente del webhook |
| `src/app/api/stripe/webhook/route.ts` | Endpoint webhook |
| `src/lib/notifications/customer-payment-email.ts` | Email opcional al cliente |
| `src/components/admin/order-payment-section.tsx` | UI admin “Pago” |
| `SALES-6_REPORT.md` | Este documento |

### Modificados

| Archivo | Cambio |
|---------|--------|
| `package.json` / `package-lock.json` | Dependencia `stripe` |
| `src/lib/orders/admin-actions.ts` | `createStripeCheckoutForOrder` |
| `src/lib/orders/admin-queries.ts` | Campos Stripe en consultas admin |
| `src/lib/orders/customer-queries.ts` | Campos Stripe + resumen `paymentAvailableCount` |
| `src/lib/orders/status-labels.ts` | “Pago disponible”, WhatsApp con enlace |
| `src/lib/orders/customer-status-labels.ts` | Estados cliente con enlace de pago |
| `src/components/admin/order-detail-view.tsx` | Sección Pago |
| `src/components/admin/orders-manager.tsx` | Badge “Pago disponible” en lista |
| `src/components/account/customer-order-detail-view.tsx` | Bloques de pago + `?paid=` |
| `src/components/account/customer-orders-list.tsx` | Estado con enlace |
| `src/app/(site)/cuenta/pedidos/[id]/page.tsx` | Query param `paid` |
| `src/app/(site)/cuenta/page.tsx` | Badge por `paymentAvailableCount` |
| `src/types/database.generated.ts` | Tipos Stripe |
| `.env.example` | Variables Stripe y email cliente |

---

## 3. Migración creada

**Nombre:** `supabase/migrations/20260530000000_order_stripe_checkout.sql`

Columnas agregadas a `orders`:
- `stripe_checkout_session_id`
- `stripe_payment_intent_id`
- `stripe_payment_url`
- `stripe_payment_created_at`
- `stripe_paid_at`
- `payment_requested_at`
- `payment_requested_by`
- `payment_provider` (default `'stripe'`)

Sin cambios RLS: el cliente lee sus propios pedidos (incluye URL) vía `orders_select_own`.

---

## 4. Variables de entorno requeridas

| Variable | Requerida | Uso |
|----------|-----------|-----|
| `STRIPE_SECRET_KEY` | Para generar pagos | Solo servidor |
| `STRIPE_WEBHOOK_SECRET` | Para webhook | Solo servidor |
| `NEXT_PUBLIC_SITE_URL` | Redirects success/cancel | Público (URL del sitio) |
| `SUPABASE_SERVICE_ROLE_KEY` | Webhook update | Solo servidor (ya existía) |

**Opcionales (email cliente):**

| Variable | Valor |
|----------|-------|
| `RESEND_API_KEY` | API key Resend |
| `EMAIL_FROM` | Remitente verificado |
| `CUSTOMER_ORDER_EMAILS_ENABLED` | `true` para activar |

El build **no falla** si faltan variables Stripe.

---

## 5. Cómo aplicar migración

```bash
npm run db:migrate
```

O aplicar manualmente el SQL en Supabase Dashboard → SQL Editor.

---

## 6. Cómo configurar Stripe test mode

1. Crear cuenta en [Stripe Dashboard](https://dashboard.stripe.com).
2. Activar **Test mode**.
3. Copiar **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`.
4. Configurar `NEXT_PUBLIC_SITE_URL` (ej. `http://localhost:3000`).
5. Para webhook local, usar [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copiar el `whsec_...` que imprime → `STRIPE_WEBHOOK_SECRET`.

6. En Stripe Dashboard → Webhooks (producción): endpoint  
   `https://tudominio.com/api/stripe/webhook`  
   Evento: `checkout.session.completed`.

---

## 7. Cómo probar generación de enlace

1. Aplicar migración.
2. Configurar `STRIPE_SECRET_KEY` y `NEXT_PUBLIC_SITE_URL`.
3. Login admin → pedido `confirmed` + `unpaid`.
4. En detalle, sección **Pago** → **Generar enlace de pago**.
5. Verificar que se guarda `stripe_payment_url` en Supabase.
6. Presionar de nuevo → debe **reutilizar** la misma URL.
7. Cliente en `/cuenta/pedidos/[id]` → botón **Pagar ahora**.

**Sin `STRIPE_SECRET_KEY`:** admin ve error controlado al generar.

**Pedido `pending`:** no aparece sección de generar pago útil (solo aprobados/pagados).

---

## 8. Cómo probar webhook

1. Configurar `STRIPE_WEBHOOK_SECRET` (Stripe CLI en local).
2. Completar pago test en Checkout (tarjeta `4242 4242 4242 4242`).
3. Verificar evento `checkout.session.completed`.
4. En Supabase: `payment_status = paid`, `stripe_paid_at` poblado.
5. Cliente refresca → “Pago confirmado”.
6. Repetir evento → webhook responde 200 sin duplicar (idempotente).

**Firma inválida:** webhook responde 400.

---

## 9. Resultado de `npm run build`

**Exit code: 0**

Ruta nueva: `/api/stripe/webhook`

---

## 10. Riesgos pendientes

| Riesgo | Nota |
|--------|------|
| Sesión expirada | No se regenera automáticamente; reutiliza URL existente |
| Webhook local | Requiere Stripe CLI o túnel |
| Email cliente | Opcional; el flujo no depende de él |
| `?paid=success` | No marca pagado; puede haber delay de segundos |
| Moneda MXN | Precios BD en pesos enteros → Stripe en centavos (×100) |

---

## 11. Qué queda para SALES-7

- **Preparación** del pedido (`fulfillment_status = preparing`)
- **Listo para recoger** (`ready_for_pickup`)
- Notificación al cliente cuando esté listo
- Decremento de inventario (si aplica)
- Regeneración de enlace si sesión Stripe expiró
- Manejo opcional de `checkout.session.expired` / `payment_intent.payment_failed`

---

## Criterios de aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1–7 | Stripe servidor, admin only, estados válidos | ✅ |
| 8–11 | Session MXN, snapshots, IDs guardados | ✅ |
| 12–14 | Cliente “Pagar ahora”, admin copiar/WhatsApp | ✅ |
| 15–17 | Webhook firma, paid, idempotente | ✅ |
| 18–22 | No frontend paid, email opcional, build verde | ✅ |
