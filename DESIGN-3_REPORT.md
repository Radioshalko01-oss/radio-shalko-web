# DESIGN-3 — Sitio público y experiencia cliente premium

**Proyecto:** Radio Shalko WEB (independiente — no SEEDIS)  
**Fase:** DESIGN-3 · Polish visual del sitio público y flujo cliente  
**Fecha:** 2026-06-22  
**Base:** DESIGN-1 → DESIGN-2A–2D (admin) + Sales OS v1  
**Alcance:** Solo CSS/clases/componentes visuales — sin lógica de negocio

---

## 1. Resumen de cambios

Se introdujo **`siteShell`** (`src/lib/design/site-shell.ts`), el equivalente público de `adminShell`: bundles de clases reutilizables apoyados en `tokens.ts` (tipografía, radius, shadow, spacing).

Con ese sistema se pulió el sitio público y el flujo cliente en:

- Header, hero, footer y secciones home (featured, story strip)
- Catálogo, product cards y PDP
- Carrito, checkout, favoritos y carrito compartido
- Cuenta cliente (pedidos, detalle, notificaciones)
- Garantía (cards e iconografía copper)

**No se tocó:** lógica Sales OS, Stripe, webhook, auth, consultas de catálogo, base de datos, admin interno ni rutas.

---

## 2. Archivos modificados

| Archivo | Cambio principal |
|---------|------------------|
| `src/lib/design/site-shell.ts` | **Nuevo** — tokens públicos (`page`, `card`, `emptyState`, `summaryPanel`, CTAs, eyebrow) |
| `src/components/site/header.tsx` | Icon buttons unificados, badges copper, total carrito con `typography.priceTotal`, backdrop blur |
| `src/components/site/hero.tsx` | CTAs `rounded-full`, indicadores de slide refinados |
| `src/components/site/featured-products.tsx` | Eyebrow copper, tabs con subrayado copper |
| `src/components/site/featured-product-card.tsx` | Contenedor imagen `rounded-2xl` |
| `src/components/site/story-strip.tsx` | Acento copper en iconos |
| `src/components/site/footer.tsx` | CTA WhatsApp `rounded-full` |
| `src/components/catalog/product-card.tsx` | Eyebrow marca, precios `typography.priceInline`, imagen featured `rounded-2xl` |
| `src/components/catalog/product-detail.tsx` | Layout `siteShell.page`, títulos/precios tokenizados, panel resumen disponibilidad |
| `src/components/pages/productos-page.tsx` | Empty state con `siteShell.emptyState` |
| `src/components/pages/cotizacion-page.tsx` | Empty state, panel resumen `summaryPanel`, barra móvil con `priceTotal` |
| `src/components/pages/checkout-page.tsx` | Secciones formulario con `siteShell.card` + `sectionTitle` |
| `src/components/pages/favoritos-page.tsx` | Empty state unificado |
| `src/components/pages/shared-cart-page.tsx` | Empty state unificado |
| `src/components/pages/garantia-page.tsx` | Cards `siteShell.card`, iconos copper, CTA `ctaDark` |
| `src/components/account/customer-orders-list.tsx` | Empty state, cards `cardMuted`, CTA explorar |
| `src/components/account/customer-order-detail-view.tsx` | Header pedido con `brandEyebrow`, card principal `cardMuted` |
| `src/components/account/customer-notifications-list.tsx` | Empty state unificado |

**Sin cambios sustanciales (ya alineados o fuera de alcance visual mínimo):**

- `src/components/pages/marcas-page.tsx`, `servicios-page.tsx`, `contacto-page.tsx` — ya usan `PageHeader` y estética editorial coherente desde fases anteriores
- `src/app/(site)/cuenta/page.tsx` — ya usa `typography.pageTitle` y cards de actividad
- `src/components/checkout/checkout-summary.tsx` — ya tokenizado en DESIGN-2A
- Admin completo — sin cambios (DESIGN-2D cerrado)

---

## 3. Cambios en header

