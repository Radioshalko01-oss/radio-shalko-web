# Go-live controlado — Radio Shalko Sales OS v1

**Proyecto:** Radio Shalko WEB (independiente — no SEEDIS)  
**Alcance:** Sales OS v1 · solicitud → pago Stripe → recolección en tienda  
**Última actualización:** SALES-8

Usa este documento antes de staging o producción real. **No incluyas secretos** en tickets, commits ni capturas.

---

## 1. Proyecto Supabase correcto

- [ ] Confirmar que `.env.local` apunta al proyecto **Radio Shalko**, no a otro tenant.
- [ ] Verificar `NEXT_PUBLIC_SUPABASE_URL` en [Supabase Dashboard → Settings → API](https://supabase.com/dashboard).
- [ ] Confirmar que Google OAuth está configurado en Authentication → Providers.
- [ ] Al menos un usuario con `profiles.role = 'admin'` para operación.

---

## 2. Migraciones

Aplicar todas las migraciones en orden:

```bash
# Desde el repo (si usas el script del proyecto)
node scripts/apply-supabase-migrations.mjs

# O manualmente en SQL Editor / supabase db push
```

Migraciones Sales OS relevantes:

| Archivo | Contenido |
|---------|-----------|
| `20260526000000_orders.sql` | Pedidos base |
| `20260527000000_order_checkout.sql` | RPC checkout |
| `20260528000000_order_checkout_auth_only.sql` | Solo autenticados |
| `20260530000000_order_stripe_checkout.sql` | Campos Stripe |
| `20260531000000_order_fulfillment_pickup.sql` | Preparación / recoger |
| `20260532000000_customer_notifications.sql` | Notificaciones cliente |
| `20260533000000_customer_notifications_order_created.sql` | Tipo `order_created` |

- [ ] Migraciones aplicadas sin error.
- [ ] RLS activo en `orders`, `customer_notifications`.

---

## 3. Variables de entorno

Copiar `.env.example` → `.env.local` (local) o panel del host (staging/prod).

### Supabase

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon (pública, con RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role — solo servidor; webhooks, notificaciones, cron |

### Stripe

| Variable | Descripción |
|----------|-------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` (dev/staging) o `sk_live_...` (prod real) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` del endpoint correspondiente |
| `NEXT_PUBLIC_SITE_URL` | URL base sin barra final (`https://tudominio.com`) |

### Cron (carrito abandonado)

| Variable | Descripción |
|----------|-------------|
| `CRON_SECRET` | Secreto aleatorio; header `Authorization: Bearer …` o `x-cron-secret` |

### Email (opcional)

| Variable | Descripción |
|----------|-------------|
| `CUSTOMER_ORDER_EMAILS_ENABLED` | `true` para emails al cliente |
| `RESEND_API_KEY` | API key Resend |
| `EMAIL_FROM` | Remitente verificado |
| `ADMIN_ORDER_NOTIFICATION_EMAIL` | Destino alertas de pedido nuevo |

- [ ] Todas las variables requeridas definidas.
- [ ] Ningún secreto en el repositorio git.

---

## 4. Stripe — entorno local

### Configuración

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # de stripe listen
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Terminal 1 — app

```bash
npm run dev
```

### Terminal 2 — reenvío webhook

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copiar el `whsec_...` que imprime `stripe listen` a `STRIPE_WEBHOOK_SECRET`.

### Prueba de pago

1. Cliente envía solicitud → admin aprueba → admin genera enlace.
2. Cliente abre “Pagar ahora”.
3. Tarjeta test: `4242 4242 4242 4242` · fecha futura · CVC cualquiera.
4. Tras redirect, el pedido **no** debe marcarse pagado solo por la URL (`?paid=success`).
5. Verificar en Supabase: `payment_status = paid`, `stripe_paid_at` poblado.
6. Verificar evento `checkout.session.completed` en logs de `stripe listen`.

- [ ] Pago test completado.
- [ ] Webhook confirmó pago en BD.

---

## 5. Stripe — staging / producción

1. Crear endpoint en [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks):
   - URL: `https://TU-DOMINIO.com/api/stripe/webhook`
   - Evento: `checkout.session.completed`
2. Copiar **Signing secret** → `STRIPE_WEBHOOK_SECRET` del entorno.
3. Usar `STRIPE_SECRET_KEY` del mismo modo (test vs live) que el dashboard.
4. `NEXT_PUBLIC_SITE_URL` debe coincidir con el dominio público (HTTPS).

- [ ] Endpoint webhook creado y activo.
- [ ] Secret del endpoint en variables del host.
- [ ] **No activar cobros live** hasta prueba controlada en test mode.

---

## 6. Cron — recordatorio de carrito

Endpoint: `POST /api/jobs/cart-reminders` (también acepta `GET`).

### Seguridad

- Sin `CRON_SECRET` en env → **401** siempre.
- Sin header válido → **401**.

```bash
# Debe fallar
curl -X POST https://TU-DOMINIO.com/api/jobs/cart-reminders
# → 401

# Debe responder ok
curl -X POST https://TU-DOMINIO.com/api/jobs/cart-reminders \
  -H "Authorization: Bearer TU_CRON_SECRET"
# → {"ok":true,"scanned":...,"created":...}
```

### Lógica

- Carrito `draft` sin actividad ≥ **2 horas**.
- Sin pedido del usuario en últimas **24 h**.
- Máximo **1** `cart_reminder` por usuario cada **24 h**.

### Programación (Vercel — opcional)

Si despliegas en Vercel, puedes añadir en `vercel.json` **solo cuando confirmes el deploy**:

```json
{
  "crons": [{
    "path": "/api/jobs/cart-reminders",
    "schedule": "0 14 * * *"
  }]
}
```

Configurar `CRON_SECRET` en Vercel y llamar el endpoint con el header desde un cron externo si no usas Vercel Cron.

- [ ] `CRON_SECRET` definido en producción.
- [ ] Job probado con curl autenticado.
- [ ] Cron programado (externo o Vercel) documentado internamente.

---

## 7. Login Google

- [ ] Redirect URLs incluyen `https://TU-DOMINIO.com/auth/callback` y localhost en dev.
- [ ] Cliente puede iniciar sesión y acceder a `/cuenta`.
- [ ] Usuario no admin recibe `admin=denied` al intentar `/admin`.

---

## 8. Admin protegido

- [ ] `/admin` redirige a login sin sesión.
- [ ] Cliente autenticado sin rol admin → `?admin=denied`.
- [ ] Layout admin usa `requireAdmin()`.
- [ ] Server actions de pedidos usan `requireAdmin()`.

---

## 9. Flujo cliente completo

- [ ] Agregar al carrito → checkout → solicitud enviada.
- [ ] Notificación in-app **Solicitud recibida** (`order_created`).
- [ ] Pedido visible en `/cuenta/pedidos`.
- [ ] Tras aprobación: notificación **Tu solicitud fue aprobada** (`order_approved`).
- [ ] Tras enlace Stripe: **Pago disponible** (`payment_available`).
- [ ] Pago → **Pago confirmado** → preparando → listo → entregado.
- [ ] Sin CTAs de admin en vistas cliente.

---

## 10. Flujo admin completo

- [ ] Menú: Panel admin, Pedidos de clientes (no “Mis pedidos”).
- [ ] `/cuenta/pedidos` redirige a `/admin/pedidos`.
- [ ] Revisar disponibilidad → generar Stripe → fulfillment.
- [ ] WhatsApp manual disponible como respaldo.
- [ ] Badge/header refleja cola operativa (pendientes / aprobados sin pago), no pedidos personales.

---

## 11. Notificaciones

- [ ] Contador en header.
- [ ] `/cuenta/notificaciones` lista y marca leídas.
- [ ] Admin: links de pedido → `/admin/pedidos/[id]`.
- [ ] Cliente: links → `/cuenta/pedidos/[id]`.
- [ ] RLS: usuario solo ve las suyas.

---

## 12. Sin exposición de datos internos

- [ ] Cliente no ve: nota interna admin, stock, bodega, logística privada.
- [ ] Copy cliente: disponibilidad genérica, recolección en tienda.

---

## 13. Sin envíos a domicilio (v1)

- [ ] Checkout solo pickup (Chalco / Amecameca).
- [ ] Tarjeta “Direcciones” oculta en `/cuenta`.
- [ ] Sin “Envío a domicilio” en panel cuenta.

---

## 14. Sin referencias a SEEDIS

- [ ] Repo y env apuntan solo a Radio Shalko.
- [ ] Supabase / Stripe / dominio propios del proyecto.

---

## 15. Build y deploy

```bash
npm run build
# exit 0
```

- [ ] Build verde en CI o local.
- [ ] Deploy a staging completado.
- [ ] Variables del host configuradas.

---

## 16. Prueba real controlada (recomendada)

Usar **un producto de bajo riesgo** y cuenta cliente de prueba.

| Paso | Acción | Verificar |
|------|--------|-----------|
| 1 | Publicar producto de prueba | Visible en catálogo |
| 2 | Cliente: carrito + checkout | Solicitud + notificación `order_created` |
| 3 | Admin: revisar y aprobar | `order_approved` + estado confirmed |
| 4 | Admin: generar enlace Stripe | `payment_available` + URL en admin |
| 5 | Cliente: pagar (test) | Redirect OK, aún unpaid hasta webhook |
| 6 | Webhook | `paid` en Supabase |
| 7 | Admin: preparando → listo | Notificaciones cliente |
| 8 | Admin: entregado | Estado final |

**No pasar a cobros reales (live)** hasta:

- Webhook producción verificado con al menos un pago test en staging.
- Equipo operativo familiarizado con `/admin/pedidos`.

---

## Contacto operativo

- Panel admin: `/admin/pedidos`
- Respaldo manual: WhatsApp desde detalle de pedido (admin)
- Soporte técnico: revisar `SALES-8_REPORT.md` y logs de webhook/cron
