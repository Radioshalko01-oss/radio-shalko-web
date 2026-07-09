# REPORTE MAESTRO DE CONTINUIDAD — Radio Shalko WEB

**Fecha:** 2026-07-01  
**Fase activa:** PUBLIC-REDESIGN (sitio público) + Sales OS v1 (backend ya operativo)  
**Rama Git:** `public-redesign-local`  
**Audiencia:** Desarrolladores, otra sesión de IA, ChatGPT, continuidad a largo plazo  

---

## 1. RESUMEN EJECUTIVO

En las sesiones recientes se completó un **rediseño visual profundo del sitio público** de Radio Shalko WEB, manteniendo intacta la lógica de negocio (Supabase, Stripe, admin, pedidos, carrito/cotización). El trabajo se centró en elevar la percepción de marca premium/editorial: header con estados hero/sólido, megamenús, hero oscuro compartido (`SitePageHero`), páginas informativas (Servicios, Contacto, Garantía), catálogo (filtros de precio, Marcas), y la sección **Compra por categoría** en la home.

**Objetivo:** Que el sitio deje de sentirse como plantilla genérica y se alinee con una tienda de instrumentos profesional con asesoría humana, recolección en tienda y cotización por WhatsApp — no e-commerce tipo Amazon.

**Resultado:** `npm run build` → **OK (exit 0)**. Cambios extensos existen **solo en local**, sin commit final de esta oleada ni push a remoto. La rama tiene commits previos de header/megamenús; el diff actual (~22 archivos, +1617/−1105 líneas) concentra el rediseño de páginas públicas y home categorías.

---

## 2. CONTEXTO DEL PROYECTO

### Visión

**Radio Shalko NO es Amazon.**  
**Radio Shalko NO es Shopify self-checkout puro.**  
**Radio Shalko es:** catálogo digital + cotización + asesoría + venta híbrida (tienda física Chalco/Amecameca + solicitud online).

### Filosofía de producto

| Principio | Significado |
|-----------|-------------|
| Asesoría humana | WhatsApp y teléfono son canales primarios; muchos flujos terminan en conversación |
| Recolección en tienda | No prometer envío a domicilio como default; pickup en sucursales |
| Cotización / solicitud | El carrito del header es un "quote cart"; checkout es solicitud de pedido revisada por admin |
| Catálogo real | Productos vienen de Supabase; datos aún en fase piloto/mock pero arquitectura lista |
| Admin aprobado | Panel admin NO se rediseña en esta fase; solo sitio público |

### Objetivos de negocio

1. Mostrar catálogo profesional de instrumentos y audio.
2. Captar leads vía WhatsApp, favoritos y carrito compartido.
3. Permitir checkout autenticado → pedido → revisión admin → pago Stripe cuando aplique.
4. Reflejar 40+ años de confianza local (Chalco, Amecameca).

### Restricciones explícitas (NO romper)

- No tocar lógica Stripe/webhook sin tarea explícita.
- No modificar migraciones Supabase existentes sin plan.
- No rediseñar admin.
- No cambiar rutas públicas establecidas (`/productos`, `/marcas`, etc.).
- Español México en copy UI.
- Next.js 16 — leer `node_modules/next/dist/docs/` antes de asumir APIs (ver `AGENTS.md`).

---

## 3. PROBLEMAS IDENTIFICADOS

### UX / Diseño público

| Problema | Causa | Impacto | Solución elegida |
|----------|-------|---------|------------------|
| Header siempre sólido | Implementación mock inicial | Home no integraba hero fullscreen | Header transparente en `/` al tope; sólido al scroll |
| Megamenús tipo lista | Herencia mock | Navegación poco premium | Megamenús editoriales Productos/Marcas |
| Páginas Servicios/Contacto/Garantía genéricas | Cards planas sin sistema | Baja confianza de marca | Rediseño con `SitePageHero`, motion, CTAs oscuros |
| Sección categorías bento beige | Diseño Canva/bento anterior | Instrumentos tapados por overlay oscuro | Grid 5×2 tipo product card: imagen arriba, texto abajo |
| Repetición excesiva contacto | Sección `#canales` + tiendas + CTA | Ruido visual | Eliminar `#canales`; consolidar en `#formulario` |
| Filtro precio incómodo | Slider step $500, sin inputs | UX catálogo mala | Dual slider + inputs manuales, step $50 |
| Marcas: mucho espacio vertical | `space-y` generoso + bento previo | Scroll largo | Reducir gaps; sticky index de marcas |
| Scrollbar sidebar productos | `pr-2` insuficiente | Solapa contenido filtros | `pr-4` + `scrollbar-gutter: stable` |

