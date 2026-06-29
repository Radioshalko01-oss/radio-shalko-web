# SALES-7.3 — QA completo del flujo Sales OS v1

**Proyecto:** Radio Shalko WEB  
**Fase:** SALES-7.3 (validación · congelamiento v1)  
**Fecha:** 2026-06-22  
**Alcance:** Revisión de extremo a extremo del flujo solicitud → pago → entrega

---

## 1. Resumen ejecutivo

Sales OS v1 está **implementado de forma coherente y lista para operación controlada**. La arquitectura separa correctamente roles (cliente `/cuenta`, admin `/admin`), el pago depende del **webhook Stripe** (no de la URL de retorno), las acciones administrativas están protegidas con `requireAdmin()`, y RLS limita pedidos/notificaciones al usuario propietario.

**Metodología de este QA:**

| Tipo | Qué se validó |
|------|----------------|
| Revisión estática | Rutas, server actions, RLS, webhook, cron, copy cliente vs admin |
| Prueba en vivo | `POST /api/jobs/cart-reminders` sin secreto → **401** |
| Build | `npm run build` → **exit 0** |
| E2E manual | Flujo completo con login cliente + admin + Stripe test + webhook local requiere entorno configurado (ver §13) |

**Veredicto:** ✅ **Apto para congelar v1** con riesgos menores documentados y sin bloqueadores críticos.

---

## 2. Flujo probado (mapa)

```
Cliente                          Admin                           Sistema
───────                          ─────                           ───────
Carrito → Checkout               /admin/pedidos                  RPC create_order_from_checkout
  solicitud de compra      →       revisar disponibilidad    →     status: pending
/cuenta/pedidos                  aprobar / cancelar              status: confirmed | cancelled
                                 generar Stripe                  stripe_payment_url
Pagar ahora (Stripe)       →                                     webhook → payment_status: paid
/cuenta/pedidos/[id]             marcar preparando               fulfillment: preparing
                                 listo para recoger              fulfillment: ready_for_pickup
Notificación + detalle           marcar entregado                fulfillment: delivered
```

---

## 3. Checklist 1 — Flujo cliente

| # | Criterio | Resultado | Evidencia / notas |
|---|----------|-----------|-------------------|
| 1 | Iniciar sesión | ✅ Código | Google OAuth + `/login`; checkout exige sesión |
| 2 | Agregar producto al carrito | ✅ Código | `QuoteProvider` + `/carrito` |
| 3 | Ver carrito | ✅ Código | `/carrito` → `CotizacionPage` |
| 4 | Enviar solicitud de compra | ✅ Código | `/checkout` → `createOrderFromCart` → RPC |
| 5 | Ver pedido en `/cuenta/pedidos` | ✅ Código | `listCustomerOrders` + RLS `orders_select_own` |
| 6 | Ver notificación creada | ⚠️ Parcial | **No hay notificación in-app al crear pedido**; solo email interno al admin (`notifyAdminNewOrder`). El cliente ve el pedido en lista. |
| 7 | Esperar aprobación admin | ✅ Código | Estado `pending` + copy “Solicitud recibida” |
| 8 | Ver pedido aprobado | ✅ Código | `status=confirmed`; mensaje admin en `customer_message` |
| 9 | Notificación pago disponible | ✅ Código | Al generar enlace Stripe: `notifyCustomer` type `payment_available` |
| 10 | Entrar al detalle | ✅ Código | `/cuenta/pedidos/[id]` |
| 11 | “Pagar ahora” | ✅ Código | Visible si `confirmed + unpaid + stripe_payment_url` |
| 12 | Pagar Stripe test | 🔄 Manual | Requiere `STRIPE_SECRET_KEY` + tarjeta 4242 en entorno real |
| 13 | Volver al pedido | ✅ Código | `success_url` → `?paid=success` |
| 14 | URL no marca pagado | ✅ Código | `paidQuery` solo muestra banner “confirmando”; sin update DB |
| 15 | Webhook marca pagado | ✅ Código | `processCheckoutSessionCompleted` actualiza `payment_status`, `stripe_paid_at`, `stripe_payment_intent_id` |
| 16 | “Pago confirmado” | ✅ Código | `customerOrderStatusUi` + sección verde en detalle |
| 17 | Notificación pago confirmado | ✅ Código | Webhook → `notifyCustomer` type `payment_confirmed` |
| 18 | “Preparando pedido” | ✅ Código | Admin `markOrderPreparing` → notificación + UI cliente |
| 19 | “Listo para recoger” | ✅ Código | Admin `markOrderReadyForPickup` → mensaje/estimate en detalle |
| 20 | Mensaje/hora recolección | ✅ Código | `pickup_ready_message` + `pickup_ready_estimate` |
| 21 | “Entregado” | ✅ Código | Admin `markOrderDelivered` → UI + notificación |

