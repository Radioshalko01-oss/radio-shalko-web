# ORDER-4 — Crear pedido real desde el carrito

**Fecha:** 22 jun 2026  
**Build:** `npm run build` → exit 0

---

## 1. Diagnóstico

El checkout (ORDER-3 / 3.6) validaba el formulario en cliente y mostraba una pantalla temporal sin persistencia. Las tablas `orders`, `order_items`, `customer_addresses` y `order_status_history` existían (ORDER-2) pero RLS permitía **insert solo a admin**. No había RPC pública ni Server Action para convertir carrito → pedido.

**Brecha cerrada:** Server Action `createOrderFromCart()` + función SQL `create_order_from_checkout` (SECURITY DEFINER) + vaciado de carrito + confirmación real.

---

## 2. Arquitectura implementada

```
Checkout UI (cliente)
  → validateCheckoutForm (cliente, UX inmediata)
  → createOrderFromCart (Server Action)
      → validateOrderForm + validateOrderCart (servidor)
      → getProductsByIds (publicados + inventario)
      → resolveBranchId (slug → UUID)
      → supabase.rpc('create_order_from_checkout')
          → INSERT orders, order_items, customer_addresses?, order_status_history
  → clearQuoteCart / localStorage clear
  → Pantalla de confirmación con order_number
```

- **Carrito:** sigue en `quotes` / `quote_items` (auth) o `localStorage` (invitado).
- **Pedido:** entidad nueva en `orders`; no reutiliza quote id.
- **Pagos:** solo se guarda `payment_method` elegido; sin cobro.

---

## 3. Archivos creados / modificados

| Archivo | Rol |
|---------|-----|
| `supabase/migrations/20260527000000_order_checkout.sql` | `payment_method`, RPC `create_order_from_checkout` |
| `src/lib/orders/actions.ts` | Server Action principal |
| `src/lib/orders/validators.ts` | Validación servidor (form + carrito + stock) |
| `src/lib/orders/types.ts` | Tipos de payload y resultado |
| `src/lib/orders/order-number.ts` | Utilidades de formato (generación en SQL) |
| `src/lib/quotes/actions.ts` | `clearQuoteCart()` |
| `src/components/providers/quote-provider.tsx` | `clearCart()` en contexto |
| `src/components/pages/checkout-page.tsx` | Integración + confirmación real |
| `src/types/database.generated.ts` | `payment_method`, RPC types |

---

## 4. Cómo se crea el pedido

1. Usuario envía formulario en `/checkout`.
2. `createOrderFromCart(form, cartItems)` valida contacto, entrega, pago y líneas.
3. Construye payload con snapshots de producto (título, SKU, marca, precio, cantidad).
4. Llama `create_order_from_checkout` que inserta en transacción:
   - `orders` (status `pending`, payment `unpaid`, fulfillment `unfulfilled`)
   - `order_items` (snapshot congelado)
   - `customer_addresses` si `local_delivery` o `national_shipping`
   - `order_status_history` (`null → pending`, nota fija)
5. Devuelve `{ orderId, orderNumber, ... }` a la UI.

---

## 5. Cómo se genera `order_number`

Formato: **`RS-YYYY-NNNNNN`** (ej. `RS-2026-000001`).

Generación **dentro de la función SQL**:
- Busca el máximo secuencial del año actual.
- Incrementa y formatea con `lpad(..., 6, '0')`.
- Retry hasta 5 veces ante colisión `unique` en `order_number`.

`src/lib/orders/order-number.ts` expone helpers de parse/format para UI futura.

---

## 6. Invitados

- `orders.user_id = auth.uid()` si hay sesión; `null` si invitado.
- Siempre se guardan `customer_email`, `customer_name`, `customer_phone`.
- RPC ejecutable por `anon` y `authenticated` (sin INSERT público directo en tablas).
- Invitados no pueden leer el pedido vía RLS después; la confirmación usa la respuesta de la Server Action.

---

## 7. Validación de stock

En `validateOrderCart()`:
- `totalStock(inventory) <= 0` → bloquea con mensaje por producto.
- `quantity > totalStock` → bloquea con unidades disponibles.
- **No** se modifica `product_inventory`.

---

## 8. Vaciado del carrito

Tras pedido exitoso:
- **Autenticado:** `clearQuoteCart()` elimina `quote_items` del draft; el quote draft permanece vacío.
- **Invitado:** `clearLocal()` en `QuoteProvider` limpia `localStorage`.
- Shared carts no se modifican.

---

## 9. Cómo probar paso a paso

1. **Aplicar migración** en Supabase:
   ```bash
   supabase db push
   # o ejecutar 20260527000000_order_checkout.sql manualmente
   ```
2. Agregar productos con stock > 0 al carrito.
3. Ir a `/checkout`, completar datos y pulsar **Revisar y continuar**.
4. Verificar confirmación con número `RS-2026-...`.
5. Confirmar carrito vacío al volver a `/carrito`.
6. En Supabase SQL Editor:
   ```sql
   select order_number, customer_name, total, payment_method, status from orders order by created_at desc limit 1;
   select product_title, quantity, unit_price from order_items where order_id = (select id from orders order by created_at desc limit 1);
   ```
7. Probar invitado (sin login) y usuario autenticado.
8. Probar producto sin stock → debe mostrar error en UI.

---

## 10. Riesgos pendientes

| Riesgo | Notas |
|--------|-------|
| Migración no aplicada en prod | RPC fallará hasta ejecutar SQL |
| Race en order_number | Mitigado con retry; ORDER-5 puede usar secuencia dedicada |
| Sin reserva de stock | Dos checkouts simultáneos pueden pasar validación |
| Envío estimado ($99/$199) | Monto fijo UI; admin confirma real por WhatsApp |
| Invitado sin historial | ORDER-5 / cuenta cliente resolverá lectura |
| Mercado Pago | Solo preferencia guardada; sin cobro (ORDER futuro) |

---

## 11. Resultado de build

```
npm run build → exit 0
```

Ruta `/checkout` compilada correctamente.