### Técnicos

| Problema | Causa | Impacto | Solución |
|----------|-------|---------|----------|
| `upcomingBrands is not defined` | Refactor incompleto Marcas | Runtime error | Reescritura `marcas-page.tsx` |
| Slider multi-thumb roto | Radix + un solo thumb | Filtro precio inutilizable | Fix en `slider.tsx` |
| Facebook icon lucide | No existe export | Build fail | SVG custom en footer |
| JSX fragments checkout/cotización | Edición parcial | Build fail | Cierre correcto fragments |
| `related_products` público | RLS faltante | Alerta Supabase | Migración RLS 20260630 |

### Arquitectura / Producto

| Problema | Impacto | Estado |
|----------|---------|--------|
| Catálogo mock en Supabase | Datos no reflejan inventario real | Pendiente DATA-2 piloto |
| Footer horarios vs tiendas | Posible desincronización | `footerHoursSummary` puede no reflejar Dom cerrado Amecameca |
| Imágenes categorías en `/images/catalogo/` | Calidad variable | Usuario reemplazando assets manualmente |

---

## 4. DECISIONES IMPORTANTES

### DECISIÓN: Hero oscuro compartido (`SitePageHero`) en páginas internas  
**MOTIVO:** Unificar identidad editorial post-header; breadcrumbs dinámicos.  
**ALTERNATIVAS DESCARTADAS:** Mantener H1 suelto por página; hero claro.  
**IMPACTO FUTURO:** Toda página pública nueva debe usar `SitePageHero` + `src/lib/site/breadcrumbs.ts`.

### DECISIÓN: Home hero (`Hero`) NO se tocó  
**MOTIVO:** Usuario pidió preservar carrusel fullscreen existente.  
**IMPACTO:** Solo `/` tiene header transparente integrado al hero.

### DECISIÓN: Categorías home — grid uniforme 5×2 (no bento flotante)  
**MOTIVO:** Tras explorar “instrumentos flotantes”, se eligió coherencia con cards Novedades/Destacados.  
**ALTERNATIVAS DESCARTADAS:** Bento beige con overlay; galería flotante sin cards.  
**IMPACTO:** `category-card.tsx` simplificado; imágenes `object-contain` desde `/public/images/catalogo/`.

### DECISIÓN: Eliminar sección `#canales` en Contacto  
**MOTIVO:** Redundancia WhatsApp/teléfono/correo.  
**IMPACTO:** Footer link → `/contacto#formulario`.

### DECISIÓN: CTA taller en FAQ Servicios (columna derecha)  
**MOTIVO:** Aprovechar espacio horizontal; quitar banner full-width duplicado.  
**IMPACTO:** `#por-que-radio-shalko` ya no tiene banner CTA inferior.

### DECISIÓN: Garantía — política guitarras/violines como sección dedicada  
**MOTIVO:** Contenido legal/operativo provisto por negocio.  
**IMPACTO:** `#garantia-instrumentos` con cards PolicyCard; tono “tu” alineado al sitio.

### DECISIÓN: Nav — scroll to top en misma ruta  
**MOTIVO:** UX: usuario scrolled abajo en `/productos` quiere volver arriba al pulsar Productos.  
**IMPACTO:** `handleNavClick` / `navigateOrScrollTop` en `header.tsx`; match exacto pathname (`/productos`, no PDP).

### DECISIÓN: Mapas embed Street View por tienda  
**MOTIVO:** URLs genéricas incorrectas.  
**IMPACTO:** `mapEmbedUrl` y `mapUrl` Amecameca actualizados en `site-contact.ts`.

### DECISIÓN: Breadcrumbs productos máx. 3 niveles  
**MOTIVO:** Evitar migas profundas confusas.  
**REGLA:** `Inicio / Productos` → categoría O marca (no ambos + subcategoría extendida).

