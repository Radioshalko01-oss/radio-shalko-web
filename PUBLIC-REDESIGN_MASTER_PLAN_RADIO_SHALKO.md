# PUBLIC-REDESIGN — Master Plan · Sitio público Radio Shalko WEB

**Proyecto:** Radio Shalko WEB (independiente — no SEEDIS)
**Fase:** PUBLIC-REDESIGN-1A · Documento maestro (estrategia, auditoría y planeación)
**Fecha:** 2026-06-29
**Base:** Sales OS v1 + DESIGN-1…3.1 + DATA-1/2
**Estado:** Solo planeación — **no se implementó rediseño ni se tocó código** (salvo este documento)

> Esta fase NO implementa. Es la guía maestra para ordenar el rediseño del sitio público. El **admin ya fue aprobado** por el usuario y **no se rediseña**.

---

## 1. Resumen ejecutivo

Radio Shalko WEB tiene una base técnica sólida y aprobada en el **panel admin**, pero el **sitio público** aún no alcanza el nivel de marca global / premium que el usuario espera. El polish previo (DESIGN-3/3.1) unificó tokens y limpió copy, pero **no resolvió problemas estructurales**: comportamiento del header, calidad de imágenes, experiencia mobile-first real, megamenús, organización del catálogo, filtros de precio, página de marcas, PDP y footer.

Este documento:

- Audita el sitio público pantalla por pantalla (código real, no suposiciones).
- Define principios visuales y responsive.
- Especifica el rediseño de header, megamenús, imágenes, home, catálogo, filtros, marcas, PDP, páginas informativas y footer.
- Propone un **roadmap por fases** (`PUBLIC-REDESIGN-1B` … `2D`).
- Lista explícitamente **qué no tocar**.

**Próxima fase recomendada:** `PUBLIC-REDESIGN-1B — Header + navegación + megamenús` (mayor impacto percibido y desbloquea el resto), apoyada de inmediato por `1C — Responsive foundation`.

---

## 2. Problema principal

El sitio público **funciona** pero **no se siente de marca**. Tres causas raíz:

1. **Estructura heredada del mock**: el sitio fue construido para iterar rápido con datos de demostración; la jerarquía visual y la navegación no fueron diseñadas como producto final.
2. **Desktop-first**: el layout se adaptó a móvil al final en lugar de diseñarse mobile-first; en celular (donde estará la mayoría de usuarios) la experiencia es secundaria.
3. **Falta de dirección de arte**: imágenes inconsistentes/pixeladas, sin pipeline ni tamaños por dispositivo; componentes (header, megamenús, filtros, footer) resueltos funcionalmente pero sin acabado editorial.

---

## 3. Estado actual del sitio público

| Capa | Estado | Nota |
|------|--------|------|
| Datos catálogo | Supabase | Productos aún **mock** (DATA-1/2); se reemplazan luego |
| Tokens / design system | `tokens.ts`, `site-shell.ts` | Buena base; subutilizada en público |
| Header | Funcional | **Siempre sólido**, sin integración con hero |
| Hero | Funcional | `<img>` crudas, 1 PNG 4K, carrusel opacidad |
| Catálogo / filtros | Funcional | Slider de precio sin inputs min/max; layout con espacio mal usado |
| Megamenús | Funcional | Listas de texto largas, muchos leafs sin filtro real |
| PDP | Funcional | Estructura genérica; copy con "envío a domicilio" (corregido parcialmente) |
| Marcas | Funcional | Chips + secciones; no se siente exploración de marca |
| Servicios/Contacto/Garantía | Funcional | Mejorados en 3.1; aún densos |
| Footer | Funcional | Saturado; envío ya corregido a recolección |
| Build | Verde | `npm run build` exit 0 |

---

## 4. Lo que sí se conserva

- **Sales OS v1** completo (carrito, checkout solicitud, pedidos, webhook, pagos test).
- **Admin** (aprobado) y su design system (`adminShell`, `AdminButton`).
- **Tokens públicos** (`tokens.ts`, `site-shell.ts`) — se extienden, no se reemplazan.
- **Rutas y slugs** existentes.
- **Identidad de marca**: paleta copper, tipografía display, "Make noise, make history", lenguaje de *solicitud* + *recolección en tienda*.
- **Taxonomía real** (3 categorías, 13 subcategorías, 2 sucursales).
- **Datos desde Supabase** en `/`, `/productos`, PDP, marcas.

