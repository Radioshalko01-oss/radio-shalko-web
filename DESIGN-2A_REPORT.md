# DESIGN-2A — Base visual, tokens, PageHeader y jerarquía tipográfica

**Proyecto:** Radio Shalko WEB (independiente — no SEEDIS)  
**Fase:** DESIGN-2A · Implementación incremental  
**Fecha:** 2026-06-22  
**Base:** `DESIGN-1_AUDIT_RADIO_SHALKO.md`  
**Sales OS v1:** sin cambios de lógica de negocio

---

## 1. Resumen de cambios

Se implementó la primera capa del sistema visual acordada en DESIGN-1:

- **Tokens reutilizables** (`src/lib/design/tokens.ts`) para tipografía, espaciado, radios, sombras y color semántico.
- **Componente `PageHeader`** con variantes `site`, `account` y `admin`.
- **H1 unificados** en páginas públicas, cliente y admin principales (escala `text-2xl md:text-3xl` + Fraunces).
- **Totales/precios reducidos** donde eran excesivos (carrito compartido, resumen carrito, detalle pedido).
- **Botón base shadcn** alineado a `rounded-lg` (CTAs `rounded-full` del sitio sin cambios).

No se tocó flujo Sales OS, base de datos, Stripe live ni rediseño del hero.

---

## 2. Archivos creados

| Archivo | Propósito |
|---------|-----------|
| `src/lib/design/tokens.ts` | Tokens Tailwind reutilizables |
| `src/components/ui/page-header.tsx` | Encabezado de página unificado |

---

## 3. Archivos modificados

### Sistema base
- `src/components/ui/button.tsx` — `rounded-md` → `rounded-lg` en variantes base

### Sitio público
- `src/components/pages/productos-page.tsx`
- `src/components/pages/marcas-page.tsx`
- `src/components/pages/contacto-page.tsx`
- `src/components/pages/garantia-page.tsx`
- `src/components/pages/servicios-page.tsx`
- `src/components/pages/favoritos-page.tsx`

### Cliente
- `src/components/pages/cotizacion-page.tsx`
- `src/components/pages/checkout-page.tsx`
- `src/components/pages/shared-cart-page.tsx`
- `src/components/checkout/checkout-summary.tsx`
- `src/app/(site)/cuenta/page.tsx`
- `src/app/(site)/cuenta/pedidos/page.tsx`
- `src/app/(site)/cuenta/notificaciones/page.tsx`
- `src/components/account/customer-order-detail-view.tsx`

### Admin
- `src/app/admin/page.tsx`
- `src/app/admin/pedidos/page.tsx`
- `src/app/admin/productos/page.tsx`
- `src/app/admin/categorias/page.tsx`
- `src/app/admin/marcas/page.tsx`

---

## 4. Tokens definidos

### Tipografía (`typography`)
| Token | Clases | Uso |
|-------|--------|-----|
| `pageTitle` | `font-display text-2xl md:text-3xl font-semibold` | H1 de página |
| `sectionTitle` | `font-display text-lg md:text-xl font-semibold` | H2 de sección |
| `eyebrow` | `text-xs uppercase tracking-[0.14em]` | Label sobre título |
| `body` / `bodySmall` / `muted` | Inter, sm/base | Cuerpo y secundario |
| `label` / `labelCaps` | uppercase, tracking | Labels de formulario/resumen |
| `button` | `text-sm font-medium` | Texto de botón |
| `priceHero` | `text-xl md:text-2xl` display | Precio destacado |
| `priceInline` | `text-base` display | Precio en listas |
| `priceTotal` | `text-xl md:text-2xl` display | Totales carrito/checkout |

### Espaciado (`spacing`)
`pageX`, `pageTop`, `pageContainer`, `accountContainer`, `accountContainerWide`, `section`, `sectionLg`, `cardPadding`, `formStack`, `stackSm`

### Radios (`radius`)
`card` (2xl), `cardAdmin` (xl), `button` (full), `buttonAdmin` (lg), `input` (lg), `badge` (full)

### Sombras (`shadow`)
`card`, `cardStrong`, `dropdown`, `adminPanel`

### Color (`color`)
`textPrimary`, `textMuted`, `borderSoft`, `surface`, `accent`, `accentBg`, `success`, `warning`, `danger`, `adminText`, `adminMuted`, `adminBorder`