### DECISIÓN: Apartado FAQ — mencionar abonos parciales  
**MOTIVO:** Alinear copy con timeline “Abonos” en tarjeta apartado Servicios.  
**TEXTO:** “Aparta con un primer pago y haz abonos parciales a tu ritmo…”

---

## 5. CAMBIOS IMPLEMENTADOS (DETALLE POR ÁREA)

### 5.1 Header y navegación (`header.tsx`, `mega-menus.tsx`)

- Estados **hero** (home, top) vs **sólido** (scroll / páginas internas / menús abiertos).
- Megamenú Productos: familias editoriales + rail CTAs.
- Megamenú Marcas: columnas A–Z, encabezado “MARCAS A–D”.
- Móvil: drawer, acordeones, Escape cierra overlays.
- **Nuevo:** click en nav item de ruta actual → `window.scrollTo({ top: 0, behavior: 'smooth' })`.

### 5.2 `SitePageHero` + breadcrumbs (NUEVO)

- **`src/components/site/site-page-hero.tsx`**: hero `#1a1a1a`, breadcrumbs, título centrado.
- **`src/lib/site/breadcrumbs.ts`**: helpers `productosCatalogBreadcrumbs`, `marcasCatalogBreadcrumbs`, `productDetailBreadcrumbs`, `finalizeBreadcrumbs`.
- Rollout en: Productos, Marcas, Servicios, Contacto, Garantía, Favoritos, Carrito, Checkout, Cuenta*, PDP, carrito compartido.

### 5.3 Página Productos (`productos-page.tsx`, `slider.tsx`)

- Eliminada barra sticky “Filtrando…”.
- Filtro precio: dual-handle slider + inputs texto con draft state, step **$50**.
- Sidebar: más padding; scrollbar separado.

### 5.4 Página Marcas (`marcas-page.tsx`)

- Índice sticky centrado, chips activos (negro).
- Selección marca: reordenar al top, toggle deselect, scroll a contenido.
- Max 4 productos/marca + “Ver todo {Marca}”.
- Espaciado reducido entre secciones.
- Hero description actualizada.

### 5.5 Página Servicios (`servicios-page.tsx`)

- Rediseño completo bajo hero: taller, asesoría, apartado timeline, garantía, FAQ + CTA lateral.
- Apartado/Garantía: mismo borde que cards asesoría (sin gradiente copper top).
- Hero copy: *“Todo lo que tu sonido necesita, en un solo lugar…”*
- FAQ apartado actualizado con abonos.

### 5.6 Página Contacto (`contacto-page.tsx`, `site-contact.ts`)

- Tiendas: mapas Street View, WhatsApp por tienda, gaps ampliados.
- Eliminada sección `#canales`.
- `#formulario`: banda oscura con WhatsApp + teléfono + correo.
- Legal en grid 2 columnas.

### 5.7 Página Garantía (`garantia-page.tsx`)

- Cobertura general + **política guitarras/violines** (7 días cambio, 15–20 días hábiles, exclusiones).
- Pilares 2×2, timeline 3 pasos, CTA oscuro.
- IDs ancla preservados para footer (`#servicio-tecnico`, etc.).

### 5.8 Home — Categorías (`categories.tsx`, `category-card.tsx`)

- **Antes:** Bento 12-col, fondo `#f0ede8`, overlay oscuro, texto sobre imagen.
- **Ahora:** Grid 5/3/2 cols, cards blancas, `next/image`, `object-contain`, botón circular →, hover cobre.
- Header categorías alineado spacing con FeaturedProducts (`pt-12`, `-translate-y-3`, `mt-10` grid).
- Imágenes: `/public/images/catalogo/*.png` vía `CATALOG_IMAGES`.

### 5.9 Footer (`footer.tsx`)

- Link contacto → `#formulario`.
- Facebook icon SVG custom (lucide no exporta).

### 5.10 Otras páginas tocadas en rollout hero

- `checkout-page.tsx`, `cotizacion-page.tsx`, `favoritos-page.tsx`, `shared-cart-page.tsx`, `product-detail.tsx`, páginas cuenta — integración `SitePageHero` / breadcrumbs.

---

## 6. ARQUITECTURA ACTUAL

### Stack

