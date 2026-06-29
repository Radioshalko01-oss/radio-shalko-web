# STAGING-1 — Preparar deploy staging seguro

**Proyecto:** Radio Shalko WEB  
**Fase:** STAGING-1 (preparación despliegue · sin Stripe live)  
**Fecha:** 2026-06-22

---

## 1. Resumen

STAGING-1 audita la configuración de deploy del repo y produce documentación para un **staging seguro** de Sales OS v1. No se implementaron funciones nuevas ni cambios de lógica de negocio. No se activó Stripe live.

**Entregables:**

- `STAGING_DEPLOY_GUIDE.md` — guía paso a paso
- `STAGING-1_REPORT.md` — este documento

---

## 2. Estado actual de deploy

| Aspecto | Estado |
|---------|--------|
| Conexión Vercel | ❌ No detectada (sin `.vercel/`, sin `vercel.json`) |
| Git remote | ❌ No configurado en entorno de auditoría |
| `next.config.ts` | Default (sin custom deploy) |
| Build command | `npm run build` |
| Start command | `npm start` |
| Framework | Next.js 16.2.6 · App Router |
| Middleware | `src/middleware.ts` — sesión Supabase + protección `/admin` |
| API routes críticas | `/api/stripe/webhook`, `/api/jobs/cart-reminders` |
| Supabase proyecto | `actxvfjtejmpkjernvtw` (Radio Shalko) |
| Deploy staging URL | **Pendiente** — operador debe crear en Vercel u otro |

**Conclusión:** el proyecto está **listo para conectar** a un proveedor; el deploy staging **aún no existe**.

---

## 3. Proveedor detectado o recomendado

| Proveedor | Detección | Recomendación |
|-----------|-----------|---------------|
| **Vercel** | No conectado | ✅ **Recomendado** — Next.js nativo, env por proyecto |
| Netlify / CF Pages | No configurado | Alternativa no verificada |
| VPS | No documentado | Posible con `build` + `start` |

Pasos detallados: `STAGING_DEPLOY_GUIDE.md` §3.

---

## 4. Variables necesarias (staging)

Documentadas sin valores reales en `STAGING_DEPLOY_GUIDE.md` §4.

### Requeridas

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY          # sk_test_... únicamente
STRIPE_WEBHOOK_SECRET      # whsec_... del Dashboard staging
NEXT_PUBLIC_SITE_URL       # https://DOMINIO_STAGING
```

### Recomendadas

```
CRON_SECRET
```

### Opcionales

```
CUSTOMER_ORDER_EMAILS_ENABLED
RESEND_API_KEY
EMAIL_FROM
ADMIN_ORDER_NOTIFICATION_EMAIL
```

Plantilla: `.env.example`

---

## 5. Pasos Supabase Auth (staging)

1. Dashboard → [Auth URL Configuration](https://supabase.com/dashboard/project/actxvfjtejmpkjernvtw/auth/url-configuration)
2. **Site URL:** `https://DOMINIO_STAGING`
3. **Redirect URLs:**  
   - `https://DOMINIO_STAGING/auth/callback`  
   - `http://localhost:3000/auth/callback` (dev local)
4. Google OAuth: origins + redirect Supabase en Google Cloud Console
5. Promover admin de prueba vía SQL en `profiles.role`

Detalle: `STAGING_DEPLOY_GUIDE.md` §6.

---

## 6. Pasos Stripe webhook test (staging)

1. Stripe Dashboard → **Test mode**
2. Endpoint: `https://DOMINIO_STAGING/api/stripe/webhook`
3. Evento: `checkout.session.completed`
4. Signing secret → `STRIPE_WEBHOOK_SECRET` en Vercel staging
5. Redeploy

**No usar** `whsec_` de `stripe listen` en staging.

Detalle: `STAGING_DEPLOY_GUIDE.md` §7.

---

## 7. Pasos cron (staging)

1. Definir `CRON_SECRET` en variables staging
2. Probar manualmente:

