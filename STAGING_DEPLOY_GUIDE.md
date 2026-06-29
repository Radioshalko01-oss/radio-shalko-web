# Guía de deploy staging — Radio Shalko WEB

**Proyecto:** Radio Shalko WEB (independiente — **no SEEDIS**)  
**Alcance:** Sales OS v1 · Stripe **test** · recolección en tienda  
**Supabase:** `actxvfjtejmpkjernvtw` · `https://actxvfjtejmpkjernvtw.supabase.co`

Esta guía prepara un entorno **staging seguro** para la prueba pública controlada de Sales OS v1. **No activar Stripe live ni cobros reales** en esta fase.

> Sustituye `https://DOMINIO_STAGING` por la URL real que te asigne el proveedor (ej. `*.vercel.app`). **No inventes un dominio** — úsalo solo después de crear el deploy.

---

## 1. Proveedor recomendado

| Opción | Recomendación |
|--------|----------------|
| **Vercel** | ✅ Recomendado — Next.js 16, zero-config, env por entorno |
| Netlify / Cloudflare Pages | Posible con adaptaciones; no verificado en este repo |
| VPS manual | Posible (`npm run build` + `npm start`); más operación |

**Estado del repo (STAGING-1):**

- No existe `vercel.json`
- No hay carpeta `.vercel` (proyecto **no conectado** a Vercel aún)
- Build: `npm run build` → Next.js 16 App Router
- Sin git remote configurado en el entorno de preparación

---

## 2. Requisitos previos

