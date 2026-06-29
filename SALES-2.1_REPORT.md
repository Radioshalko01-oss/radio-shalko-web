# SALES-2.1 — Pulido premium checkout, login y autenticación

**Fecha:** Junio 2026  
**Proyecto:** Radio Shalko WEB  
**Build:** `npm run build` → exit 0

---

## 1. Resumen de cambios

Refinamiento visual y de copy del flujo SALES-2 sin alterar la lógica de negocio:

- Login gate con **un solo botón** Google.
- `/login` más limpio y alineado con la marca.
- **Selector de cuenta Google** (`prompt: select_account`).
- Logout explícito con `scope: local`.
- Microcopy **sin logística interna** (bodega, traslados).
- Campo de notas orientado a **recolección en tienda**.
- Checkout y resumen con **espaciado, tipografía y totales** más controlados.
- Transiciones más rápidas (150ms, sin scroll suave artificial).

---

## 2. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/components/auth/google-sign-in-button.tsx` | `select_account`, props de estilo |
| `src/lib/auth/actions.ts` | `signOut({ scope: 'local' })` |
| `src/app/login/page.tsx` | Copy, diseño, soporte `?next=` |
| `src/components/pages/checkout-page.tsx` | Login gate, spacing, notas, pickup copy |
| `src/components/checkout/checkout-summary.tsx` | Subtotal + total, jerarquía reducida |
| `src/lib/checkout/constants.ts` | Hints públicos aprobados |

---

## 3. Google account chooser

En `signInWithOAuth`:

```typescript
queryParams: { prompt: "select_account" }
```

Cada “Continuar con Google” abre el selector de cuenta de Google. No cierra la sesión global de Google; solo fuerza elección en OAuth.

Logout: `supabase.auth.signOut({ scope: "local" })` + redirect `/`.

---

## 4. Textos corregidos

| Antes | Después |
|-------|---------|
| “bodega”, “trasladar desde Chalco” | Copy público aprobado por sucursal |
| “Horario preferido, referencias…” | “Horario estimado de recolección” |
| “crear una cuenta” en login gate | Eliminado (Google crea cuenta) |
| Botón duplicado “Iniciar sesión” | Eliminado en checkout gate |

**Chalco:** *Recolección en Radio Shalko Chalco. Confirmaremos disponibilidad antes de solicitar el pago.*

**Amecameca:** *Recolección en Radio Shalko Amecameca. Algunos productos pueden requerir confirmación…*

**General:** *Radio Shalko revisará tu solicitud y te avisará cuando el pedido esté listo para continuar.*

---

## 5. Mejoras visuales

- Login gate centrado, tarjeta compacta, un CTA principal.
- `/login` sin gradientes pesados; card editorial simple.
- Checkout: padding uniforme, columnas alineadas (`top-20` sticky).
- Secciones `p-4/5`, títulos `text-base`.
- Resumen: imágenes 64px, precios alineados a la derecha, total `text-xl`.
- Subtotal + total estimado con nota de no cobro.
- Mobile sticky: total `text-xl` (no oversized).
- Confirmación más compacta.

---

## 6. Resultado build

```
npm run build → exit 0
```

---

## 7. Riesgos pendientes

| Riesgo | Notas |
|--------|-------|
| Google puede cachear sesión del navegador | `select_account` mitiga; usuario puede cambiar cuenta en picker |
| Sin “Mis pedidos” | Cliente no ve historial hasta SALES-9 |
| Estados `pending` genéricos | SALES-3 |

---

## 8. Qué queda para SALES-3

- Panel `/admin/pedidos`
- Lista solicitudes pendientes
- Detalle + aprobación
- Migración estados (`solicitud_recibida`)
- Badge contador admin

---

*SALES-2.1 · Solo pulido · Sin Stripe · Sin admin · Sin SEEDIS*