```
Next.js 16.2.6 (App Router)
React 19
TypeScript 5
Tailwind CSS 4
Supabase (Auth + Postgres + Storage)
Stripe (Checkout Session post-aprobación admin)
Framer Motion (páginas informativas)
Radix UI (Sheet, Slider, Select, etc.)
```

### Estructura App Router

```
src/app/
├── layout.tsx                 # Root layout
├── (site)/                    # Sitio público
│   ├── layout.tsx             # Header + Footer + providers
│   ├── page.tsx               # HOME
│   ├── productos/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx    # PDP
│   ├── marcas/page.tsx
│   ├── servicios/page.tsx
│   ├── contacto/page.tsx
│   ├── garantia/page.tsx
│   ├── carrito/...
│   ├── checkout/page.tsx
│   ├── cuenta/...
│   ├── favoritos/page.tsx
│   └── cotizacion/page.tsx
├── admin/                     # Panel admin (NO rediseñar)
├── login/page.tsx
├── auth/callback/route.ts
└── api/
    ├── stripe/webhook/route.ts
    └── jobs/cart-reminders/route.ts
```

### Home — composición

```
Hero (fullscreen carousel, client)
  ↓
StoryStrip
  ↓
Brands (marquee infinito logos)
  ↓
FeaturedProducts (tabs Novedades / Destacados)
  ↓
Categories (#categorias, grid premium)
```

### Taxonomía catálogo

```
Productos
├── Instrumentos
│   ├── Guitarras eléctricas, acústicas
│   ├── Bajos, Ukuleles, Violines
│   ├── Baterías, Teclados, Docerolas
│   └── ...
├── Accesorios
└── Equipos de Audio
```

Fuente menú: productos activos en Supabase → `SiteLayout` construye `taxonomy` para header.

### Capa de datos catálogo

```
UI / Server Components
    ↓
@/lib/catalog (index.ts — barrel)
    ↓
queries.ts → Supabase server client
    ↓
mappers.ts → CatalogProduct type
```

**Importante:** `getCatalogProducts()` solo en Server Components / actions / routes (usa cookies).

### Carrito / cotización (conceptual)

```
Header "Carrito" = QuoteProvider (useQuote)
    ↓
localStorage + sync Supabase si autenticado (quotes / quote_items)
    ↓
/carrito → revisión
    ↓
/checkout → crea ORDER (solicitud)
    ↓
Admin aprueba → Stripe link (SALES-6)
```

### Middleware

`src/middleware.ts` → `updateSession` Supabase (refresh auth cookies).

### Design system público

| Archivo | Rol |
|---------|-----|
| `src/lib/design/tokens.ts` | Clases typography, spacing |
| `src/lib/design/site-shell.ts` | `card`, `ctaDark`, `brandEyebrow`, etc. |
| `src/app/globals.css` | OKLCH tokens, copper, fonts |
| `SitePageHero` | Hero oscuro páginas internas |

---

## 7. ESTADO DE BASE DE DATOS

### Migraciones existentes (17 archivos)

| Migración | Tema |
|-----------|------|
| `20260520000000_initial_schema` | profiles, categories, brands, products, favorites, banners |
| `20260521000000_catalog_extended` | subcategories, inventory, publish flags |
| `20260522000000_favorites_quotes_audit` | quotes, quote_items |
| `20260523000000_cat_admin_additive` | admin catalog |
| `20260524000000_quotes_admin_update` | quotes admin |
| `20260525000000_shared_carts` | carritos compartidos |
| `20260526000000_orders` | orders, order_items, addresses, status history |
| `20260527000000` – `20260528000000` | checkout auth |
| `20260529000000` | availability review |
| `20260530000000` | Stripe checkout fields |
| `20260531000000` | fulfillment pickup |
| `20260532000000` – `20260533000000` | customer notifications |
| `20260630000000_enable_rls_related_products` | RLS related_products |

### Sesión actual

**NO se crearon migraciones nuevas** en el rediseño público reciente.

### Tablas principales (negocio)

```
profiles          — usuarios, role admin/user
categories        — categorías
subcategories     — (migración extended)
brands            — marcas
products          — catálogo
product_images    — galería
inventory         — stock por sucursal
favorites         — favoritos usuario
quotes            — carrito/cotización
quote_items       — líneas carrito
shared_carts      — links compartibles
orders            — pedidos
order_items       — snapshot líneas
customer_notifications — notificaciones cliente
related_products  — PDP relacionados (RLS habilitado)
branches          — sucursales (checkout)
```

