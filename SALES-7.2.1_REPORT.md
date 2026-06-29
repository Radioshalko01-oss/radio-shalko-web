# SALES-7.2.1 — Separación Admin / Cliente y limpieza UX crítica

**Proyecto:** Radio Shalko WEB  
**Fase:** SALES-7.2.1 (roles · navegación · carrito)  
**Fecha:** 2026-06-22

---

## 1. Resumen de cambios

Separación clara de experiencias según rol:

| Área | Admin | Cliente |
|------|-------|---------|
| Menú cuenta | Panel admin, Pedidos de clientes, Carrito tienda | Mis pedidos, Favoritos, Mi carrito |
| Rutas pedidos | `/admin/pedidos*` (redirect desde `/cuenta/pedidos*`) | `/cuenta/pedidos*` |
| Carrito | Compartir carrito, seguir agregando, vaciar | Asesoría + Comprar |
| Cuenta | Sin Favoritos ni Direcciones destacados | Flujo actual |
| Notificaciones | Enlaces de pedido → `/admin/pedidos/[id]` | Enlaces cliente |

Sin cambios al flujo Stripe, webhooks ni migraciones.

---

## 2. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/components/site/header.tsx` | Menú desktop y móvil distinto para admin vs cliente |
| `src/app/(site)/cuenta/page.tsx` | Cards según rol; oculta Direcciones y Favoritos (admin) |
| `src/app/(site)/cuenta/pedidos/page.tsx` | Redirect admin → `/admin/pedidos` |
| `src/app/(site)/cuenta/pedidos/[id]/page.tsx` | Redirect admin → `/admin/pedidos/[id]` |
| `src/app/(site)/cuenta/notificaciones/page.tsx` | Pasa `isAdmin` a la lista |
| `src/components/account/customer-notifications-list.tsx` | Hrefs y footer según rol |
| `src/components/pages/cotizacion-page.tsx` | CTAs admin, tipografía total, vaciar carrito |
| `src/lib/notifications/resolve-notification-href.ts` | **Nuevo** — reescribe href pedido para admin |
| `SALES-7.2.1_REPORT.md` | Este documento |

---

## 3. Cómo se separó admin / cliente

### Menú header (admin)

Orden: Mi cuenta → Panel admin → Pedidos de clientes → Carrito tienda → Notificaciones → Seguridad → Cerrar sesión.

- Sin “Mis pedidos” ni “Favoritos”.
- “Pedidos de clientes” apunta a `/admin/pedidos`.

### Menú header (cliente)

Sin cambios funcionales: Mi cuenta, Notificaciones, Mis pedidos, Favoritos, Mi carrito, Seguridad, Cerrar sesión.

### Redirects server-side

- `/cuenta/pedidos` → `/admin/pedidos` si `account.isAdmin`
- `/cuenta/pedidos/[id]` → `/admin/pedidos/[id]` si `account.isAdmin`

Elimina el paso intermedio “Gestionar en panel admin”.

### Notificaciones

Las notificaciones siguen almacenando hrefs de cliente (`/cuenta/pedidos/[id]`). Al abrir, `resolveNotificationHref` redirige al detalle admin cuando el viewer es administrador.

---

## 4. Qué se ocultó en cuenta

- Tarjeta **Direcciones** y texto “Envío a domicilio” (no hay ruta de direcciones activa).
- **Favoritos** en actividad para admin (reduce confusión con operación de tienda).
- Badges de pago/recogida en tarjeta de pedidos para admin (gestión en panel).

Se mantiene sección **Panel admin** con enlace a `/admin`.

---

## 5. Qué se ajustó en carrito

### Admin (`isAdmin` desde `/carrito`)

- Título: “Carrito tienda”.
- Texto guía para preparar selección y compartir con cliente.
- CTAs: **Compartir carrito** (primario), **Seguir agregando productos**, **Vaciar carrito**.
- Eliminado “Solicitar asesoría” en desktop y móvil.

### Cliente

- Flujo intacto: Solicitar asesoría + Comprar.

### Tipografía del total

- Antes: `text-4xl` / `xl:text-[2.75rem]`.
- Ahora: `text-2xl md:text-3xl` — más sobrio, misma claridad.

---

## 6. Resultado de `npm run build`

```
✓ Compiled successfully
✓ TypeScript OK
✓ 29 rutas generadas
Exit code: 0
```

---

## 7. Riesgos pendientes

| Riesgo | Notas |
|--------|-------|
| Admin con pedidos personales | Si un admin también compra como cliente, esos pedidos solo aparecen en `/admin/pedidos` (vista operativa). No hay vista “mis compras personales” para admin en esta fase. |
| Notificaciones admin | No hay centro de alertas admin dedicado; admin usa panel `/admin` + notificaciones cliente con href reescrito. |
| `hasOrderAttention` en header | Sigue basado en resumen de pedidos del usuario; para admin puede reflejar pedidos propios si existen. |
| Direcciones | Código/rutas futuras no eliminadas; solo ocultas en UI principal. |

---

## 8. Recomendación siguiente

**SALES-7.3 o SALES-8:** Alertas operativas en panel admin (pedidos pendientes de aprobación/pago) independientes del centro de notificaciones cliente, y badge de atención en sidebar admin basado en cola real de trabajo — sin mezclar con la cuenta personal del administrador.

---

## Criterios de aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Admin no ve “Mis pedidos” como pedidos personales | ✅ |
| 2 | “Pedidos de clientes” → `/admin/pedidos` | ✅ |
| 3 | `/cuenta/pedidos` redirect admin | ✅ |
| 4 | `/cuenta/pedidos/[id]` redirect admin | ✅ |
| 5 | Admin no ve “Pagar ahora” en vista cliente | ✅ (redirect) |
| 6 | Admin no ve “Contactar a Radio Shalko” en vista cliente | ✅ (redirect) |
| 7 | Admin no ve “Solicitar asesoría” en carrito | ✅ |
| 8 | Admin ve “Compartir carrito” | ✅ |
| 9 | Cliente conserva “Mis pedidos” | ✅ |
| 10 | Cliente conserva “Pagar ahora” cuando corresponde | ✅ |
| 11 | Cliente conserva seguimiento de pedido | ✅ |
| 12 | Direcciones oculta en `/cuenta` | ✅ |
| 13 | Sin “Envío a domicilio” en cuenta | ✅ |
| 14 | Total carrito más sobrio | ✅ |
| 15 | Navegación admin más directa | ✅ |
| 16 | Stripe intacto | ✅ |
| 17 | Notificaciones intactas | ✅ |
| 18 | Build verde | ✅ |
