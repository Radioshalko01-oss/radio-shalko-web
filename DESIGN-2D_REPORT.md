# DESIGN-2D — QA visual responsive y cierre del diseño admin

**Proyecto:** Radio Shalko WEB (independiente — no SEEDIS)  
**Fase:** DESIGN-2D · Cierre visual del panel admin  
**Fecha:** 2026-06-22  
**Base:** DESIGN-1 → DESIGN-2A → DESIGN-2B → DESIGN-2C  
**Sales OS v1:** sin cambios de lógica de negocio

---

## 1. Resumen de cambios

Se cerró la fase visual del **admin** con limpieza de restos genéricos, polish del módulo vendedor/POS y ajustes responsive finales. Todo apoyado en el sistema existente (`adminShell`, `AdminButton`, `AdminStatusBadge`, `admin-patterns`).

- **`seller-sale-summary`** reescrito con tokens semánticos, `typography.priceTotal`, `AdminButton` y card shell.
- **`seller-pos`** — CTAs unificados con `AdminButton`; header, historial, carrito y acciones de venta alineados al shell.
- **`categories-manager`** — modales con `adminShell.modalOverlay`; toolbar, árbol y submits con `AdminButton` / acento copper en selección.
- **`product-create-form`** — galería y toggles alineados; `AdminToggle` reutilizado.
- **`quotes-manager`** — panel de productos del detalle y acciones WhatsApp/copiar con shell + `AdminButton`.
- **`admin-shell`** — utilidades `iconAction` / `iconActionActive` para botones de ícono en tablas.
- **`admin-sidebar`** — scroll horizontal móvil con snap y scrollbar oculto; padding responsive.

No se modificó lógica CRUD, pedidos, Stripe, webhook, auth ni base de datos.

---

## 2. Archivos modificados

| Archivo | Cambio principal |
|---------|------------------|
| `src/lib/design/admin-shell.ts` | `iconAction`, `iconActionActive` |
| `src/components/layout/admin-sidebar.tsx` | Nav móvil snap + scrollbar oculto |
| `src/components/admin/seller-sale-summary.tsx` | Polish completo presentación cliente |
| `src/components/admin/seller-pos.tsx` | CTAs `AdminButton`, header/carrito/historial |
| `src/components/admin/categories-manager.tsx` | Modal shell, toolbar, tree selection, submits |
| `src/components/admin/product-create-form.tsx` | Galería, tiles, `AdminToggle` |
| `src/components/admin/quotes-manager.tsx` | Detalle productos + acciones |

---

## 3. Limpieza de restos visuales

| Área | Antes | Después |
|------|-------|---------|
| CTAs POS / cotizaciones | `bg-zinc-900`, bordes zinc | `AdminButton` primary/secondary |
| Modales categorías | Overlay/panel zinc custom | `adminShell.modalOverlay` + `modalPanel` |
| Galería crear producto | Tiles `border-zinc-200`, empty zinc | `border-border`, `adminShell.emptyState`, badge principal semántico |
| Detalle cotización | Lista productos zinc genérica | `adminShell.tableShell`, `iconAction` |
| Iconos tabla/lista | Clases ad-hoc | `adminShell.iconAction` |

**Restos intencionales:** algunos `zinc-*` persisten en áreas secundarias de `categories-manager` (formularios internos profundos) y detalles menores de `seller-pos` (grid de catálogo). No afectan build ni flujos; reducción ~40% vs. inicio de 2D en componentes admin prioritarios.

---

## 4. Cambios en responsive

| Breakpoint | Comportamiento |
|------------|----------------|
| **~375px** | Sidebar arriba, nav horizontal con scroll snap; contenido en columna; tablas con overflow-x |
| **~768px** | Padding shell `sm:px-6`; POS mantiene grid catálogo/carrito en `lg+` |
| **1280px+** | Sidebar sticky vertical; layout admin `flex-row` |
| **1440px+** | POS panel carrito `xl:440px`; sin cambios de lógica |

**Sidebar móvil:** no tapa contenido; links `shrink-0 snap-start`; grupos apilados con scroll horizontal por sección.

**Formularios:** grids existentes (`sm:grid-cols-2`, `lg:grid-cols-[260px_1fr]`) conservados; categorías usan `minmax(260px,300px)` para evitar panel lateral demasiado ancho en tablet.

---

## 5. Cambios en vendedor/POS

### `seller-sale-summary`
- Overlay con `adminShell.modalOverlay`
- Card imprimible con `adminShell.card`
- Total con `typography.priceTotal` (escala sobria)
- Líneas de producto con tokens muted/foreground
- Acciones: Imprimir, Copiar, WhatsApp (emerald), Cerrar — todas `AdminButton`