### RLS

- Habilitado desde fase auth.
- Última corrección: `related_products` ya no públicamente writable sin policy.
- **Esta sesión:** sin cambios RLS.

### Riesgos DB

- Catálogo puede ser mock/piloto — validar antes de go-live real.
- Políticas deben revisarse al exponer nuevas tablas.

---

## 8. ARCHIVOS MODIFICADOS (ESTADO ACTUAL — SIN COMMIT FINAL)

### Creados (untracked)

| Archivo | Propósito |
|---------|-----------|
| `src/components/site/site-page-hero.tsx` | Hero oscuro reutilizable con breadcrumbs |
| `src/lib/site/breadcrumbs.ts` | Lógica migas de pan sitio público |

### Modificados (22 archivos, diff vs HEAD)

| Archivo | Propósito del cambio |
|---------|---------------------|
| `src/components/site/header.tsx` | Header dual state, scroll-to-top nav |
| `src/components/site/mega-menus.tsx` | Ajustes megamenú marcas |
| `src/components/site/footer.tsx` | Links, icon Facebook |
| `src/components/site/categories.tsx` | Grid 5×2 premium |
| `src/components/site/category-card.tsx` | Card categoría tipo producto |
| `src/components/pages/productos-page.tsx` | Filtros, hero, sidebar |
| `src/components/pages/marcas-page.tsx` | Rediseño marcas |
| `src/components/pages/servicios-page.tsx` | Rediseño servicios |
| `src/components/pages/contacto-page.tsx` | Rediseño contacto |
| `src/components/pages/garantia-page.tsx` | Rediseño garantía + política instrumentos |
| `src/components/pages/favoritos-page.tsx` | SitePageHero |
| `src/components/pages/checkout-page.tsx` | SitePageHero + fragment fix |
| `src/components/pages/cotizacion-page.tsx` | SitePageHero + fragment fix |
| `src/components/pages/shared-cart-page.tsx` | SitePageHero |
| `src/components/catalog/product-detail.tsx` | Breadcrumbs PDP |
| `src/components/ui/slider.tsx` | Multi-thumb range |
| `src/lib/site-contact.ts` | Mapas embed, datos tiendas |
| `src/app/(site)/cuenta/*.tsx` | SitePageHero en subpáginas cuenta |

### Eliminados

Ninguno en esta oleada.

### Assets estáticos categorías

```
/public/images/catalogo/
  guitarras-electricas.png
  guitarras-acusticas.png
  bajos.png
  docerolas.png
  violines.png
  ukuleles.png
  baterias.png
  teclados.png
  bafles-y-audio.png
  accesorios.png
```

También existen alternativas en `/public/images/categories/cat-grid-*` (no usadas actualmente por código).

---

## 9. BUILD Y VALIDACIÓN

| Check | Resultado | Notas |
|-------|-----------|-------|
| `npm run build` | **OK** | Exit 0, todas las rutas compiladas |
| `npm run lint` | **WARNING** | 25 errors, 52 warnings preexistentes; no bloquean build |
| Typecheck | **OK** | vía build Next |
| Pruebas manuales | **Parcial** | Rediseño validado visualmente en dev; QA formal pendiente |
| Responsive | **Parcial** | Ajustes mobile categorías 2-col; QA device matrix pendiente |

---

## 10. ESTADO GIT

| Campo | Valor |
|-------|-------|
| **Rama** | `public-redesign-local` |
| **Último commit** | `52081d8` — *Rebuild public megamenus and secure related products* |
| **Commits de esta oleada** | **NO** — cambios sin commitear |
| **Push** | **NO** (asumido; working tree dirty) |
| **Deploy** | **NO** para cambios actuales |

### Commits recientes en rama

```
52081d8 Rebuild public megamenus and secure related products
a09a495 Include site logo refinement for header
201c496 Refine public public header visual behavior
7bb374c Redesign public header and megamenus
dba96cb Add public redesign master plan
```

---

## 11. ESTADO DE VERCEL

