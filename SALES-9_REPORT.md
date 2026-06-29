# SALES-9 — Prueba real controlada en staging

**Proyecto:** Radio Shalko WEB  
**Fase:** SALES-9 (staging · Stripe test · documentación)  
**Fecha:** 2026-06-22

---

## 1. Resumen

SALES-9 prepara la **prueba real controlada en staging** de Sales OS v1:

- Checklist operativo completo: `SALES-9_STAGING_CHECKLIST.md`
- Script de verificación de migraciones: `scripts/verify-sales-os-migrations.mjs`
- Validaciones locales: build verde, cron 401, revisión de seguridad por código
- **E2E en dominio staging:** procedimiento documentado; ejecución manual pendiente de deploy + variables staging

**Modo Stripe:** solo **test** (`sk_test_...`). No se activó Stripe live.

---

## 2. Dominio staging usado

| Campo | Valor |
|-------|--------|
| Deploy staging documentado | **Pendiente de confirmar por operador** |
| Placeholder checklist | `https://TU-DOMINIO-STAGING` |
| Supabase (Radio Shalko) | `https://actxvfjtejmpkjernvtw.supabase.co` |
| Local dev (referencia) | `http://localhost:3000` — **no válido para staging** |

`ESTADO_PROYECTO.md` indica despliegue Vercel aún pendiente. Antes del E2E:

1. Desplegar commit actual a URL HTTPS pública.
2. Fijar `NEXT_PUBLIC_SITE_URL` al dominio real.
3. Completar checklist §H en `SALES-9_STAGING_CHECKLIST.md`.

---

## 3. Migraciones verificadas

### En repositorio (Sales OS v1)

| Migración | Estado repo |
|-----------|-------------|
| `20260526000000_orders.sql` | ✅ Presente |
| `20260527000000_order_checkout.sql` | ✅ Presente |
| `20260528000000_order_checkout_auth_only.sql` | ✅ Presente |
| `20260529000000_order_availability_review.sql` | ✅ Presente |
| `20260530000000_order_stripe_checkout.sql` | ✅ Presente |
| `20260531000000_order_fulfillment_pickup.sql` | ✅ Presente |
| `20260532000000_customer_notifications.sql` | ✅ Presente |
| `20260533000000_customer_notifications_order_created.sql` | ✅ Presente |

### En Supabase remoto

| Verificación | Resultado SALES-9 |
|--------------|-------------------|
| Query remota automática | ⏳ No ejecutada — falta `SUPABASE_ACCESS_TOKEN` en entorno CI/local |
| Comando | `SUPABASE_ACCESS_TOKEN=sbp_... node scripts/verify-sales-os-migrations.mjs` |
| Aplicar pendientes | `SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-supabase-migrations.mjs` |

**Acción requerida antes de E2E:** ejecutar script de verificación; si falla `order_created`, aplicar `20260533000000`.

---

## 4. Variables requeridas (staging)

Ver `SALES-9_STAGING_CHECKLIST.md` §C. Resumen:

