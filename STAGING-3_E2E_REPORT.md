# STAGING-3 — Cierre de prueba real en staging

**Proyecto:** Radio Shalko WEB (independiente — no SEEDIS)  
**Fase:** STAGING-3 · Cierre E2E staging + limpieza operativa menor  
**Fecha de prueba:** 2026-06-22 (reportada por operador)

---

## 1. Resumen ejecutivo

La **prueba real controlada en staging** de Sales OS v1 se completó con éxito en Mac, Windows y dominio Vercel staging. El flujo completo solicitud → pago Stripe test → webhook → preparación → recoger → entregado funcionó correctamente para cliente y admin.

**Bugs críticos:** ninguno.

**Limpieza aplicada en STAGING-3:** ocultar el campo “Nota interna (opcional)” en la revisión de disponibilidad admin (UI solamente; columna `admin_internal_note` intacta en Supabase).

**Veredicto:** Sales OS v1 **cerrado en staging** con Stripe **test**. No activar Stripe live hasta decisión operativa explícita.

**Siguiente fase recomendada:** **DESIGN-1 — Auditoría visual global.**

---

## 2. Fecha de prueba

| Campo | Valor |
|-------|--------|
| Fecha reportada | 2026-06-22 |
| Entorno | Staging Vercel (dominio público HTTPS) |
| Modo pago | Stripe **test** únicamente |

---

## 3. Entorno probado

| Componente | Detalle |
|------------|---------|
| **Deploy** | Vercel staging |
| **Base de datos** | Supabase Radio Shalko · `actxvfjtejmpkjernvtw` |
| **Pagos** | Stripe Dashboard **test mode** |
| **Webhook** | Endpoint público staging → `checkout.session.completed` |
| **Auth** | Google OAuth vía Supabase |
| **Clientes probados** | Mac + Windows |

---

## 4. Flujo probado

```
Cliente solicita compra
        ↓
Admin confirma disponibilidad
        ↓
Admin genera enlace Stripe
        ↓
Cliente paga (4242 test)
        ↓
Webhook confirma pago
        ↓
Admin marca preparando
        ↓
Admin marca listo para recoger
        ↓
Admin marca entregado
```

Notificaciones in-app validadas en el recorrido (`order_created`, `order_approved`, `payment_available`, `payment_confirmed`, fulfillment).

---

## 5. Resultado cliente

| Ítem | Resultado |
|------|-----------|
| Login Google | ✅ OK |
| Carrito + checkout | ✅ OK |
| Solicitud de compra | ✅ OK |
| Notificación solicitud recibida | ✅ OK |
| Mis pedidos / detalle | ✅ OK |
| Notificación aprobación + pago disponible | ✅ OK |
| Pagar ahora → Stripe Checkout test | ✅ OK |
| Retorno sin marcar paid por URL | ✅ OK |
| Pago confirmado post-webhook | ✅ OK |
| Estados preparando / listo / entregado | ✅ OK |
| Sin CTAs admin ni copy interno | ✅ OK |

---

## 6. Resultado admin

| Ítem | Resultado |
|------|-----------|
| `/admin/pedidos` — cola operativa | ✅ OK |
| Revisión de disponibilidad | ✅ OK |
| Generar enlace Stripe | ✅ OK |
| Ver pago confirmado | ✅ OK |
| Preparación → listo → entregado | ✅ OK |
| WhatsApp manual (respaldo) | ✅ OK |
| Separación roles (redirects `/cuenta/pedidos`) | ✅ OK |
| Menú admin vs cliente | ✅ OK |

---

## 7. Resultado Stripe webhook

| Ítem | Resultado |
|------|-----------|
| Checkout test abre correctamente | ✅ OK |
| Tarjeta 4242 completa pago | ✅ OK |
| Webhook staging entrega 200 | ✅ OK |
| `payment_status` → `paid` | ✅ OK |
| `stripe_paid_at` / `payment_intent` | ✅ OK |
| Idempotencia (no doble cargo lógico) | ✅ OK |
| Signing secret del Dashboard (no CLI local) | ✅ OK |

---

## 8. Resultado en Mac

| Ítem | Resultado |
|------|-----------|
| Navegación staging | ✅ OK |
| Flujo cliente completo | ✅ OK |
| Flujo admin completo | ✅ OK |
| Stripe redirect + retorno | ✅ OK |

---

## 9. Resultado en Windows

| Ítem | Resultado |
|------|-----------|
| Navegación staging | ✅ OK |
| Flujo cliente completo | ✅ OK |
| Flujo admin completo | ✅ OK |
| Stripe redirect + retorno | ✅ OK |

---

## 10. Bugs críticos encontrados

**Ninguno.**

Observaciones menores previas (UX nota interna) resueltas en STAGING-3 ocultando el campo en UI.

---

## 11. Limpieza aplicada

| Cambio | Alcance |
|--------|---------|
| Ocultar “Nota interna (opcional)” en formulario de revisión | Solo UI |
| Mantener mensaje para cliente | ✅ |
| Mantener opciones de disponibilidad + Confirmar | ✅ |
| Columna `admin_internal_note` en BD | **Sin cambios** |
| Server action `submitOrderAvailabilityReview` | Sigue aceptando nota opcional vía API; UI no la envía |

**Archivo:** `src/components/admin/order-availability-review.tsx`

Notas internas guardadas en pedidos anteriores pueden seguir mostrándose en vista de solo lectura post-revisión si existen en BD.

---

## 12. Riesgos pendientes

| Riesgo | Notas |
|--------|-------|
| Stripe live no probado | Esperado — activar solo con sign-off |
| Cron carrito automático | Manual documentado; programación opcional |
| Productos reales masivos | Fuera de alcance staging |
| Experiencia visual | Mejorable — siguiente DESIGN-1 |
| Admin con pedidos personales | Usar cuentas operativas separadas si aplica |

---

## 13. Recomendación siguiente

### DESIGN-1 — Auditoría visual global

Priorizar antes de nuevas funciones:

- Jerarquía tipográfica y espaciado
- Consistencia admin vs sitio cliente
- Cards, totales, badges y CTAs
- Sensación de marca global profesional

**No avanzar a:** inventario automático, Sicar, envíos, Stripe live, rediseño funcional mayor.

---

## Build STAGING-3

```
npm run build → exit 0
```

---

## Referencias

- `STAGING_DEPLOY_GUIDE.md`
- `STAGING-1_REPORT.md`
- `SALES-9_STAGING_CHECKLIST.md`
- `SALES-9_REPORT.md`

---

*STAGING-3 · Radio Shalko WEB · Sales OS v1 cerrado en staging · Sin SEEDIS · Sin Stripe live*
