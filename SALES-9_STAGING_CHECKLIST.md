# SALES-9 — Checklist staging · Radio Shalko Sales OS v1

**Proyecto:** Radio Shalko WEB (independiente — no SEEDIS)  
**Modo de pago:** Stripe **test** únicamente — no activar live en esta fase  
**Supabase:** proyecto `actxvfjtejmpkjernvtw` · `https://actxvfjtejmpkjernvtw.supabase.co`

> **Dominio staging:** sustituir `https://TU-DOMINIO-STAGING` por la URL real del deploy (Vercel u otro).  
> No usar `localhost` en variables del entorno staging.  
> Al momento de SALES-9 el deploy staging puede estar pendiente — configurar antes de la prueba E2E.

---

## A. Pre-requisitos deploy

- [ ] App desplegada en URL HTTPS pública (`TU-DOMINIO-STAGING`)
- [ ] `npm run build` verde en el commit desplegado
- [ ] Rama/commit documentado en `SALES-9_REPORT.md`

---

## B. Migraciones Supabase

Aplicar en orden (si falta alguna):

| Migración | Contenido Sales OS |
|-----------|-------------------|
| `20260526000000_orders.sql` | Pedidos base |
| `20260527000000_order_checkout.sql` | RPC checkout |
| `20260528000000_order_checkout_auth_only.sql` | Solo autenticados |
| `20260529000000_order_availability_review.sql` | Revisión disponibilidad |
| `20260530000000_order_stripe_checkout.sql` | Campos Stripe |
| `20260531000000_order_fulfillment_pickup.sql` | Preparación / recoger |
| `20260532000000_customer_notifications.sql` | Notificaciones |
| `20260533000000_customer_notifications_order_created.sql` | Tipo `order_created` |

### Verificar remotamente

```bash
SUPABASE_ACCESS_TOKEN=sbp_... node scripts/verify-sales-os-migrations.mjs
```

O aplicar todas:

```bash
SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-supabase-migrations.mjs
```

- [ ] Script `verify-sales-os-migrations.mjs` exit 0
- [ ] Especialmente: constraint incluye `order_created`

---

## C. Variables de entorno (staging)

Configurar en el panel del host **sin commitear valores**.

### Supabase (requeridas)

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Radio Shalko |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role — solo servidor |

### Stripe test (requeridas para pago)

| Variable | Descripción |
|----------|-------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` — modo test |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` del **endpoint staging en Dashboard** (no CLI local) |
| `NEXT_PUBLIC_SITE_URL` | `https://TU-DOMINIO-STAGING` — sin barra final |

### Cron (recomendado)

| Variable | Descripción |
|----------|-------------|
| `CRON_SECRET` | Secreto aleatorio para `/api/jobs/cart-reminders` |

### Email (opcional)

| Variable | Descripción |
|----------|-------------|
| `CUSTOMER_ORDER_EMAILS_ENABLED` | `true` para emails cliente |
| `RESEND_API_KEY` | API Resend |
| `EMAIL_FROM` | Remitente verificado |
| `ADMIN_ORDER_NOTIFICATION_EMAIL` | Alertas pedido nuevo al admin |

- [ ] `NEXT_PUBLIC_SITE_URL` ≠ `localhost`
- [ ] `STRIPE_SECRET_KEY` empieza con `sk_test_` (no `sk_live_`)
- [ ] Ningún secreto en git

---

## D. Stripe webhook (staging · modo test)

1. [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks) → **Test mode** activo  
2. Add endpoint:

   ```
   https://TU-DOMINIO-STAGING/api/stripe/webhook
   ```

3. Evento: **`checkout.session.completed`**
4. Copiar **Signing secret** → `STRIPE_WEBHOOK_SECRET` en staging
5. **No** reutilizar el `whsec_` de `stripe listen` (solo localhost)

### Validación post-pago

En Supabase → `orders`:

- [ ] `payment_status` = `paid`
- [ ] `stripe_paid_at` poblado
- [ ] `stripe_payment_intent_id` poblado

La URL de retorno `?paid=success` **no** debe marcar pagado por sí sola.

---

## E. Google Auth / Supabase