```bash
curl -X POST https://DOMINIO_STAGING/api/jobs/cart-reminders
# → 401

curl -X POST https://DOMINIO_STAGING/api/jobs/cart-reminders \
  -H "Authorization: Bearer CRON_SECRET"
# → {"ok":true,...}
```

3. Cron automático (Vercel u otro): **documentado pero no activado** — ver guía §9

Detalle: `STAGING_DEPLOY_GUIDE.md` §9.

---

## 8. Checklist post-deploy

Checklist completo en `STAGING_DEPLOY_GUIDE.md` §11.

Resumen:

| Área | Ítems |
|------|-------|
| Infra | Sitio carga, build, env, migraciones |
| Auth | Google login, roles admin/cliente |
| Sales OS | Solicitud → aprobación → Stripe test → webhook → fulfillment |
| Seguridad | Cron 401, RLS, separación roles |

Completar tras obtener `DOMINIO_STAGING` real.

---

## 9. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Deploy sin `NEXT_PUBLIC_SITE_URL` correcta | Configurar antes de probar Stripe/OAuth |
| Webhook con secret de CLI local | Usar Dashboard staging §6 |
| Migración `20260533000000` no aplicada | `verify-sales-os-migrations.mjs` |
| Stripe live activado por error | Solo `sk_test_` en staging |
| Secretos en git | `.gitignore` cubre `.env*` |
| Mezcla con SEEDIS | Proyecto Supabase `actxvfjtejmpkjernvtw` exclusivo Radio Shalko |
| Cron público sin secret | Endpoint ya responde 401 sin auth |

---

## 10. Auditoría de seguridad (código)

| Verificación | Resultado |
|--------------|-----------|
| `.env.local` en `.gitignore` | ✅ |
| Sin secretos hardcodeados en `src/` | ✅ |
| `STRIPE_SECRET_KEY` server-only | ✅ `src/lib/stripe/client.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` server-only | ✅ `src/lib/supabase/admin.ts` |
| Sin `NEXT_PUBLIC_STRIPE_*` | ✅ |
| SEEDIS solo en docs, no en código | ✅ |
| Admin protegido middleware + `requireAdmin()` | ✅ |
| Webhook verifica firma Stripe | ✅ |

---

## 11. Resultado `npm run build`

```
✓ Compiled successfully
✓ TypeScript OK
✓ 29 rutas generadas
Exit code: 0
```

---

## 12. Cambios en código (STAGING-1)

**Ninguno.** Solo documentación:

| Archivo | Acción |
|---------|--------|
| `STAGING_DEPLOY_GUIDE.md` | Creado |
| `STAGING-1_REPORT.md` | Creado |

---

## 13. Siguiente paso recomendado

**STAGING-2 — Ejecutar deploy staging:**

1. Crear repo remoto git (si aún no existe) y push del proyecto.
2. Importar en Vercel → obtener `DOMINIO_STAGING`.
3. Configurar variables §4 de la guía.
4. Configurar Supabase Auth §6 y Stripe webhook §7.
5. `verify-sales-os-migrations.mjs` → exit 0.
6. Completar checklist post-deploy §11.
7. Ejecutar E2E de `SALES-9_STAGING_CHECKLIST.md` §H.

**No activar Stripe live** hasta E2E staging completo en test mode.

---

## Criterios de aceptación STAGING-1

| # | Criterio | Estado |
|---|----------|--------|
| 1 | `STAGING_DEPLOY_GUIDE.md` | ✅ |
| 2 | `STAGING-1_REPORT.md` | ✅ |
| 3 | Variables sin secretos | ✅ |
| 4 | Stripe staging documentado | ✅ |
| 5 | Supabase Auth staging documentado | ✅ |
| 6 | Cron staging documentado | ✅ |
| 7 | No Stripe live | ✅ |
| 8 | Sin funciones nuevas | ✅ |
| 9 | Sin SEEDIS | ✅ |
| 10 | Build verde | ✅ |