**Manual E2E pendiente:** pasos 12–15 con Stripe CLI webhook forwarding en entorno local/staging.

---

## 4. Checklist 2 — Flujo admin

| # | Criterio | Resultado | Evidencia |
|---|----------|-----------|-----------|
| 1 | Menú header admin correcto | ✅ | SALES-7.2.1: Panel admin, Pedidos de clientes, Carrito tienda |
| 2 | Sin “Mis pedidos” personal | ✅ | Oculto para `isAdmin` |
| 3 | “Pedidos de clientes” → `/admin/pedidos` | ✅ | Header desktop + móvil |
| 4 | `/cuenta/pedidos` → redirect | ✅ | `redirect("/admin/pedidos")` |
| 5 | `/cuenta/pedidos/[id]` → redirect | ✅ | `redirect("/admin/pedidos/[id]")` |
| 6 | Sin “Pagar ahora” vista cliente | ✅ | Redirect impide acceso |
| 7 | Sin “Contactar a Radio Shalko” | ✅ | Idem |
| 8 | Solicitudes pendientes | ✅ | `orders-manager` + filtros + alerta sidebar |
| 9 | Aprobar disponibilidad | ✅ | `submitOrderAvailabilityReview` |
| 10 | Generar enlace Stripe | ✅ | `createStripeCheckoutForOrder` |
| 11 | Ver pago confirmado post-webhook | ✅ | `OrderPaymentSection` muestra “Pagado” |
| 12 | Marcar preparando | ✅ | `markOrderPreparing` |
| 13 | Marcar listo para recoger | ✅ | `markOrderReadyForPickup` + WhatsApp manual |
| 14 | WhatsApp manual respaldo | ✅ | `OrderFulfillmentSection` + `OrderPaymentSection` |
| 15 | Marcar entregado | ✅ | `markOrderDelivered` |
| 16 | Sin acciones inválidas post-entrega | ✅ | Server actions validan `fulfillment_status`; UI oculta botones en `delivered` |

---

## 5. Checklist 3 — Notificaciones

| # | Criterio | Resultado | Evidencia |
|---|----------|-----------|-----------|
| 1 | Contador header | ✅ | `unreadNotifications` en layout + badge dropdown |
| 2 | `/cuenta` muestra notificaciones | ✅ | Tarjeta Actividad con badge |
| 3 | `/cuenta/notificaciones` lista | ✅ | `CustomerNotificationsList` |
| 4 | Click lleva al lugar correcto | ✅ | Cliente: href original; Admin: `resolveNotificationHref` |
| 5 | Cliente → `/cuenta/pedidos/[id]` | ✅ | href almacenado en DB |
| 6 | Admin → `/admin/pedidos/[id]` | ✅ | Reescritura en click |
| 7 | Marcar una leída | ✅ | `markNotificationAsRead` + `.eq("user_id", user.id)` |
| 8 | Marcar todas leídas | ✅ | `markAllNotificationsAsRead` |
| 9 | Sin notificaciones ajenas | ✅ | RLS `customer_notifications_select_own` |
| 10 | Sin duplicados excesivos | ✅ | `skipIfUnreadDuplicate` por type+orderId; cart 24h vía `hasRecentCartReminder` |
| 11 | Carrito pendiente genera aviso | ⚠️ Operativo | Job `runCartReminderJob` existe; requiere cron + carrito stale ≥2h |
| 12 | Cron requiere `CRON_SECRET` | ✅ **Probado** | `POST /api/jobs/cart-reminders` sin auth → **401** |

**Eventos que crean notificación in-app:**

| Evento | Tipo | ¿Implementado? |
|--------|------|----------------|
| Crear pedido | — | ❌ No (solo email admin) |
| Aprobar disponibilidad | `order_approved` | ❌ Tipo definido pero no emitido |
| Generar pago Stripe | `payment_available` | ✅ |
| Webhook pago | `payment_confirmed` | ✅ |
| Preparando | `order_preparing` | ✅ |
| Listo recoger | `order_ready_for_pickup` | ✅ |
| Entregado | `order_delivered` | ✅ |
| Carrito abandonado | `cart_reminder` | ✅ (job) |

---

## 6. Checklist 4 — Stripe

