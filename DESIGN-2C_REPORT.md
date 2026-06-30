# DESIGN-2C — Polish CRUD profundo y pantallas internas admin

**Proyecto:** Radio Shalko WEB (independiente — no SEEDIS)  
**Fase:** DESIGN-2C · Polish visual de CRUD interno admin  
**Fecha:** 2026-06-22  
**Base:** `DESIGN-1_AUDIT_RADIO_SHALKO.md`, `DESIGN-2A_REPORT.md`, `DESIGN-2B_REPORT.md`  
**Sales OS v1:** sin cambios de lógica de negocio

---

## 1. Resumen de cambios

Se pulieron las **pantallas CRUD profundas del admin** usando el sistema visual ya creado en DESIGN-2A/2B (`tokens`, `adminShell`, `AdminButton`, `AdminStatusBadge`).

- **Patrones reutilizables** (`admin-patterns.tsx`) para inputs, secciones, toolbars, tablas, empty states y modales.
- **Formularios de productos** más limpios: secciones con cards, labels consistentes, `AdminButton`, inventario y galería alineados al shell.
- **Listas admin** (productos, inventario, cotizaciones) con `AdminTableShell` / `AdminEmptyState`, cabeceras de tabla unificadas y paginación coherente.
- **Categorías y marcas** con inputs del shell, cards semánticas y badges activo/inactivo unificados.
- **Cotizaciones** con toolbar shell, lista seleccionable con acento copper, panel de detalle con stats sobrios.
- **Vendedor / carrito tienda** (`seller-pos`) con jerarquía más clara, total con escala `typography.priceTotal`, empty states y bordes semánticos.
- **Responsive admin básico:** layout `flex-col lg:flex-row`, sidebar horizontal con scroll en móvil, tablas con overflow horizontal.

No se modificó lógica CRUD, base de datos, Stripe, webhook, auth ni flujos Sales OS.

---

## 2. Archivos creados

| Archivo | Propósito |
|---------|-----------|
| `src/components/admin/admin-patterns.tsx` | Patrones admin: `adminInputClass`, `AdminSectionCard`, `AdminFieldGroup`, `AdminToolbar`, `AdminTableShell`, `AdminEmptyState`, `AdminModal`, `AdminFormFeedback`, `AdminToggle` |

---

## 3. Archivos modificados

### Design system extendido
- `src/lib/design/admin-shell.ts` — textarea, inputError, tableShell, tableHeadCell/tableCell/tableRow, modalOverlay/modalPanel, dangerZone, emptyState; sidebar responsive `lg:`

### Shell y layout
- `src/app/admin/layout.tsx` — `flex-col lg:flex-row` para móvil
- `src/components/layout/admin-sidebar.tsx` — nav horizontal con scroll en pantallas pequeñas; grupos ocultos en móvil

### Páginas admin (PageHeader + spacing)
- `src/app/admin/productos/nuevo/page.tsx`
- `src/app/admin/productos/[id]/editar/page.tsx`
- `src/app/admin/inventario/page.tsx`
- `src/app/admin/cotizaciones/page.tsx`

### Productos CRUD
- `src/components/admin/products-manager.tsx`
- `src/components/admin/product-form.tsx`
- `src/components/admin/product-create-form.tsx`
- `src/components/admin/product-gallery-field.tsx`
- `src/components/admin/product-inventory-field.tsx`
- `src/components/admin/product-delete-button.tsx`

### Catálogo admin
- `src/components/admin/categories-manager.tsx`
- `src/components/admin/brands-manager.tsx` (inputs/cards ya parcialmente en 2B)

### Inventario y cotizaciones
- `src/components/admin/inventory-manager.tsx`
- `src/components/admin/quotes-manager.tsx`

### Vendedor / POS tienda
- `src/components/admin/seller-pos.tsx`

---

## 4. Cambios en productos admin

| Área | Cambio |
|------|--------|
| Lista `/admin/productos` | `AdminTableShell`, `AdminEmptyState`, cabeceras `tableHeadCell`, filas `tableRow`, acciones con bordes semánticos, edición rápida con acento copper |
| Modales bulk | Wrapper `AdminModal` (delegado desde `products-manager`) |
| Toolbar | Ya en 2B con `adminShell.cardToolbar`; paginación y “Limpiar” con tokens muted |
| Crear / editar | `AdminSectionCard`, `AdminFieldGroup`, `adminInputClass`, botones `AdminButton` |
| Galería | Tiles, empty state y botones de ícono con `border-border` / muted |
| Inventario inline | Sección card, inputs numéricos con feedback de tono (rojo/ámbar/neutral) |
| Eliminar | Modal `adminShell.modalOverlay` + `AdminButton` danger |

Validaciones, acciones server y flujos CRUD **sin cambios**.

---

## 5. Cambios en formularios

- Labels: `text-sm font-medium text-foreground/90` vía `AdminFieldGroup`
- Inputs/selects/textarea: `adminShell.input` / `adminSelectClass` / `adminTextareaClass`
- Secciones: `AdminSectionCard` con `sectionTitleSm` + `sectionDesc`
- Feedback error/éxito: `AdminFormFeedback` o banners semánticos existentes
- Toggles publicado/activo: `AdminToggle` o checkbox con copy claro
- Spacing entre bloques: `space-y-6` / cards `p-6` consistentes

---

## 6. Cambios en categorías/marcas