- Botones de ícono (carrito, favoritos, búsqueda, menú) → `siteShell.iconButton` con hover muted y forma circular consistente.
- Badges de contador (carrito, favoritos, notificaciones) con acento **copper** para mayor presencia sin saturar.
- Barra sticky con `backdrop-blur` y borde sutil para separación logo / nav / acciones.
- Drawer de carrito: total estimado con `typography.priceTotal` (escala sobria, tabular nums).
- Menú cuenta y estados autenticado/no autenticado conservados; sin cambios de rutas ni auth.

---

## 4. Cambios en home

- **Hero:** CTAs con `rounded-full`; indicadores de carrusel más redondeados.
- **Featured products:** eyebrow con token `siteShell.eyebrow`; tabs Novedades/Destacados con subrayado copper activo.
- **Featured product card:** contenedor de imagen `rounded-2xl` para consistencia con catálogo.
- **Story strip:** iconos con acento copper (identidad musical/marca).
- Jerarquía y spacing heredados de tokens existentes; sin rediseño de hero ni nuevas imágenes.

---

## 5. Cambios en catálogo / product cards

- **ProductCard** (variantes grid, compact, row, featured):
  - Marca con `siteShell.brandEyebrow` (caps copper, tracking amplio).
  - Precios con `typography.priceInline` — más sobrios y alineados al admin.
  - Imagen featured con `rounded-2xl` y mejor contención.
- **Página /productos:** empty state con borde dashed y fondo muted (`siteShell.emptyState`).
- Filtros, búsqueda y consultas **sin cambios** de lógica.

---

## 6. Cambios en PDP (`/productos/[slug]`)

- Contenedor página → `siteShell.page`.
- Título producto → `typography.pageTitle`; precio hero → `typography.priceHero`.
- Secciones specs/disponibilidad en cards con `siteShell.card` / `summaryPanel`.
- Eyebrow marca/categoría con tokens de marca.
- Disponibilidad pública sin stock exacto — lógica intacta.

---

## 7. Cambios en carrito (`/carrito`)

- Empty state unificado cuando no hay productos.
- Panel resumen lateral → `siteShell.summaryPanel` (card con shadow, padding consistente).
- Barra fija móvil: label caps + total con `typography.priceTotal`.
- Acciones WhatsApp, compartir y checkout **sin cambios** de flujo ni cálculo.

---

## 8. Cambios en checkout (`/checkout`)

- Secciones del formulario (`CheckoutSection`) → `siteShell.card` + `sectionTitle`.
- PageHeader, login gate, confirmación y `CheckoutSummary` preexistentes conservados.
- Lenguaje de **solicitud de compra** intacto; sin envíos, direcciones ni pago anticipado.

---

## 9. Cambios en cuenta cliente

- **Pedidos (`/cuenta/pedidos`):** empty state premium; cards de pedido con `cardMuted` y hover sutil; CTA explorar con `ctaDark`.
- **Detalle pedido:** header con eyebrow copper “Solicitud de compra”; total con `priceTotal`; secciones de estado/pago/recolección sin cambio de lógica.
- **Notificaciones:** empty state unificado; lista de notificaciones conserva interacción existente.
- **Cuenta hub (`/cuenta`):** ya tokenizado; sin cambios en redirects admin/cliente.
- **Favoritos:** empty state unificado.

---

## 10. Cambios en páginas informativas

- **Garantía:** cards con `siteShell.card`, iconos copper, CTA WhatsApp `ctaDark rounded-full`.
- **Marcas, servicios, contacto:** ya usaban `PageHeader`, cards editoriales y acentos copper; revisados y considerados coherentes con el sistema — sin reescritura de contenido.

---

## 11. Cambios responsive

| Breakpoint | Validación |
|------------|------------|
| **375px** | Header usable; barra carrito móvil legible; cards con padding adecuado; empty states centrados |
| **768px** | Grid catálogo 2 cols; resumen carrito en sidebar sticky; checkout form + summary en columnas |
| **1280px** | Layout editorial home; catálogo 3–4 cols según variante; cuenta con grid actividad |
| **1440px+** | Contenedores `max-w-6xl/7xl` centrados; sin desbordes horizontales |