| Entorno | Estado |
|---------|--------|
| **Producción** | Refleja commits **anteriores** (header/megamenús si se desplegó); **NO** incluye rediseño páginas/home categorías actual |
| **Preview** | Depende último push; cambios locales no visibles |
| **Local** | Fuente de verdad del rediseño completo (`npm run dev`) |

**Conclusión:** El rediseño Servicios/Contacto/Garantía/Marcas/Productos/Categorías existe **principalmente en local** hasta commit + push + deploy.

---

## 12. ESTADO DE SUPABASE

| Aspecto | Estado sesión rediseño |
|---------|------------------------|
| Migraciones nuevas | Ninguna |
| RLS | Sin cambios |
| Tablas afectadas | Ninguna |
| Alertas | `related_products` resuelta en commit `52081d8` |

Variables requeridas (`.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, Stripe keys, etc.

---

## 13. PENDIENTES

### ALTA PRIORIDAD

1. **Commit + push** de oleada rediseño público (22 archivos).
2. **QA visual** responsive home, categorías, contacto, servicios, garantía.
3. **Reemplazar imágenes categorías** en `/public/images/catalogo/` (usuario preparando assets premium PNG fondo blanco/transparente).
4. **Verificar footer horarios** vs horarios reales por tienda (`site-contact.ts`).
5. **Deploy Vercel** staging → validación → producción.

### MEDIA PRIORIDAD

1. Rediseñar **Hero home** (imágenes 4K, pipeline) — plan master 1C/1D.
2. **PDP** polish (galería, confianza, relacionados) — PUBLIC-REDESIGN-2x.
3. **Footer** minimalista alineado recolección.
4. Sincronizar FAQ apartado en otros lugares si queda copy “liquida en 2 meses” sin “abonos”.
5. Limpiar lint errors (25) — deuda preexistente.

### BAJA PRIORIDAD

1. Usar `/images/categories/cat-grid-*` o unificar pipeline assets.
2. Facebook URL real cuando exista.
3. DATA-2: catálogo real vs mock Supabase.
4. Reportes históricos consolidados (muchos `*_REPORT.md` en root).

---

## 14. PRÓXIMOS PASOS RECOMENDADOS

1. Revisar visualmente home categorías con imágenes finales del usuario.
2. Commit descriptivo: `Redesign public pages, category grid, and shared page hero`.
3. Push `public-redesign-local` → PR → preview Vercel.
4. QA checklist (mobile 390px, tablet, desktop 1440px).
5. Continuar PUBLIC-REDESIGN-1C: responsive foundation + hero home.
6. PUBLIC-REDESIGN-2A: PDP + product cards catálogo.
7. DATA-2: import catálogo real cuando negocio entregue CSV/plantilla.

---

## 15. CONTEXTO PARA FUTURAS SESIONES

### Hacia dónde va el proyecto

Fase actual = **acabado premium del sitio público** sobre Sales OS ya construido. Después: catálogo real, go-live, optimización conversión checkout.

### Lógica a seguir

1. **UI pública:** editorial, copper accents, hero oscuro interno, cards limpias, motion sutil (`framer-motion`, `prefers-reduced-motion`).
2. **Datos contacto:** single source `src/lib/site-contact.ts`.
3. **Imágenes categorías:** `src/lib/catalog-images.ts` → `/public/images/catalogo/`.
4. **Filtros productos:** query params `?cat=`, `?sub=`, `?brand=`, `?q=`, rango precio en client state + URL.
5. **No scope creep:** usuario pide cambios puntuales — no rediseñar admin ni backend sin pedirlo.

### Qué NO debe cambiar sin aprobación

- Flujo orders + Stripe webhook.
- Rutas admin.
- Modelo quotes = carrito.
- Política pickup vs shipping messaging.
- IDs ancla garantía/contacto usados en footer.

### Cómo retomar en ChatGPT otra IA

1. Leer este reporte.
2. Leer `PUBLIC-REDESIGN_MASTER_PLAN_RADIO_SHALKO.md`.
3. `git status` + diff en `src/components/pages/` y `src/components/site/`.
4. `npm run dev` → validar `/`, `/productos`, `/servicios`, `/contacto`, `/garantia`.
5. Respetar `AGENTS.md` (Next.js 16 breaking changes).

---

## 16. RIESGOS ACTUALES

| Riesgo | Tipo | Mitigación |
|--------|------|------------|
| Cambios locales sin deploy | Operacional | Commit/push pronto |
| Imágenes categorías baja calidad | UX | Reemplazo assets usuario |
| Lint debt | Técnico | Sprint cleanup |
| Catálogo mock | Negocio | DATA-2 piloto |
| Regresión filtros precio | Técnico | Probar edge cases inputs slider |
| Desync contacto footer | UX | Auditar `footer.tsx` vs `site-contact.ts` |
| Next/Image cache tras reemplazar PNG | Dev | Hard refresh / bump query string si necesario |

---

## 17. CONCLUSIÓN

### ¿Dónde estamos?

Radio Shalko WEB tiene un **backend de ventas funcional** (carrito, pedidos, Stripe, admin, notificaciones) y un **sitio público en transformación visual avanzada**: header premium, páginas informativas rediseñadas, catálogo/marcas mejorados, y home con sección categorías alineada a product cards.

### ¿Qué se logró?

- Identidad visual mucho más coherente y profesional en el área pública.
- Eliminación de patrones genéricos (bento oscuro, cards beige, contacto repetitivo).
- Componentes reutilizables (`SitePageHero`, breadcrumbs).
- Build verde con cambios extensos listos para commit.

### ¿Qué falta?

- Consolidar en Git y desplegar.
- Assets finales categorías y hero home.
- QA responsive formal.
- Continuar roadmap PUBLIC-REDESIGN (PDP, footer, hero pipeline, DATA-2).

---

## APÉNDICE A — Rutas públicas completas

| Ruta | Componente principal |
|------|---------------------|
| `/` | Home: Hero, StoryStrip, Brands, FeaturedProducts, Categories |
| `/productos` | `ProductosPage` + filtros sidebar |
| `/productos/[slug]` | `ProductDetail` |
| `/marcas` | `MarcasPage` |
| `/servicios` | `ServiciosPage` |
| `/contacto` | `ContactoPage` |
| `/garantia` | `GarantiaPage` |
| `/carrito` | Carrito quote |
| `/checkout` | Solicitud pedido |
| `/favoritos` | Favoritos |
| `/cuenta/*` | Área cliente |
| `/carrito/s/[token]` | Carrito compartido |
| `/login` | Login standalone |

---

## APÉNDICE B — Contacto oficial (fuente única)

**Archivo:** `src/lib/site-contact.ts`

| Canal | Valor |
|-------|-------|
| Email | eradioshalko@gmail.com |
| WhatsApp | +52 56 5157 1531 |
| Teléfono general | +52 55 3092 4459 |

**Chalco:** Av. Solidaridad 142 · Lun–Sáb 10–20, Dom 11–20 · tel +52 55 3092 4459  
**Amecameca:** Plaza Juárez 28 · Lun–Sáb 10–20, Dom cerrado · tel +52 597 115 1631  
**WhatsApp ambas tiendas:** +52 56 5157 1531 (compartido)

---

## APÉNDICE C — Comandos útiles

```bash
cd "/Users/cesargv/Desktop/Radio Shalko WEB"
npm run dev          # desarrollo
npm run build        # producción local
npm run lint         # eslint
npm run db:migrate   # aplicar migraciones Supabase
open public/images/catalogo   # assets categorías
```

---

## APÉNDICE D — Documentación relacionada en repo

| Documento | Contenido |
|-----------|-----------|
| `PUBLIC-REDESIGN_MASTER_PLAN_RADIO_SHALKO.md` | Plan maestro rediseño |
| `PUBLIC-REDESIGN-1B_REPORT.md` | Header/megamenús |
| `RADIO_SHALKO_SALES_OS_PLAN.md` | Sales OS |
| `CHECKOUT_ARCHITECTURE_RADIO_SHALKO.md` | Checkout |
| `ORDER_ARCHITECTURE_RADIO_SHALKO.md` | Pedidos |
| `DATA-2_REAL_CATALOG_PILOT_PLAN.md` | Catálogo real |
| `ROADMAP.md` | Roadmap general |
| `prd.md` / `prd-v2.md` | Product requirements |

---

*Fin del reporte. Documento autosuficiente para continuidad — actualizar al cerrar cada sesión importante.*