1. Cuenta en el proveedor de deploy (Vercel recomendado).
2. Repositorio git del proyecto Radio Shalko WEB (GitHub/GitLab/Bitbucket).
3. Acceso al [Dashboard Supabase Radio Shalko](https://supabase.com/dashboard/project/actxvfjtejmpkjernvtw).
4. Cuenta [Stripe](https://dashboard.stripe.com) en **modo test**.
5. Migraciones Sales OS aplicadas (ver §8).

**No uses** el proyecto Supabase ni credenciales de SEEDIS.

---

## 3. Conectar y desplegar (Vercel)

### 3.1 Importar proyecto

1. [vercel.com/new](https://vercel.com/new) → Import Git Repository.
2. Seleccionar el repo **Radio Shalko WEB**.
3. Framework preset: **Next.js** (auto-detectado).
4. Root directory: `/` (raíz del repo).
5. Build command: `npm run build` (default).
6. Output: default Next.js (no cambiar salvo que sepas lo que haces).

### 3.2 Primer deploy

1. **No desplegar aún** sin variables — configura §4 primero, o haz un deploy inicial solo para obtener `DOMINIO_STAGING`.
2. Tras el deploy, copia la URL de producción del proyecto Vercel (ej. `https://radio-shalko-web-xxx.vercel.app`).
3. Esa URL será `DOMINIO_STAGING` y el valor de `NEXT_PUBLIC_SITE_URL`.

### 3.3 Entorno staging en Vercel

Opciones:

- **Opción A:** Proyecto Vercel dedicado “Radio Shalko Staging” (recomendado).
- **Opción B:** Entorno “Preview” con branch `staging` + variables solo en Preview.

Para Sales OS v1, un proyecto staging separado evita mezclar con producción futura.

---

## 4. Variables de entorno (staging)

Configurar en **Vercel → Project → Settings → Environment Variables** (entorno Production del proyecto staging, o Preview según §3.3).

**Nunca commitear valores. No pegar secretos en chat, issues ni capturas.**

### Supabase (requeridas)

| Variable | Dónde obtenerla | Expuesta al cliente |
|----------|-----------------|---------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | Sí (pública) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | Sí (pública, con RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | **No** — solo servidor |

### Stripe test (requeridas para pagos)

| Variable | Valor esperado | Notas |
|----------|----------------|-------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | **Solo test.** No `sk_live_`. |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` del webhook **staging** en Dashboard | Ver §6 |
| `NEXT_PUBLIC_SITE_URL` | `https://DOMINIO_STAGING` | Sin barra final. **No localhost.** |

### Cron (recomendado)

| Variable | Descripción |
|----------|-------------|
| `CRON_SECRET` | String aleatorio largo; protege `/api/jobs/cart-reminders` |

### Email (opcional)

| Variable | Descripción |
|----------|-------------|
| `CUSTOMER_ORDER_EMAILS_ENABLED` | `true` para emails al cliente |
| `RESEND_API_KEY` | API key Resend |
| `EMAIL_FROM` | Remitente verificado |
| `ADMIN_ORDER_NOTIFICATION_EMAIL` | Destino alertas pedido nuevo |

Plantilla local: `.env.example` (sin valores reales).

---

## 5. NEXT_PUBLIC_SITE_URL

Regla crítica para staging:

```env
NEXT_PUBLIC_SITE_URL=https://DOMINIO_STAGING
```

Usada por:

- Redirects OAuth / callbacks
- URLs success/cancel de Stripe Checkout
- Enlaces en emails (si están activos)

**Incorrecto en staging:** `http://localhost:3000`

Tras cambiar esta variable → **redeploy** en Vercel.

---

## 6. Supabase Auth (staging + local)

Dashboard: [Authentication → URL Configuration](https://supabase.com/dashboard/project/actxvfjtejmpkjernvtw/auth/url-configuration)

### Staging

| Campo | Valor |
|-------|--------|
| **Site URL** | `https://DOMINIO_STAGING` |
| **Redirect URLs** | `https://DOMINIO_STAGING/auth/callback` |

### Desarrollo local (conservar)

| Campo | Valor |
|-------|--------|
| **Redirect URLs** | `http://localhost:3000/auth/callback` |

### Google OAuth

En [Google Cloud Console](https://console.cloud.google.com/) → credenciales OAuth del cliente usado por Supabase:

- **Authorized JavaScript origins:** añadir `https://DOMINIO_STAGING`
- **Authorized redirect URIs:** incluir el callback de Supabase  
  `https://actxvfjtejmpkjernvtw.supabase.co/auth/v1/callback`

En Supabase → Authentication → Providers → Google: verificar Client ID/Secret.

### Admin de prueba

Tras primer login en staging:

```sql
update public.profiles
set role = 'admin'
where email = 'tu-email-de-prueba@gmail.com';
```

---

## 7. Stripe webhook (modo test · staging)

**Importante:**

| Entorno | Webhook secret |
|---------|----------------|
| Local (`stripe listen`) | `whsec_...` de la CLI — **solo localhost** |
| Staging / producción | `whsec_...` del **Stripe Dashboard** del endpoint público |

### Pasos

1. Activar **Test mode** en [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks).
2. **Add endpoint**
   - URL: `https://DOMINIO_STAGING/api/stripe/webhook`
   - Events: **`checkout.session.completed`**
3. Crear endpoint → copiar **Signing secret**.
4. Pegar en Vercel como `STRIPE_WEBHOOK_SECRET` (staging).
5. Redeploy.

### Verificación

1. Flujo completo hasta “Pagar ahora” con tarjeta `4242 4242 4242 4242`.
2. En Stripe → Webhooks → endpoint → ver entrega **200**.
3. En Supabase → `orders`: `payment_status = paid`, `stripe_paid_at` poblado.
4. La URL `?paid=success` **no** debe marcar pagado sola (solo banner “confirmando”).

Si el webhook responde **503** → faltan `STRIPE_SECRET_KEY` o `STRIPE_WEBHOOK_SECRET`.  
Si responde **400** → firma incorrecta (secret equivocado o body alterado).

**No activar Stripe live** en staging SALES OS v1.

---

## 8. Migraciones Supabase

Antes del E2E staging, verificar schema:

```bash
SUPABASE_ACCESS_TOKEN=sbp_... node scripts/verify-sales-os-migrations.mjs
```

Si falla, aplicar:

```bash
SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-supabase-migrations.mjs
```

Migraciones Sales OS clave:

- `20260526000000` … `20260533000000` (incluye `order_created`)

---

## 9. Cron — recordatorio de carrito

Endpoint: `POST` o `GET`  
`/api/jobs/cart-reminders`

### Probar en staging

```bash
# Debe fallar
curl -s -o /dev/null -w "%{http_code}" \
  -X POST https://DOMINIO_STAGING/api/jobs/cart-reminders
# → 401

# Debe responder ok (usar el CRON_SECRET del entorno staging)
curl -X POST https://DOMINIO_STAGING/api/jobs/cart-reminders \
  -H "Authorization: Bearer TU_CRON_SECRET"
# → {"ok":true,"scanned":...,"created":...}
```

Alternativa header: `x-cron-secret: TU_CRON_SECRET`

### Programación automática (después, opcional)

El repo **no incluye** `vercel.json` con cron activo. Cuando confirmes Vercel como proveedor, puedes añadir:

```json
{
  "crons": [{
    "path": "/api/jobs/cart-reminders",
    "schedule": "0 14 * * *"
  }]
}
```

Vercel Cron no envía `Authorization` automáticamente — necesitas:

- un wrapper con auth, o
- cron externo (GitHub Actions, cron-job.org) que llame el endpoint con `Bearer CRON_SECRET`.

**STAGING-1:** no activar cron automático hasta validar manualmente con curl.

---

## 10. Arquitectura relevante para deploy

| Componente | Ruta / archivo | Notas staging |
|------------|----------------|---------------|
| Middleware auth + admin | `src/middleware.ts` | Edge; protege `/admin` |
| Webhook Stripe | `/api/stripe/webhook` | Node runtime; body raw |
| Cron carrito | `/api/jobs/cart-reminders` | Requiere `CRON_SECRET` |
| Checkout Stripe | Server actions + `siteBaseUrl()` | Depende de `NEXT_PUBLIC_SITE_URL` |
| Service role | `src/lib/supabase/admin.ts` | Solo servidor; nunca `NEXT_PUBLIC_` |

`next.config.ts` está en default — sin rewrites especiales.

---

## 11. Checklist post-deploy

Marca cada ítem en staging con `DOMINIO_STAGING` real.

### Infraestructura

- [ ] Sitio carga (`https://DOMINIO_STAGING`)
- [ ] `npm run build` verde en el commit desplegado
- [ ] Variables §4 configuradas (sin localhost en `NEXT_PUBLIC_SITE_URL`)
- [ ] Migraciones verificadas (`verify-sales-os-migrations.mjs`)

### Auth y roles

- [ ] Login Google funciona
- [ ] Cliente accede `/cuenta`
- [ ] No-admin redirigido desde `/admin` (`?admin=denied`)
- [ ] Cuenta admin con `role = admin`

### Flujo Sales OS (Stripe test)

- [ ] Cliente crea solicitud de compra
- [ ] Notificación `order_created`
- [ ] Admin ve pedido en `/admin/pedidos`
- [ ] Admin aprueba → `order_approved`
- [ ] Admin genera enlace Stripe → `payment_available`
- [ ] Cliente ve “Pagar ahora”
- [ ] Checkout Stripe test abre (tarjeta 4242)
- [ ] Webhook marca `payment_status = paid`
- [ ] Notificación `payment_confirmed`
- [ ] Admin marca preparando → listo → entregado
- [ ] Cliente recibe notificaciones en cada paso

### Seguridad

- [ ] Cron sin secreto → 401
- [ ] Cron con secreto → 200 + JSON ok
- [ ] Cliente no ve pedidos/notificaciones ajenos
- [ ] Admin redirect `/cuenta/pedidos` → `/admin/pedidos`
- [ ] Sin datos internos (bodega, stock exacto) en UI cliente

---

## 12. Seguridad del repositorio

Verificado en STAGING-1:

| Control | Estado |
|---------|--------|
| `.env*` en `.gitignore` (excepto `.env.example`) | ✅ |
| `STRIPE_SECRET_KEY` solo servidor (`getStripeClient`) | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` solo `createAdminClient()` | ✅ |
| Sin `NEXT_PUBLIC_STRIPE_*` | ✅ |
| Sin referencias SEEDIS en código fuente | ✅ |

**Reglas:**

- No subir `.env.local` a git.
- No pegar secretos en PRs, Slack ni documentación.
- Rotar `CRON_SECRET` si se filtra.

---

## 13. Troubleshooting

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Login Google falla en staging | Redirect URL no registrada | §6 Supabase + Google Console |
| Stripe redirect a localhost | `NEXT_PUBLIC_SITE_URL` incorrecta | Corregir + redeploy |
| Pago no confirma | Webhook mal configurado | §7 — secret del Dashboard, no CLI |
| Webhook 503 | Env Stripe faltante | Añadir keys + redeploy |
| Notificación `order_created` falla insert | Migración `20260533000000` pendiente | §8 |
| Admin 404 / redirect loop | Usuario sin rol admin | SQL §6 |

---

## 14. Referencias internas

| Documento | Uso |
|-----------|-----|
| `SALES-9_STAGING_CHECKLIST.md` | E2E detallado 26 pasos |
| `GO_LIVE_CHECKLIST_RADIO_SHALKO.md` | Go-live general |
| `STAGING-1_REPORT.md` | Reporte fase STAGING-1 |
| `.env.example` | Plantilla variables |

---

## 15. Después del staging

Cuando el checklist §11 esté completo con Stripe **test**:

1. Actualizar `SALES-9_REPORT.md` con resultados E2E.
2. Decidir si repetir en dominio producción antes de Stripe live.
3. **No activar `sk_live_`** hasta sign-off operativo explícito.

---

*STAGING-1 · Radio Shalko WEB · Sin SEEDIS · Sin Stripe live*