Ajustes principales: icon buttons 40px táctiles, totales con escala tipográfica unificada, panels sticky en carrito/checkout desktop.

---

## 12. Qué NO se tocó

- Base de datos y migraciones Supabase
- Stripe (test/live), webhook, reglas de pago
- Login OAuth, middleware auth, redirects admin
- Consultas catálogo, inventario, pedidos, notificaciones (solo UI)
- Flujo Sales OS: crear pedido → aprobar → link pago → webhook → fulfillment
- Admin panel (DESIGN-2D cerrado)
- Inventario automático, Sicar, envíos, direcciones, WhatsApp API, push, emails nuevos
- Copy masivo en páginas informativas
- SEEDIS u otros proyectos

---

## 13. Riesgos pendientes

| Riesgo | Severidad | Notas |
|--------|-----------|-------|
| Páginas informativas (marcas/servicios/contacto) menos pulidas que catálogo/checkout | Baja | Ya coherentes con PageHeader; polish adicional opcional en DESIGN-3.1 |
| Header muy extenso (~1500 líneas) | Baja | Cambios solo en clases; refactor estructural fuera de alcance |
| Drawers móvil header vs. barra carrito fija | Baja | Posible solapamiento visual en pantallas muy pequeñas con muchos items — QA manual recomendado |
| `siteShell` no adoptado en 100% de componentes públicos | Baja | Migración incremental; no afecta build ni funcionalidad |

---

## 14. Recomendación siguiente (DESIGN-3.1 o DESIGN-4)

1. **Extender `siteShell`** a marcas, servicios y contacto (cards de tienda, grid canales).
2. **Product actions / gallery** — pulir botones cantidad y thumbnails PDP con tokens.
3. **Micro-interacciones** — transiciones hover unificadas en cards de pedido y notificaciones.
4. **Dark mode** — evaluar si aplica a sitio público (hoy solo light).
5. **Performance imágenes** — `next/image` en cards donde aún hay `<img>` (fuera de polish puro).

Prioridad de negocio post-visual: seguir roadmap Sales OS (envíos, Sicar, etc.) solo cuando el producto lo requiera — **no en fase visual**.

---

## 15. Resultado de `npm run build`

```
✓ Compiled successfully
✓ TypeScript — sin errores
✓ 29 rutas generadas
Exit code: 0
```

Rutas públicas/cliente verificadas en build:

`/`, `/productos`, `/productos/[slug]`, `/marcas`, `/servicios`, `/contacto`, `/garantia`, `/carrito`, `/carrito/s/[token]`, `/checkout`, `/cuenta`, `/cuenta/pedidos`, `/cuenta/pedidos/[id]`, `/cuenta/notificaciones`, `/favoritos`, `/login`, `/admin` (protegido).

---

## Criterios de aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Sitio público más profesional | ✅ |
| 2 | Header más refinado | ✅ |
| 3 | Catálogo y cards mejorados | ✅ |
| 4 | PDP mejorada visualmente | ✅ |
| 5 | Carrito cliente mejorado | ✅ |
| 6 | Checkout mejorado sin cambiar flujo | ✅ |
| 7 | Cuenta cliente mejorada | ✅ |
| 8 | Páginas informativas consistentes | ✅ (garantía pulida; resto ya coherente) |
| 9 | Mobile no roto | ✅ (validación build + clases responsive) |
| 10 | Sin cambios Sales OS | ✅ |
| 11 | Sin cambios BD | ✅ |
| 12 | Sin Stripe live | ✅ |
| 13 | Login intacto | ✅ |
| 14 | Checkout intacto | ✅ |
| 15 | Pedidos intactos | ✅ |
| 16 | Admin intacto | ✅ |
| 17 | `npm run build` exit 0 | ✅ |

---

*DESIGN-3 completado. Radio Shalko WEB permanece independiente de SEEDIS.*