| # | Criterio | Resultado | Evidencia |
|---|----------|-----------|-----------|
| 1 | Pendiente no puede pagar | ✅ | Sin URL; UI “revisando disponibilidad” |
| 2 | Cancelado no puede pagar | ✅ | `validateOrderForStripeCheckout` rechaza `cancelled` |
| 3 | Aprobado puede generar enlace | ✅ | Requiere `status=confirmed`, `unpaid` |
| 4 | Enlace guardado en Supabase | ✅ | `stripe_payment_url`, `stripe_checkout_session_id` |
| 5 | Reutiliza enlace unpaid | ✅ | Early return si URL existe y `unpaid` |
| 6 | Cliente ve “Pagar ahora” | ✅ | `CustomerOrderDetailView` |
| 7 | Stripe test abre | 🔄 Manual | Depende de keys + URL pública |
| 8 | Tarjeta 4242 | 🔄 Manual | Stripe test mode |
| 9 | Webhook `checkout.session.completed` | ✅ Código | `route.ts` handler |
| 10 | `payment_status` → paid | ✅ | Update condicional `.eq("payment_status", "unpaid")` |
| 11 | `stripe_paid_at` | ✅ | ISO timestamp en update |
| 12 | `stripe_payment_intent_id` | ✅ | Desde session |
| 13 | Success URL no marca pagado | ✅ | Solo query param + banner |
| 14 | Admin ve “Pagado” | ✅ | `OrderPaymentSection` |
| 15 | Cliente ve “Pago confirmado” | ✅ | Status UI + sección |

**Idempotencia webhook:** reintentos devuelven `{ alreadyPaid: true }` sin error.

**Seguridad webhook:** verifica firma `stripe-signature`; inválida → **400**.

---

## 7. Checklist 5 — Seguridad y roles

| # | Criterio | Resultado | Evidencia |
|---|----------|-----------|-----------|
| 1 | Cliente no accede `/admin` | ✅ | Middleware + `requireAdmin()` en layout |
| 2 | Cliente no ve pedidos ajenos | ✅ | RLS `orders_select_own` |
| 3 | Cliente no ve notificaciones ajenas | ✅ | RLS notifications |
| 4 | Cliente no aprueba pedidos | ✅ | `submitOrderAvailabilityReview` → `requireAdmin` |
| 5 | Cliente no genera Stripe | ✅ | `createStripeCheckoutForOrder` → `requireAdmin` |
| 6 | Cliente no marca fulfillment | ✅ | Todas las acciones fulfillment en `admin-actions` |
| 7 | Admin opera desde `/admin` | ✅ | SALES-7.2.1 |
| 8 | Admin no atrapado en vistas cliente | ✅ | Redirects en rutas pedido |
| 9 | Sin datos internos al cliente | ✅ | `customer-queries` no expone `admin_internal_note`, stock, bodega |
| 10 | Cron sin secreto rechaza | ✅ **401 probado** |
| 11 | Webhook firma inválida rechaza | ✅ Código | `constructEvent` catch → 400 |

**Checkout:** RPC `create_order_from_checkout` solo `authenticated`; revocado `anon`.

**Defensa en profundidad admin:** middleware → layout `requireAdmin()` → server actions `requireAdmin()`.

---

## 8. Checklist 6 — UX y textos

| Área | Resultado | Observaciones |
|------|-----------|---------------|
| Header cliente/admin | ✅ | Menús diferenciados post-7.2.1 |
| Carrito cliente | ✅ | Asesoría + Comprar; total sobrio (`text-2xl/3xl`) |
| Carrito admin | ✅ | Compartir + seguir agregando + vaciar; sin asesoría |
| Checkout | ✅ | “Solicitar compra”; pickup Chalco/Amecameca (público, no logística interna) |
| `/cuenta` | ✅ | Sin Direcciones; admin con cards operativas |
| `/cuenta/pedidos` | ✅ | Copy claro; estados por `customerOrderStatusUi` |
| Detalle cliente | ✅ | Sin CTAs admin; WhatsApp solo cliente |
| Admin pedidos/detalle | ✅ | Nota interna solo admin; hints de sucursal sin stock |
| Tipografía totales | ✅ | Carrito y detalle pedido proporcionados |
| Rutas / vueltas | ✅ | Admin redirect directo; notificaciones admin reescritas |

**Microcopy consistente:** “Solicitud de compra”, “Total estimado”, “Recolección en tienda”.

**Sin revelación operativa al cliente:** mensajes genéricos de disponibilidad; sin menciones a bodega/traslados/stock exacto.

---

## 9. Bugs encontrados