---

## 5. Lo que debe rediseñarse

1. Header + comportamiento scroll + navegación.
2. Megamenús (productos y marcas).
3. Hero + sistema de imágenes.
4. Home (estructura editorial).
5. Catálogo (layout + product cards + toolbar).
6. Filtros (especialmente rango de precio min/max).
7. Página de marcas (exploración, no lista).
8. PDP (galería, confianza, recolección, specs, relacionados).
9. Servicios / Contacto / Garantía (presentación).
10. Footer (minimalista, alineado a recolección).
11. Experiencia responsive real (mobile-first).

---

## 6. Feedback del usuario organizado por área

| # | Área | Dolor reportado | Traducción a requisito |
|---|------|-----------------|------------------------|
| 1 | Header | Fijo siempre, sin transición, poco pro | Estado hero ↔ estado sticky con transición de fondo |
| 2 | Imágenes/Hero | Pixeladas, no pro, riesgo IA | Pipeline de imágenes + tamaños por dispositivo |
| 3 | Responsive | Optimizado a PC; móvil flojo | Mobile-first real por breakpoint |
| 4 | Megamenús | Listas planas | Menús editoriales con jerarquía y columnas |
| 5 | Catálogo | Desacomodado, espacio mal usado | Layout limpio y jerarquizado |
| 6 | Marcas | No pro, chips genéricos | Experiencia de exploración de marcas |
| 7 | Filtros | Precio una sola dirección | Rango min/max (slider doble + inputs) |
| 8 | Datos | Mock, no oficiales | Diseño agnóstico al contenido (no inventar) |
| 9 | PDP | No agrada | Estructura comercial premium + recolección |
| 10 | Info pages | Genéricas | Limpias, premium, confiables |
| 11 | Footer | Saturado, envíos | Minimalista, pickup, contacto real |
| 12 | Admin | Le encanta | **No tocar** |

---

## 7. Principios visuales del rediseño

**Debe ser:**

- **Premium pero no ostentoso** — espacio en blanco, tipografía cuidada, copper como acento, no decoración.
- **Musical sin cliché** — sin notas musicales genéricas ni estridencia; el producto y la fotografía cuentan la historia.
- **Editorial** — secciones con ritmo, jerarquía y aire, no rejillas uniformes interminables.
- **Limpio / minimalista** — menos elementos, mejor resueltos.
- **Confiable y cálido** — 40+ años de tienda real; lenguaje humano, no corporativo frío.
- **Técnico pero humano** — specs claras sin abrumar.
- **Fuerte en imagen** — la fotografía es protagonista, no relleno.
- **Enfocado en descubrimiento** — invita a explorar categorías y marcas.
- **Mobile-first** — diseñado primero para 375px.
- **Información clara antes que saturación**.

**NO debe ser:**

- Plantilla genérica / theme de marketplace.
- Ecommerce saturado tipo grandes superficies.
- Diseño con "olor a IA" (gradientes vacíos, stock plástico, copy de relleno).
- Exceso de texto, animaciones o menús planos.
- Imágenes pixeladas o inventadas.
- Promesas falsas (envíos a domicilio si no existen).

---

## 8. Principios responsive

- **Mobile-first real**: cada componente se diseña primero a 375px y se enriquece hacia arriba, no al revés.
- **Jerarquía por dispositivo**, no escalado uniforme: lo que es megamenú en desktop es drawer/acordeón en móvil; lo que es sidebar de filtros es bottom-sheet en móvil.
- **Touch targets ≥ 44px**, tipografía legible sin zoom, sin scroll horizontal.
- **Imágenes por breakpoint** (art direction), no una sola imagen reescalada.
- **Performance como diseño**: LCP del hero priorizado; lazy load del resto.
- **Pulgar-first** en móvil: acciones primarias al alcance (CTA, carrito).

---

## 9. Diagnóstico por pantalla

### 9.1 Header (`src/components/site/header.tsx`)
- `fixed inset-x-0 top-0` con `bg-background/95 backdrop-blur-md` **siempre activo**; sobre el hero se ve una barra blanca sólida en lugar de integrarse.
- `scrolled` (>24px) solo cambia `border` y `shadow`, no el fondo → no hay transición de estado perceptible.
- Mega navegación al centro con hover; en móvil drawer. Funciona, pero sin acabado premium.