| Área | Cambio |
|------|--------|
| Inputs | `adminInputClass()` reemplaza clases zinc manuales |
| Árbol categorías | Panel lateral y paneles de detalle con `adminShell.card` / `cardSection` |
| Badges | `AdminStatusBadge` activo/inactivo (ya iniciado en 2B) |
| IconBtn árbol | Hover semántico (`muted-foreground`, `bg-card`) |
| Marcas | Toolbar y formulario ya usaban `adminShell` desde 2B; cards de lista coherentes |

Lógica de reorder, asignación de productos y CRUD **intacta**.

---

## 7. Cambios en inventario

| Área | Cambio |
|------|--------|
| Toolbar | `adminShell.cardToolbar`, búsqueda `adminInputClass`, selects `adminSelectClass` |
| Tabla | `AdminTableShell`, cabeceras unificadas, inputs por sucursal con tonos stock |
| Badges stock | `AdminStatusBadge` danger / pending / active con dot |
| Guardar fila | `AdminButton size="sm"` |
| Empty state | `AdminEmptyState` |
| Paginación | Select y botones con tokens shell |

No se implementó inventario automático ni integración Sicar.

---

## 8. Cambios en cotizaciones

| Área | Cambio |
|------|--------|
| Toolbar | Shell card + filtros semánticos |
| Lista | Item activo con `bg-copper/5` y ring copper; totales sobrios |
| Empty | `AdminEmptyState` |
| Detalle | Card shell, stats en `mutedBox`, contacto/nota con `groupLabel` |
| Badges estado | `AdminStatusBadge` (draft→neutral, sent→approved, closed→active, cancelled→danger) |

Lógica de compartir carrito, WhatsApp y cambio de estado **sin cambios**.

---

## 9. Cambios en vendedor/carrito tienda

| Área | Cambio |
|------|--------|
| Header / paneles | `border-border`, `bg-card`, `bg-muted/30` |
| Búsqueda productos | `adminShell.input` rounded-2xl |
| Grid productos | Cards `border-border bg-card` |
| Empty states | `adminShell.emptyState` |
| Resumen venta | Total con `typography.priceTotal` (escala sobria vs. 3xl anterior) |
| Modal confirmar venta | `adminShell.modalPanel` |

Ruta `/admin/vendedor` sigue redirigiendo a `/carrito`; no se agregó cobro POS real.

---

## 10. Cambios responsive

- **Layout admin:** columna en móvil, fila en `lg+`
- **Sidebar:** ancho completo arriba en móvil; links en fila con `overflow-x-auto`; sticky solo en desktop
- **Tablas:** `overflow-x-auto` en `tableShell`, `min-w-[960px]` en tablas anchas
- **Formularios:** padding `px-4 sm:px-6 md:px-8` del shell; grids existentes conservados
- **POS:** layout two-column en `lg` sin cambios de lógica

---

## 11. Qué NO se tocó

- Base de datos y migraciones Supabase
- Stripe live, webhook, checkout, pagos
- Sales OS: pedidos, fulfillment, disponibilidad, notificaciones cliente
- Auth / login / `requireAdmin`
- Sitio público, hero, checkout cliente
- Inventario automático, Sicar, envíos, direcciones
- WhatsApp API, emails nuevos, push notifications
- `seller-sale-summary.tsx` (modal de presentación — polish menor pendiente para 2D)

---

## 12. Riesgos pendientes

| Riesgo | Nota |
|--------|------|
| Restos zinc en archivos grandes | `categories-manager`, `product-create-form` (galería local), partes de `seller-pos` (botones CTA) aún tienen clases legacy; no afectan build ni flujos |
| Sidebar móvil horizontal | Mejora navegabilidad básica; no es menú hamburguesa completo |
| Tablas en pantallas muy estrechas | Requieren scroll horizontal — comportamiento esperado |
| Modal delete producto | Cierre al click en overlay — verificar UX en QA manual |

---

## 13. Recomendación para DESIGN-2D

1. **Pulir modales restantes** en categorías (`Modal` local → `AdminModal`) y `seller-sale-summary`
2. **Unificar botones CTA** en `seller-pos` con `AdminButton` (primary/accent/secondary)
3. **Empty states** en categorías/marcas cuando no hay ítems visibles tras filtro
4. **Formularios secundarios admin** no cubiertos: banners, servicios (si se activan)
5. **QA visual móvil** en iPhone SE / tablet para sidebar + tablas + POS
6. **Reducir zinc residual** con búsqueda dirigida, no replace mecánico

---

## 14. Resultado de `npm run build`

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
| 1 | Formularios productos más profesionales | ✅ |
| 2 | Categorías/marcas más consistentes | ✅ |
| 3 | Inventario mejor visualmente | ✅ |
| 4 | Cotizaciones admin mejoradas | ✅ |
| 5 | Vendedor/carrito tienda más claro | ✅ |
| 6 | Empty states mejor presentados | ✅ |
| 7 | Tablas/listas mejor estructura | ✅ |
| 8 | Responsive admin básico OK | ✅ |
| 9 | Sin cambios Sales OS | ✅ |
| 10 | Sin cambios BD | ✅ |
| 11 | Sin Stripe live | ✅ |
| 12–15 | Login, auth, pedidos, webhook intactos | ✅ |
| 16 | `npm run build` exit 0 | ✅ |