En [Supabase → Authentication → URL Configuration](https://supabase.com/dashboard/project/actxvfjtejmpkjernvtw/auth/url-configuration):

| Campo | Valor staging |
|-------|---------------|
| Site URL | `https://TU-DOMINIO-STAGING` |
| Redirect URLs | `https://TU-DOMINIO-STAGING/auth/callback` |
| Redirect URLs | `https://TU-DOMINIO-STAGING/**` (si aplica wildcard) |

Google Cloud Console → OAuth client:

- [ ] Authorized JavaScript origins incluye `https://TU-DOMINIO-STAGING`
- [ ] Authorized redirect URIs incluye callback Supabase (`https://actxvfjtejmpkjernvtw.supabase.co/auth/v1/callback`)

Prueba:

- [ ] Login Google en staging funciona
- [ ] Usuario admin tiene `profiles.role = 'admin'`

---

## F. Cron carrito

```bash
# Debe fallar
curl -X POST https://TU-DOMINIO-STAGING/api/jobs/cart-reminders
# → 401

# Debe responder ok (con CRON_SECRET del entorno staging)
curl -X POST https://TU-DOMINIO-STAGING/api/jobs/cart-reminders \
  -H "Authorization: Bearer TU_CRON_SECRET"
# → {"ok":true,"scanned":...}
```

Reglas del job:

- Carrito draft inactivo ≥ 2 h
- Sin pedido del usuario en 24 h
- Máximo 1 reminder / 24 h por usuario

**Programación:** documentar en runbook interno. No añadir `vercel.json` cron sin confirmar proveedor.

---

## G. Producto de prueba

En `/admin/productos` crear o usar producto de **bajo riesgo**:

| Campo | Recomendación |
|-------|---------------|
| Nombre | `[STAGING] Producto prueba Sales OS` |
| Precio | Bajo (ej. $10–$99 MXN) |
| Estado | Publicado |
| Imagen | Al menos una válida |
| Categoría / marca | Activas |

- [ ] Producto visible en `/productos`
- [ ] No usar producto caro ni stock crítico

---

## H. Prueba E2E staging (26 pasos)

### Cliente

| # | Paso | OK |
|---|------|-----|
| 1 | Iniciar sesión Google | ☐ |
| 2 | Agregar producto de prueba | ☐ |
| 3 | Ver carrito | ☐ |
| 4 | Enviar solicitud (checkout) | ☐ |
| 5 | Notificación **Solicitud recibida** (`order_created`) | ☐ |
| 6 | Pedido en `/cuenta/pedidos` | ☐ |

### Admin

| # | Paso | OK |
|---|------|-----|
| 7 | `/admin/pedidos` — ver solicitud | ☐ |
| 8 | Aprobar disponibilidad | ☐ |
| 9 | Cliente recibe **Tu solicitud fue aprobada** (`order_approved`) | ☐ |
| 10 | Generar enlace Stripe | ☐ |
| 11 | Cliente recibe **Pago disponible** (`payment_available`) | ☐ |

### Cliente (pago)

| # | Paso | OK |
|---|------|-----|
| 12 | Abrir detalle pedido | ☐ |
| 13 | **Pagar ahora** | ☐ |
| 14 | Tarjeta test `4242 4242 4242 4242` | ☐ |
| 15 | Volver al sitio (`?paid=success`) | ☐ |
| 16 | Pedido aún unpaid hasta webhook (banner “confirmando”) | ☐ |
| 17 | Webhook marca `paid` en Supabase | ☐ |
| 18 | Notificación **Pago confirmado** | ☐ |

### Admin (fulfillment)

| # | Paso | OK |
|---|------|-----|
| 19 | Ver pedido pagado en admin | ☐ |
| 20 | Marcar preparando | ☐ |
| 21 | Cliente notificado preparación | ☐ |
| 22 | Marcar listo para recoger + mensaje/hora | ☐ |
| 23 | Cliente notificado listo | ☐ |
| 24 | Marcar entregado | ☐ |
| 25 | Estado final entregado (cliente + admin) | ☐ |
| 26 | Sin acciones inválidas post-entrega | ☐ |

---

## I. Seguridad

| # | Verificación | OK |
|---|--------------|-----|
| 1 | Cliente no accede `/admin` | ☐ |
| 2 | Admin redirect `/cuenta/pedidos` → `/admin/pedidos` | ☐ |
| 3 | Cliente no ve pedidos ajenos | ☐ |
| 4 | Cliente no ve notificaciones ajenas | ☐ |
| 5 | Cron sin secreto → 401 | ☐ |
| 6 | Webhook firma inválida → 400 | ☐ |
| 7 | Sin copy interno (bodega, stock exacto, traslado) en vistas cliente | ☐ |

---

## J. Build local (pre-deploy)

```bash
npm run build
# exit 0
```

- [ ] Build verde

---

## K. Criterio “listo para prueba real limitada”

Todos los ítems **A–I** marcados + E2E **H** completo en staging con Stripe **test**.

**No activar Stripe live** hasta repetir este checklist en dominio de producción con sign-off operativo.

---

## Referencias

- `GO_LIVE_CHECKLIST_RADIO_SHALKO.md` — go-live general
- `SALES-8_REPORT.md` — gaps cerrados pre-staging
- `scripts/verify-sales-os-migrations.mjs` — verificación schema