### 9.2 Hero (`src/components/site/hero.tsx`)
- 3 slides con `<img>` crudas (`hero-guitars.png` 3840×2160, `hero-pianos.jpg`, `hero-drumkit.png`), carrusel por opacidad cada 6s.
- Sin `next/image`, sin `srcset`/art direction → riesgo de peso y pixelado según dispositivo.
- `h-[100svh]` correcto para móvil; overlay gradiente uniforme.

### 9.3 Catálogo (`src/components/pages/productos-page.tsx`)
- `PageHeader` "Productos" + toolbar sticky; grid 2–4 cols.
- Sidebar de filtros desktop / Sheet móvil — OK estructuralmente.
- Conteo "Mostrando X de Y" solo visible en `lg`. Espacio superior amplio poco aprovechado (feedback de "desacomodado").

### 9.4 Filtros (`FiltersPanel`)
- Categorías como acordeón (toggle abre subcats y a la vez marca la categoría — acoplamiento confuso).
- Marca: lista con checkboxes y scroll.
- **Precio: `Slider` Radix de dos thumbs** (sí es rango), pero **sin inputs numéricos min/max** ni edición directa → el usuario percibe que "solo se mueve en una dirección".

### 9.5 PDP (`src/components/catalog/product-detail.tsx`)
- Galería + info + panel disponibilidad por sucursal (cualitativa) + specs + relacionados.
- Copy "envío a domicilio" corregido a recolección en 3.1; revisar que no reaparezca.
- Estructura correcta pero genérica; falta jerarquía comercial y bloques de confianza/garantía.

### 9.6 Marcas (`src/components/pages/marcas-page.tsx`)
- Índice sticky de chips + secciones por marca con grid de productos.
- Se siente lista, no exploración; depende de `BRANDS` mock como fallback.

### 9.7 Servicios / Contacto / Garantía
- Mejorados en 3.1 (cards `siteShell`, copper). Aún densos; contacto usa iframes de mapa (peso/ruido).

### 9.8 Footer (`src/components/site/footer.tsx`)
- 4 columnas + tiendas + legal + socials. Saturado.
- Link de envíos ya cambiado a "Recolección en tienda" (3.1); validar que no queden referencias a envíos.

### 9.9 Megamenús (`PRODUCT_MENU` en header)
- Columnas por categoría con muchos leafs; varios sin `sub` real → enlazan a `/productos` sin filtrar (parecen activos pero no filtran).
- Menú de marcas: lista plana.

### 9.10 Cuenta / pedidos / notificaciones
- Ya consistentes (DESIGN-3). No prioritarios; solo coherencia con nuevo sistema.

---

## 10. Estrategia de header / navegación (→ 1B)

**Desktop**
- **Estado inicial (sobre hero):** fondo transparente, logo y nav en blanco, sin borde/sombra; integrado a la imagen.
- **Estado sticky (scroll > ~64px):** fondo sólido (`bg-background/90` + blur), logo a color, borde inferior sutil, sombra ligera; transición `opacity/background` ~200–300ms.
- Solo páginas con hero usan estado transparente; páginas internas arrancan en estado sólido.
- Logo escala ligeramente al hacer sticky; nav central; a la derecha buscador, cuenta, favoritos, carrito con badges copper.

**Mobile**
- Barra compacta: logo + iconos (buscar, carrito, menú).
- Menú en **drawer / bottom sheet** con navegación clara, búsqueda arriba, accesos a cuenta/favoritos, sin saturación.
- Megamenús → acordeones por familia dentro del drawer.

**Accesibilidad:** focus visible, `aria-expanded`, navegación por teclado, cierre con `Esc`, contraste suficiente en estado transparente (overlay/scrim si hace falta).

---

## 11. Estrategia de megamenús (→ 1B)

**Productos**
- Estructura por **familias** (Instrumentos / Accesorios / Equipos de Audio) en columnas.
- Cada columna: título de familia + grupos (Cuerda, Teclados, Percusión, Viento…) con jerarquía visual.
- **Solo mostrar leafs con filtro real** (que existan en Supabase); los "próximos" se ocultan o se marcan claramente como no navegables.
- Una **categoría/imagen destacada** + CTA "Ver todo".
- Estados hover suaves; versión móvil = acordeón.