| ID | Severidad | Descripción |
|----|-----------|-------------|
| QA-1 | Baja | Contador carrito en header contaba **líneas** (`quoteItems.length`) en lugar de **unidades** (suma de `quantity`), inconsistente con `/cuenta` |
| QA-2 | Baja | No hay notificación in-app al **crear** pedido (checklist cliente #6 ambiguo) |
| QA-3 | Baja | Tipo `order_approved` definido pero nunca emitido; cliente solo notificado al generar pago |
| QA-4 | Baja | `hasOrderAttention` en header admin refleja pedidos **personales** del admin, no cola operativa |
| QA-5 | Info | Ventana entre aprobar y generar Stripe: cliente ve “Aprobado · esperando pago” sin notificación hasta enlace |
| QA-6 | Info | Recordatorio carrito requiere job programado + `CRON_SECRET` + carrito ≥2h sin actividad |

---

## 10. Fixes aplicados en SALES-7.3

| Fix | Archivo | Cambio |
|-----|---------|--------|
| QA-1 | `src/app/(site)/layout.tsx` | `cartItemCount` = suma de cantidades del carrito |

**No se aplicaron fixes de alcance funcional** (notificaciones extra, alertas admin) para respetar el límite “no funciones grandes”.

---

## 11. Bugs pendientes

| ID | Prioridad | Recomendación |
|----|-----------|---------------|
| QA-2 | Post-v1 | Opcional: notificación “Solicitud recibida” al crear pedido |
| QA-3 | Post-v1 | Emitir `order_approved` al confirmar disponibilidad (antes de Stripe) |
| QA-4 | Post-v1 | Badge admin basado en `getAdminOrderNotificationSummary`, no pedidos personales |
| QA-5 | Aceptado v1 | Flujo operativo: admin aprueba → genera pago en secuencia |
| QA-6 | Operativo | Documentar cron en producción (Vercel Cron / similar) |

---

## 12. Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Webhook Stripe no configurado en prod | Pagos no confirman | Verificar `STRIPE_WEBHOOK_SECRET` + endpoint público |
| `NEXT_PUBLIC_SITE_URL` incorrecta | Return URLs Stripe rotas | Validar en deploy |
| Cron carrito no programado | Sin recordatorios | Configurar job + `CRON_SECRET` |
| Admin también compra como cliente | Confusión de pedidos personales vs operativos | Documentado; usar cuentas separadas en prod si aplica |
| Email opcional desactivado | Cliente solo in-app | `CUSTOMER_ORDER_EMAILS_ENABLED` + Resend |

---

## 13. Recomendación de siguiente fase

**SALES-8 — Operación en producción (go-live controlado):**

1. Deploy con Stripe live/test en staging.
2. E2E manual scriptado (cliente + admin + webhook CLI) — completar ítems 🔄 Manual.
3. Cron de carrito en producción.
4. Badge operativo admin en sidebar (cola real, no cuenta personal).
5. Opcional: notificación “Solicitud recibida” al checkout.

**No avanzar a:** inventario automático, Sicar, envíos, push, rediseño global — hasta cerrar go-live v1.

---

## 14. Resultado de `npm run build`

```
✓ Compiled successfully
✓ TypeScript OK
✓ 29 rutas generadas
Exit code: 0
```

---

## 15. Criterios de aceptación SALES-7.3

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Flujo completo solicitud → entregado | ✅ Código (+ E2E manual recomendado) |
| 2 | Stripe test funciona | 🔄 Requiere prueba manual con keys |
| 3 | Webhook confirma pago | ✅ Implementación verificada |
| 4 | Notificaciones funcionan | ✅ (con gaps documentados) |
| 5 | Recordatorio carrito | ⚠️ Implementado; requiere cron operativo |
| 6 | Admin/cliente separados | ✅ SALES-7.2.1 |
| 7 | Sin CTAs incorrectos por rol | ✅ |
| 8 | Sin datos internos expuestos | ✅ |
| 9 | Build verde | ✅ |

---

## Anexo — Guía E2E manual recomendada

```bash
# Terminal 1: app
npm run dev

# Terminal 2: Stripe webhook forward
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Terminal 3: tras pago test
# Verificar orders.payment_status = 'paid' en Supabase

# Cron test (con secreto)
curl -X POST http://localhost:3000/api/jobs/cart-reminders \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Tarjeta test:** `4242 4242 4242 4242` · cualquier fecha/CVC futuros.

**Roles:** usar cuenta Google cliente + cuenta Google admin (`profiles.role = 'admin'`).