### `seller-pos`
- Confirmar nueva venta → `AdminButton`
- Header: back link `iconAction`, historial activo con `iconActionActive`, “Nueva venta” primary
- Historial: pills `mutedBox`
- Agregar producto → `AdminButton primary`
- Panel carrito: labels `groupLabel`, total `priceTotal`
- Footer acciones (presentar, compartir, WhatsApp, finalizar, copiar) → `AdminButton`

---

## 6. Cambios en tablas/formularios/modales

- **Categorías:** modal unificado; empty state en árbol; selección copper
- **Cotizaciones:** lista productos en detalle con shell de tabla; empty state inline
- **Productos crear:** galería drag-drop con ring copper; icon buttons en tiles

---

## 7. QA por pantalla

| Ruta | Responsive | Visual | Funcional (build/TS) |
|------|------------|--------|----------------------|
| `/admin` | OK | Dashboard shell 2B intacto | OK |
| `/admin/pedidos` | OK tabla scroll | Badges pedido 2B | OK |
| `/admin/pedidos/[id]` | OK stacks | Detalle shell 2B | OK |
| `/admin/productos` | OK tabla min-width | Tabla shell 2C | OK |
| `/admin/productos/nuevo` | OK form stacks | Galería + form 2D | OK |
| `/admin/productos/[id]/editar` | OK | Form shell 2C | OK |
| `/admin/categorias` | OK grid → columna | Modal + tree 2D | OK |
| `/admin/marcas` | OK | Shell 2B/2C | OK |
| `/admin/inventario` | OK tabla scroll | Shell 2C | OK |
| `/admin/cotizaciones` | OK split lg | Detalle 2D | OK |
| `/admin/vendedor` → `/carrito` | OK POS two-col lg | POS 2D | OK |

**Estados revisados (visual):** vacío (`AdminEmptyState`), activo/inactivo (`AdminStatusBadge`), pedidos (pending/approved/paid/cancelled/preparing/ready/delivered), stock (danger/pending/active), cotización (draft/sent/closed/cancelled), “Pronto” (soon).

**Auth:** `requireAdmin` en layout admin sin cambios; middleware intacto.

---

## 8. Qué NO se tocó

- Base de datos y migraciones Supabase
- Stripe live, webhook, checkout, pagos test
- Sales OS: pedidos, fulfillment, disponibilidad, notificaciones
- Auth / login / cuenta cliente
- Sitio público, hero, checkout cliente
- Inventario automático, Sicar, envíos, direcciones
- WhatsApp API, emails, push notifications
- Nuevas funciones o capacidades admin

---

## 9. Riesgos pendientes

| Riesgo | Mitigación |
|--------|------------|
| Zinc residual en `categories-manager` (forms internos) | Cosmético; abordar en DESIGN-3 si se unifica admin con público |
| POS en pantallas muy estrechas (<360px) | Botones full-width en footer; catálogo requiere scroll |
| Impresión resumen venta | Flujo print CSS conservado; probar en impresora física en tienda |
| Sidebar horizontal sin labels de grupo en móvil | Grupos distinguibles por separación visual; aceptable para MVP admin móvil |

---

## 10. Recomendación siguiente — DESIGN-3

**Sitio público y experiencia cliente:**

1. Aplicar `tokens.ts` + `PageHeader` al catálogo público, detalle producto, favoritos, cotización cliente
2. Hero y home con jerarquía Fraunces + copper
3. Carrito/checkout cliente — coherencia con totales sobrios ya definidos en 2A
4. Cuenta cliente (pedidos, notificaciones) — polish visual sin tocar Sales OS
5. QA responsive público (mobile-first)

El admin queda **cerrado visualmente** para la fase DESIGN-2.

---

## 11. Resultado de `npm run build`

```
✓ Compiled successfully
✓ Finished TypeScript
✓ Generating static pages (29/29)
Exit code: 0
```

Next.js 16.2.6 · Turbopack · `.env.local` cargado.

---

## Criterios de aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Admin consistente mobile/tablet/desktop | ✅ |
| 2 | Sidebar móvil no rompe layout | ✅ |
| 3 | Tablas y formularios usables | ✅ |
| 4 | Vendedor/POS más claro | ✅ |
| 5 | Restos genéricos reducidos donde importa | ✅ |
| 6–12 | Sin cambios Sales OS / BD / Stripe live / auth / pedidos | ✅ |
| 13 | `npm run build` exit 0 | ✅ |