**Marcas**
- Marcas **destacadas** con logo arriba.
- Acceso "Ver todas las marcas".
- Agrupación por inicial o por categoría (no lista plana).
- Conteos **solo si vienen de Supabase** (no del mock).

---

## 12. Estrategia de imágenes (→ 1D)

### Inventario de necesidades

| Tipo | Criticidad | Versiones por dispositivo |
|------|-----------|---------------------------|
| Hero principal (2–3) | Crítica | mobile (vertical/cuadrada), tablet, desktop (wide) |
| Categorías (baterías, guitarras acústicas/eléctricas, bajos, docerolas, violines, teclados, ukuleles, bafles/audio, accesorios) | Alta | mobile + desktop |
| Producto (principal + galería) | Crítica | 1:1 / 4:5, alta resolución |
| Marcas (logos) | Media | SVG/PNG transparente |
| Editorial (servicios, historia) | Baja-Media | opcional |
| Footer | Decorativa | preferible sin imagen |

### Pipeline recomendado para Radio Shalko

**Ruta final recomendada: C (composición híbrida) con base A (fotografía real) y D (motion sutil) como capa posterior.**

- **A — Fotografía real profesional:** estándar para **producto** (lo que se vende debe ser real). Fondo limpio, set consistente, 2000px+.
- **B — IA solo como boceto conceptual:** mood boards, encuadres, pruebas de composición. **Nunca** como imagen final visible ni para inventar productos/marcas.
- **C — Composición híbrida (Photoshop/Lightroom/Figma):** hero y categorías a partir de fotos reales retocadas/compuestas; control de color y limpieza.
- **D — Motion sutil / cinemagraph:** después de tener la imagen base; loops cortos `MP4/WebM` para hero (≤ 3–5s, sin audio, `poster` estático).

### Formatos y entrega
- **AVIF/WebP** para estáticas; `MP4/WebM` para motion.
- `next/image` con `sizes`/`srcset` y **art direction** por breakpoint (`<picture>` o múltiples sources).
- Hero: `priority`/`fetchPriority=high` solo en el primer slide; resto lazy.
- Presupuesto: hero ≤ ~250–400KB por variante; evitar PNG 4K como ahora.

### Herramientas sugeridas
- **Figma** (layout, especificación de tamaños), **Photoshop/Lightroom** (retoque), **Midjourney/Flux/ChatGPT Images** (solo concepto), **After Effects / Rive / Lottie** (motion/microinteracciones si aplica).

**Reglas:** no generar imágenes en esta fase · no usar imágenes con aspecto IA · no usar pixeladas · no inventar marcas/productos.

---

## 13. Estrategia de home (→ usa 1B/1D, integra en 2x)

- **Hero**: evaluar reemplazar carrusel automático por **1 hero editorial fuerte** (imagen/motion) + accesos directos; si se mantiene carrusel, máximo 2–3 slides con control manual y art direction.
- **Categorías**: bloque editorial con imágenes reales por categoría (no grid genérico), mobile-first.
- **Productos destacados**: selección curada (no solo por precio); cuando haya datos reales.
- **Marcas**: marquee/credibilidad con logos reales.
- **Servicios / confianza**: bloque breve (taller, asesoría, garantía, recolección).
- **Historia Radio Shalko**: tira editorial corta (40+ años).
- **Transición a footer** coherente.
- Conteos y datos **desde Supabase** (eliminar `countProducts` mock — ver §22 mock residual).

---

## 14. Estrategia de catálogo y filtros (→ 2A)

**Catálogo**
- Header de catálogo compacto con título claro y conteo visible (también en móvil).
- Toolbar: vista (grid/list), orden, filtros; sticky bien calibrado.
- Grid mobile-first (2 col móvil → 3–4 desktop); product cards consistentes (imagen contenida, marca, nombre, precio, acción).
- Empty states claros (ya existe base con `siteShell.emptyState`).

