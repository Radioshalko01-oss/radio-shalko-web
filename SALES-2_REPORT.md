# SALES-2 — Checkout como solicitud de compra (solo pickup)

**Fecha:** Junio 2026  
**Proyecto:** Radio Shalko WEB  
**Build:** `npm run build` → exit 0

---

## 1. Resumen de cambios

El checkout dejó de representar una “compra inmediata” y ahora refleja el **Sales OS** aprobado:

- **Login obligatorio** para enviar solicitud (UI + Server Action + RPC).
- **Solo recogida en tienda:** Chalco o Amecameca.
- **Sin envíos** ni costos de envío en checkout.
- **Sin selección de pago** — bloque informativo “Pago después de confirmación”.
- **Copy actualizado:** “Solicitar compra”, “Enviar solicitud”.
- **Stock 0 ya no bloquea** la solicitud (admin revisa después).
- **Confirmación:** “Solicitud recibida” + aclaración de no cobro + WhatsApp opcional.
- **Pedido real** sigue creándose con `pending` / `unpaid` / `unfulfilled` / `pickup`.

---

## 2. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/20260528000000_order_checkout_auth_only.sql` | RPC solo `authenticated`; exige `auth.uid()` |
| `src/components/pages/checkout-page.tsx` | Login gate, pickup only, copy, confirmación |
| `src/app/(site)/checkout/page.tsx` | Pasa `isAuthed` + email; metadata |
| `src/components/checkout/checkout-summary.tsx` | Sin envío; “Tu solicitud” |
| `src/components/checkout/checkout-submit-block.tsx` | CTA “Enviar solicitud” |
| `src/lib/checkout/validate.ts` | `validatePurchaseRequestForm` |
| `src/lib/checkout/constants.ts` | Labels pickup, hints sucursales |
| `src/lib/orders/actions.ts` | Auth check, pickup only, sin envío |
| `src/lib/orders/validators.ts` | Sin validación de stock |
| `src/lib/orders/types.ts` | Respuesta simplificada |

---

## 3. Migración

**Archivo:** `supabase/migrations/20260528000000_order_checkout_auth_only.sql`

**Qué hace:**
1. Reemplaza `create_order_from_checkout` con check `auth.uid() IS NOT NULL` → `authentication_required`.
2. `REVOKE EXECUTE FROM anon`.
3. `GRANT EXECUTE TO authenticated` únicamente.
4. Nota de historial: *Solicitud creada desde checkout*.

**Aplicar en Supabase Radio Shalko** (`actxvfjtejmpkjernvtw`) antes de probar en prod.

---

## 4. Cómo probar

### A. Sin sesión
1. Ir a `/checkout` → pantalla “Inicia sesión para solicitar tu compra”.
2. No debe poder enviar solicitud.

### B. Con sesión + Chalco
1. Login Google → `/checkout`.
2. Elegir Radio Shalko Chalco → Enviar solicitud.
3. Ver confirmación con número RS-YYYY-…
4. Carrito vacío en `/carrito`.

### C. Con sesión + Amecameca
Igual con sucursal Amecameca; verificar `branch_id` en Supabase.

### D. Producto stock 0
Debe permitir enviar solicitud (si producto publicado).

### E. Producto no publicado
Debe bloquear con mensaje claro.

### F. Supabase
```sql
select order_number, user_id, delivery_method, payment_status, status, branch_id
from orders order by created_at desc limit 1;
```
- `user_id` = usuario autenticado
- `delivery_method` = `pickup`
- `payment_status` = `unpaid`
- `status` = `pending`

### G. Seguridad RPC
```sql
-- anon no debe tener execute
SELECT has_function_privilege('anon', 'create_order_from_checkout(jsonb)', 'EXECUTE');
-- debe ser false tras migración
```

---

## 5. Resultado build

```
npm run build → exit 0
```

---

## 6. Riesgos pendientes

| Riesgo | Mitigación futura |
|--------|-------------------|
| Migración no aplicada | Aplicar `20260528000000` en Supabase |
| Invitado con carrito local | Debe login; carrito se sync al autenticarse |
| Estado `pending` genérico | SALES-3 migrará a `solicitud_recibida` |
| Sin panel admin | Admin no ve solicitudes hasta SALES-3 |
| `payment_method = pay_in_store` placeholder | SALES-6 Stripe |

---

## 7. Qué queda para SALES-3

- Panel `/admin/pedidos` (quitar `soon`)
- Lista de solicitudes pendientes
- Detalle de pedido
- Migración de estados (`solicitud_recibida`, etc.)
- Badge contador en sidebar admin

---

*SALES-2 · Radio Shalko WEB · Sin SEEDIS · Sin Stripe · Sin envíos*