**Requeridas:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` (test), `STRIPE_WEBHOOK_SECRET` (Dashboard staging), `NEXT_PUBLIC_SITE_URL` (HTTPS staging)

**Recomendadas:** `CRON_SECRET`

**Opcionales:** email Resend + flags

Ningún valor documentado en este reporte (sin secretos).

---

## 5. Stripe webhook staging

### Configuración (modo test)

```
Endpoint: https://TU-DOMINIO-STAGING/api/stripe/webhook
Evento:   checkout.session.completed
Secret:   STRIPE_WEBHOOK_SECRET en variables del host staging
```

| Regla | Detalle |
|-------|---------|
| No usar whsec de `stripe listen` | Solo válido en localhost |
| No usar sk_live | SALES-9 prohíbe live |
| Validación | Tras pago 4242, `payment_status=paid` vía webhook |

---

## 6. Resultado prueba cliente

| Ítem | Estado |
|------|--------|
| Flujo código (checkout → notificaciones → detalle) | ✅ Implementado (SALES-2 … SALES-8) |
| E2E en staging dominio público | ⏳ **Pendiente** — requiere deploy + ejecución manual §H |

Pasos cliente esperados tras E2E: `order_created` → pedido en cuenta → `order_approved` → `payment_available` → pago → `payment_confirmed` → estados fulfillment.

---

## 7. Resultado prueba admin

| Ítem | Estado |
|------|--------|
| `/admin/pedidos`, revisión, Stripe, fulfillment | ✅ Código verificado |
| Separación roles (redirects 7.2.1) | ✅ |
| Header admin cola operativa (SALES-8) | ✅ |
| E2E staging | ⏳ **Pendiente** |

---

## 8. Resultado prueba Stripe

| Ítem | Local | Staging |
|------|-------|---------|
| Validación checkout (`validateOrderForStripeCheckout`) | ✅ Código | ⏳ Manual |
| Success URL no marca paid | ✅ Código | ⏳ Manual |
| Webhook idempotente | ✅ Código | ⏳ Manual con endpoint Dashboard |
| Tarjeta 4242 | ⏳ Manual local | ⏳ Manual staging |

---

## 9. Resultado prueba cron

| Prueba | Resultado |
|--------|-----------|
| `POST /api/jobs/cart-reminders` sin auth (localhost) | ✅ **401** `{"error":"Unauthorized"}` |
| Con `Authorization: Bearer CRON_SECRET` | ⏳ Probar en staging tras deploy |
| Anti-duplicado 24h | ✅ Código (`hasRecentCartReminder`) |
| Carrito stale ≥2h | ✅ Código (`CART_STALE_HOURS`) |

---

## 10. Resultado seguridad

Revisión estática (código + RLS definido en migraciones):

| # | Control | Resultado |
|---|---------|-----------|
| 1 | `/admin` middleware + `requireAdmin()` | ✅ |
| 2 | Admin redirect `/cuenta/pedidos*` | ✅ |
| 3 | RLS `orders_select_own` | ✅ |
| 4 | RLS `customer_notifications_select_own` | ✅ |
| 5 | Admin actions con `requireAdmin()` | ✅ |
| 6 | Cron sin `CRON_SECRET` → 401 | ✅ Probado |
| 7 | Webhook firma inválida → 400 | ✅ Código |
| 8 | Cliente sin `admin_internal_note`, stock, bodega | ✅ Queries cliente filtradas |

E2E seguridad en staging: ⏳ marcar §I del checklist tras deploy.

---

## 11. Bugs encontrados

| ID | Descripción | Severidad |
|----|-------------|-----------|
| S9-1 | Deploy staging no documentado en repo (sin URL fija) | Operativo |
| S9-2 | Migraciones remoto no verificadas automáticamente en SALES-9 | Operativo |
| S9-3 | E2E dominio público no ejecutado (bloqueado por S9-1) | Esperado |

No se encontraron bugs de código nuevos en SALES-9.

---

## 12. Fixes aplicados

| Fix | Archivo |
|-----|---------|
| Script verificación migraciones Sales OS | `scripts/verify-sales-os-migrations.mjs` |
| Checklist staging completo | `SALES-9_STAGING_CHECKLIST.md` |
| Reporte fase | `SALES-9_REPORT.md` |

Sin cambios al flujo de negocio ni UI.

---

## 13. Riesgos pendientes

| Riesgo | Mitigación |
|--------|------------|
| `20260533000000` no aplicada en remoto | Ejecutar verify script antes de E2E |
| Webhook staging mal configurado | Usar whsec del Dashboard test, no CLI |
| `NEXT_PUBLIC_SITE_URL=localhost` en staging | Corregir en panel del host |
| Google OAuth redirect no incluye staging | Actualizar Supabase + Google Console |
| Cron no programado | Recordatorios carrito no automáticos hasta cron externo |
| Activar live prematuramente | Mantener `sk_test_` hasta sign-off E2E |

---

## 14. Recomendación final

### ¿Listo para prueba real limitada en staging?

**Parcialmente listo — código y documentación sí; ejecución E2E en staging pendiente.**

| Criterio | Estado |
|----------|--------|
| Migraciones en repo | ✅ |
| Migraciones aplicadas remoto | ⏳ Verificar con script |
| Staging URL + env | ⏳ Operador |
| Stripe test + webhook staging | ⏳ Configurar post-deploy |
| E2E 26 pasos | ⏳ Ejecutar |
| Build | ✅ |

**Veredicto:** Proceder con:

1. Deploy a staging con variables §C del checklist.
2. `verify-sales-os-migrations.mjs` → exit 0.
3. Configurar webhook Stripe test al dominio staging.
4. Ejecutar E2E §H con producto `[STAGING]`.
5. Si todo pasa → **apto para operación limitada en staging (test mode)**.
6. **No activar Stripe live** ni producción comercial hasta repetir checklist en prod.

---

## 15. Resultado `npm run build`

```
✓ Compiled successfully
✓ TypeScript OK
✓ 29 rutas
Exit code: 0
```

---

## Entregables SALES-9

| Documento | Propósito |
|-----------|-----------|
| `SALES-9_STAGING_CHECKLIST.md` | Checklist operativo staging |
| `SALES-9_REPORT.md` | Este reporte |
| `scripts/verify-sales-os-migrations.mjs` | Verificación schema remoto |

---

## Siguiente fase sugerida

**SALES-9.1 — Ejecución E2E staging:** una vez desplegado, completar §H–§I del checklist, adjuntar capturas/evidencia (sin secretos) y actualizar este reporte con resultados ✅/❌ por paso.

**Después:** evaluación Stripe live + dominio producción (fuera de alcance SALES-9).