**Filtros**
- **Desktop:** sidebar refinado; categoría → subcategoría con relación clara (separar "expandir" de "filtrar").
- **Mobile:** drawer/bottom-sheet con aplicar/limpiar.
- **Precio:** **slider doble + inputs numéricos min/max** sincronizados (resuelve el dolor #7).
- Marca: checkboxes limpios con búsqueda si la lista crece.
- Disponibilidad pública (Disponible / Consultar), **sin stock exacto**.
- **Chips activos** + "Limpiar filtros" siempre accesibles.

---

## 15. Estrategia de marcas (→ 2A)

- Convertir `/marcas` en **exploración**: hero breve, marcas **destacadas** con logo, navegación por inicial/categoría, cards por marca con acceso a `/productos?brand=`.
- **Conteos solo desde Supabase** (no `BRANDS` mock).
- Estado "próximamente" elegante para marcas sin productos.
- Mobile: carrusel/grid de logos + lista navegable.

---

## 16. Estrategia de PDP (→ 2B)

**Desktop:** galería izquierda (principal + thumbs) / info derecha (marca, título, precio, CTA principal, acciones secundarias).
**Mobile:** galería full-width arriba, info debajo, CTA fijo accesible.

Bloques:
- Marca / categoría (links).
- Precio (jerarquía clara, `priceHero`).
- **CTA principal** (agregar / solicitar) + secundarias (favorito, WhatsApp, llamar).
- **Disponibilidad por sucursal sin stock exacto** (Disponible / Consultar).
- **Recolección en tienda** (Chalco / Amecameca) — mensaje claro de pickup.
- **Garantía / confianza** (bloque breve).
- Descripción comercial + **ficha técnica** (specs reales).
- **Productos relacionados**.

**Copy conceptual a corregir/garantizar:**
- ❌ Envío a domicilio (no existe) · ❌ bodega · ❌ traslados internos · ❌ stock exacto público.
- ✅ Solicitud + recolección en tienda.

---

## 17. Estrategia de servicios / contacto / garantía (→ 2C)

**Servicios:** estructura clara — taller/servicio técnico, asesoría, apartado, garantía; CTAs a WhatsApp/contacto. Reemplazar copy con sabor a "envíos" por recolección.
**Contacto:** sucursales (dirección, horarios reales, teléfono, WhatsApp); simplificar o diferir mapas (peso/ruido); jerarquía clara, sin saturar.
**Garantía:** cobertura, proceso, requisitos, CTA; lenguaje confiable y claro.

---

## 18. Estrategia de footer (→ 2C)

- **Minimalista**: reducir columnas y enlaces a lo útil.
- Contacto real (WhatsApp, teléfono, email), **horarios reales**, **sucursales** (Chalco, Amecameca).
- **Recolección en tienda** en lugar de política de envíos (ya iniciado en 3.1).
- **Sin newsletter falso**, sin enlaces muertos, sin promesas de envío.
- Legal (privacidad, términos) compacto.
- Jerarquía clara, mucho aire, acento copper sobrio.

---

## 19. Sistema de breakpoints

| Token | Ancho | Enfoque |
|-------|-------|---------|
| **mobile** | 375px | Diseño base. 1–2 col, drawer nav, CTA al alcance del pulgar, hero vertical |
| **tablet** | 768px | 2–3 col, nav puede mostrar más, filtros en sheet o sidebar colapsable |
| **laptop** | 1280px | Megamenús completos, sidebar filtros, grid 3–4 col |
| **desktop+** | 1440px+ | Contenedores `max-w-7xl` centrados, art direction wide, sin estiramiento excesivo |

Por componente: header, nav, hero, megamenú, catálogo, filtros, PDP, carrito, checkout, info, footer — cada uno con comportamiento definido por breakpoint en su fase respectiva (no escalado uniforme).

---

## 20. Roadmap de implementación

> Cada fase es independiente, con build verde y QA. Orden por impacto y dependencias.

### PUBLIC-REDESIGN-1A — Documento maestro *(esta fase)*
- **Objetivo:** estrategia y plan. **Tocar:** solo este `.md`. **No tocar:** código. **Criterio:** documento completo + build verde.

### PUBLIC-REDESIGN-1B — Header + navegación + megamenús
- **Objetivo:** header con estado hero↔sticky, transición de fondo, nav premium, megamenús editoriales (productos y marcas), versión móvil en drawer.
- **Archivos probables:** `src/components/site/header.tsx`, posible `header-mega.tsx`/`header-mobile.tsx` nuevos, `site-shell.ts`.
- **Tocar:** header y subcomponentes de navegación. **No tocar:** lógica auth, rutas, carrito/quote hooks, admin.
- **Riesgos:** regресión en buscador/carrito/cuenta; SSR de estado scroll; accesibilidad.
- **Criterios:** header transparente sobre hero y sólido en scroll con transición; megamenús con jerarquía; móvil limpio; build verde; sin romper carrito/login.

### PUBLIC-REDESIGN-1C — Responsive foundation pública
- **Objetivo:** base mobile-first transversal (contenedores, escalas tipográficas, spacing, utilidades en `site-shell`/`tokens`).
- **Archivos:** `tokens.ts`, `site-shell.ts`, layout `(site)`.
- **Tocar:** tokens/utilidades. **No tocar:** lógica.
- **Riesgos:** cambios globales con efecto amplio.
- **Criterios:** sin desbordes 375/768/1280/1440; build verde.

### PUBLIC-REDESIGN-1D — Sistema de imágenes / hero strategy
- **Objetivo:** pipeline de imágenes, `next/image`/`<picture>`, art direction, hero optimizado; **especificación de assets** (no generación).
- **Archivos:** `hero.tsx`, helpers de imagen, `next.config`.
- **Tocar:** hero y manejo de imágenes. **No tocar:** datos.
- **Riesgos:** LCP/peso; faltan assets reales (depende de producción de fotos).
- **Criterios:** hero responsive sin pixelado, formatos modernos, build verde.

### PUBLIC-REDESIGN-2A — Catálogo + marcas + filtros
- **Objetivo:** layout catálogo, product cards, toolbar, filtros (precio min/max), página de marcas como exploración.
- **Archivos:** `productos-page.tsx`, `product-card.tsx`, `marcas-page.tsx`, `ui/slider.tsx` (o nuevo control), posibles componentes de filtros.
- **Tocar:** UI catálogo/filtros/marcas. **No tocar:** queries Supabase, lógica carrito.
- **Riesgos:** estado de filtros, sincronía slider/inputs, URL params.
- **Criterios:** filtros con rango min/max claros, catálogo jerarquizado, marcas tipo exploración, build verde.

### PUBLIC-REDESIGN-2B — PDP
- **Objetivo:** rediseño de página de producto (galería, confianza, recolección, specs, relacionados); copy sin envíos/stock exacto.
- **Archivos:** `product-detail.tsx`, `product-gallery.tsx`, `product-actions.tsx`.
- **Tocar:** UI PDP. **No tocar:** lógica carrito/pedidos, inventario.
- **Riesgos:** acciones (favorito/WhatsApp/agregar) deben seguir funcionando.
- **Criterios:** PDP premium, recolección clara, sin envíos, build verde.

### PUBLIC-REDESIGN-2C — Servicios + contacto + garantía + footer
- **Objetivo:** presentación premium de info pages y footer minimalista alineado a recolección.
- **Archivos:** `servicios-page.tsx`, `contacto-page.tsx`, `garantia-page.tsx`, `footer.tsx`.
- **Tocar:** UI/copy presentacional. **No tocar:** datos de contacto reales (solo presentación), lógica.
- **Riesgos:** perder información útil; enlaces.
- **Criterios:** info clara, footer minimalista, sin envíos/newsletter falso, build verde.

### PUBLIC-REDESIGN-2D — QA visual responsive final
- **Objetivo:** QA en 375/768/1280/1440, consistencia, accesibilidad, performance.
- **Tocar:** ajustes finos. **No tocar:** lógica.
- **Criterios:** sin regresiones, todas las rutas OK, build verde, checklist de aceptación cubierto.

---

## 21. Riesgos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Romper carrito/login/checkout al tocar header | Alta | Fases acotadas, QA funcional por fase |
| Dependencia de assets reales (fotos) | Alta | 1D entrega especificación; implementación visual usa placeholders aprobados hasta tener fotos |
| Cambios globales (1C) con efecto amplio | Media | Cambios en tokens revisados en varias rutas |
| Estado de filtros / URL params | Media | Tests manuales de combinaciones y deep-links |
| Contenido mock aún visible | Media | Diseño agnóstico; reemplazo controlado en DATA-2+ |
| Mock residual en home/header | Media | Resolver al conectar a Supabase (ver §22) |
| Scope creep hacia admin | Media | Admin congelado salvo coherencia mínima |
| Performance hero (peso/LCP) | Media | Presupuesto de imagen + formatos modernos |

---

## 22. Qué no tocar (todavía)

- **Admin** aprobado (salvo ajuste menor de coherencia, si fuera imprescindible).
- **Sales OS** (carrito, checkout, pedidos, fulfillment).
- **Stripe** (test) y **Stripe live** (no activar).
- **Webhook** de Stripe.
- **Supabase schema** y migraciones.
- **Inventario automático**, **Sicar**, **envíos**, **direcciones**, **WhatsApp API**, **push notifications**.
- **Carga masiva** de productos / datos reales sin validación.
- **Productos mock**: no borrar hasta reemplazo controlado (DATA-2+).

### Mock residual en UI (pendiente de conexión a Supabase)
Detectado en auditoría (no se corrige en 1A; abordar en 1B/2A según componente):

| Archivo | Dependencia mock | Fase sugerida |
|---------|------------------|---------------|
| `src/components/site/categories.tsx` | `countProducts()` de `@/lib/products` | 2A (o 1B si se toca home) |
| `src/components/site/header.tsx` | `BRANDS`, `CATEGORY_TREE`, `formatPrice` de `@/lib/products` | 1B (ya recibe `taxonomy`/`brands` reales por props; migrar fallback) |
| `src/components/pages/marcas-page.tsx` | `BRANDS` fallback | 2A |
| `src/components/site/featured-product-card.tsx` | tipo `Product` mock (legacy, no usado en home actual) | deprecación en 2A |
| `src/lib/catalog/mock-adapter.ts` | adaptador mock | deprecación futura |

---

## 23. Criterios de éxito (global del rediseño)

1. El sitio público se siente **de marca global / premium**.
2. **Mobile-first real**: experiencia excelente en 375px, no adaptada al final.
3. Header con **transición hero↔sticky** percibida como profesional.
4. Megamenús **editoriales** con jerarquía clara (productos y marcas).
5. Catálogo **limpio y jerarquizado**; filtros con **rango de precio min/max** funcional.
6. Página de marcas como **exploración**, no lista.
7. PDP **comercial y confiable**, con recolección y sin envíos/stock exacto.
8. Info pages **limpias**; footer **minimalista** y alineado a pickup.
9. Imágenes **nítidas, profesionales, sin aspecto IA**, optimizadas por dispositivo.
10. **Sin regresiones** en Sales OS, carrito, login, admin.
11. `npm run build` exit 0 en cada fase.

---

## 24. Próxima fase recomendada

**`PUBLIC-REDESIGN-1B — Header + navegación + megamenús`**, ejecutada junto a **`1C — Responsive foundation`** como base.

Razón: el header es el primer punto de contacto y el dolor más citado; arreglar su comportamiento (transparente sobre hero → sólido en scroll) y los megamenús eleva de inmediato la percepción de marca y sienta las bases responsive para el resto del rediseño. `1D` (imágenes) puede correr en paralelo a nivel de especificación, dependiente de producción de fotos reales.

---

## 25. Resultado de `npm run build`

```
✓ Compiled successfully
✓ TypeScript — sin errores
✓ 29 rutas generadas
Exit code: 0
```

Build ejecutado sin cambios de código (solo se creó este documento).

---

## Criterios de aceptación (PUBLIC-REDESIGN-1A)

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Existe `PUBLIC-REDESIGN_MASTER_PLAN_RADIO_SHALKO.md` | ✅ |
| 2 | Toma en cuenta todo el feedback del usuario | ✅ |
| 3 | No se implementó rediseño | ✅ |
| 4 | No se modificó lógica | ✅ |
| 5 | No se tocó base de datos | ✅ |
| 6 | No se tocó Stripe | ✅ |
| 7 | No se tocó admin | ✅ |
| 8 | No se mezcló con SEEDIS | ✅ |
| 9 | Roadmap dividido por fases claras | ✅ |
| 10 | Próxima fase = header/navegación + responsive | ✅ |
| 11 | `npm run build` exit 0 | ✅ |

---

*PUBLIC-REDESIGN-1A completado · Radio Shalko WEB · Independiente de SEEDIS · El admin permanece aprobado y sin cambios.*