---

## 5. Dónde se aplicó PageHeader

| Ruta / componente | Variante | Notas |
|-------------------|----------|-------|
| `/productos` | `site` | eyebrow + título + descripción |
| `/marcas` | `site` | |
| `/contacto` | `site` | |
| `/garantia` | `site` | H1 reducido de 4xl/5xl a escala estándar |
| `/servicios` | `site` | |
| `/favoritos` | `site` | H1 reducido de 3xl/5xl |
| `/carrito` | `account` | sin back link (nav propia) |
| `/checkout` | `account` | back link → carrito |
| `/cuenta/pedidos` | `account` | back link → cuenta |
| `/cuenta/notificaciones` | `account` | back link → cuenta |
| `/admin` | `admin` | actions: Nuevo producto |
| `/admin/pedidos` | `admin` | |
| `/admin/productos` | `admin` | |
| `/admin/categorias` | `admin` | |
| `/admin/marcas` | `admin` | |

**No PageHeader completo (casos especiales):**
- `/cuenta` — encabezado con avatar; solo se aplicó `typography.pageTitle` al H1.
- Home, PDP, hero — fuera de alcance DESIGN-2A.
- Carrito compartido — layout centrado con logo; solo se ajustó total.

---

## 6. Páginas ajustadas

- **Garantía:** H1 de `text-4xl/5xl` → escala page title estándar.
- **Favoritos:** H1 de `text-3xl/5xl` → escala estándar.
- **Productos, marcas, contacto, servicios:** H1 de `text-3xl/4xl` → escala estándar.
- **Admin dashboard:** H1 con Fraunces; stats de `text-3xl` → `text-2xl`.
- **Admin pedidos/productos/categorías/marcas:** H1 unificado con PageHeader.

---

## 7. Precios/totales ajustados

| Ubicación | Antes | Después |
|-----------|-------|---------|
| Carrito compartido — total | `text-3xl sm:text-4xl` | `typography.priceTotal` (`text-xl md:text-2xl`) |
| Carrito — resumen sidebar | `text-2xl md:text-3xl` | `typography.priceTotal` |
| Checkout — resumen sidebar | `text-xl` (ya OK) | token `priceTotal` (consistente) |
| Detalle pedido cliente — total | `text-2xl` sans | `typography.priceTotal` display |
| Admin dashboard stats | `text-3xl` | `text-2xl` |

**Sin cambio de cálculos** — solo presentación visual.

---

## 8. Qué NO se tocó

- Home / hero principal
- Header (~1500 líneas)
- PDP (detalle producto)
- Login
- Flujo Sales OS (checkout logic, pedidos, pagos, webhook, notificaciones logic)
- Admin CRUD interno (products-manager, orders-manager, formularios)
- Admin detalle pedido, inventario, vendedor POS
- Base de datos / migraciones
- Stripe live
- `globals.css` tokens OKLCH existentes (no reescritura global Tailwind)

---

## 9. Riesgos pendientes

| Riesgo | Estado |
|--------|--------|
| Admin sigue usando `zinc-*` en cards/tablas | Pendiente DESIGN-2B |
| CTAs mixtos (`rounded-full` vs `rounded-lg`) en flujos secundarios | Parcial — solo shadcn Button base |
| Header mobile denso | Fuera de alcance 2A |
| Servicios — H3 internos aún `text-3xl/4xl` | DESIGN-2C |
| PageHeader no usado en detalle pedido admin/cliente | Evaluar en 2B con timeline |

---

## 10. Recomendación para DESIGN-2B

1. **Migrar admin shell** — reemplazar `zinc-*` por tokens semánticos + `--admin-surface` cálido.
2. **Sidebar admin** — active state copper, Fraunces en nav group labels.
3. **AdminButton** — variante primaria con `radius.buttonAdmin` + primary/copper hover.
4. **Badges pedido unificados** — un mapa, dos temas (cliente/admin).
5. **SectionLabel** — componente para labels caps (`typography.label`).
6. **Detalle pedido** — PageHeader o timeline vertical para jerarquía.

---

## 11. Resultado de `npm run build`

```
✓ Compiled successfully
✓ TypeScript OK
✓ 29 rutas
Exit code: 0
```

---

*DESIGN-2A · Radio Shalko WEB · Base visual implementada · Siguiente: DESIGN-2B admin shell*
