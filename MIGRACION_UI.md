# Estrategia de migración UI — Lovable → Next.js

**Fuente:** `responsive-web-design/` (Vite + TanStack Start + Bun, solo lectura visual)  
**Destino:** raíz del repo (Next.js 16 + Supabase)  
**Flujo:** Lovable → extracción UI → integración Next.js → datos Supabase  

**Última actualización:** 20 de mayo de 2026

---

## 1. Análisis de `package.json` (Lovable)

### Stack que NO se migra

| Paquete | Motivo |
|---------|--------|
| `@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/router-plugin` | Routing propio; en Next.js = App Router |
| `@tanstack/react-query` | Opcional; en V1 usar Server Components + Supabase o hooks locales |
| `vite`, `@vitejs/plugin-react`, `vite-tsconfig-paths` | Bundler distinto |
| `@cloudflare/vite-plugin`, `@lovable.dev/vite-tanstack-config` | Infra Lovable/Cloudflare |
| `bun` / `bunfig.toml` | Runtime distinto |

### Dependencias SÍ necesarias en Next.js

#### Obligatorias (ya usadas en UI migrada)

```bash
npm install clsx tailwind-merge class-variance-authority lucide-react \
  @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-label \
  @radix-ui/react-checkbox @radix-ui/react-select @radix-ui/react-slider \
  @radix-ui/react-separator tw-animate-css
```

| Paquete | Uso en Lovable |
|---------|----------------|
| `clsx` + `tailwind-merge` | `lib/utils.ts` → función `cn()` |
| `class-variance-authority` | Variantes en `button.tsx` |
| `lucide-react` | Iconos (Header, Footer, productos, etc.) |
| `@radix-ui/*` | Base de shadcn/ui (ver tabla UI abajo) |
| `tw-animate-css` | Animaciones en `styles.css` |

#### shadcn/ui — solo los componentes realmente importados

En `site/` y `routes/` solo aparecen:

| Componente UI | Rutas / componentes |
|---------------|---------------------|
| `button` | Header, contacto |
| `sheet` | Header, productos (filtros móvil) |
| `slider` | productos (filtro precio) |
| `checkbox` | productos |
| `select` | productos (ordenar) |
| `input`, `textarea` | contacto |

**Recomendación:** copiar solo esos 7 + dependencias Radix, no los 40+ archivos de `components/ui/` que Lovable generó y no usa.

#### Opcionales (fase posterior)

| Paquete | Cuándo |
|---------|--------|
| `react-hook-form` + `zod` + `@hookform/resolvers` | Formulario contacto robusto + validación |
| `embla-carousel-react` | Si reutilizas `carousel.tsx` (Hero actual no lo usa) |
| `sonner` | Toasts (favoritos, cotización) |
| `framer-motion` | Ya en Next; Hero Lovable usa CSS, no Framer |

#### Ya en Next.js (mantener)

- `next`, `react`, `react-dom`, `tailwindcss`, `@tailwindcss/postcss`
- `@supabase/supabase-js`, `@supabase/ssr`
- `framer-motion` (opcional para animaciones extra)

---

## 2. Inventario `src/` Lovable

### Rutas → páginas Next.js

| Archivo Lovable | Ruta web | Destino Next.js | Prioridad |
|-----------------|----------|-----------------|-----------|
| `routes/index.tsx` | `/` | `app/(site)/page.tsx` | P0 |
| `routes/productos.tsx` | `/productos` | `app/(site)/productos/page.tsx` | P0 |
| `routes/marcas.tsx` | `/marcas` | `app/(site)/marcas/page.tsx` | P1 |
| `routes/servicios.tsx` | `/servicios` | `app/(site)/servicios/page.tsx` | P1 |
| `routes/contacto.tsx` | `/contacto` | `app/(site)/contacto/page.tsx` | P1 |
| `routes/favoritos.tsx` | `/favoritos` | `app/(site)/favoritos/page.tsx` | P2 |
| `routes/garantia.tsx` | `/garantia` | `app/(site)/garantia/page.tsx` | P2 (nueva en Next) |
| `routes/__root.tsx` | layout global | `app/layout.tsx` + `app/(site)/layout.tsx` | P0 (metadatos, estilos) |

### Componentes `site/` → `components/site/`

| Componente Lovable | Rol | Destino Next | Cambios al migrar |
|--------------------|-----|--------------|-------------------|
| `Header.tsx` | Navbar + búsqueda + mega menú + sheets favoritos/cotización | `components/site/header.tsx` | `"use client"`, `Link` → `next/link`, `useNavigate` → `useRouter`, imports de assets → `next/image` o `/public` |
| `Footer.tsx` | Footer completo | `components/site/footer.tsx` | `Link` → `next/link` |
| `Hero.tsx` | Hero carrusel imágenes | `components/site/hero.tsx` | `"use client"`, imágenes estáticas en `public/` |
| `StoryStrip.tsx` | Historia / compromiso | `components/site/story-strip.tsx` | Mayormente server |
| `Brands.tsx` | Carrusel marcas | `components/site/brands.tsx` | `"use client"` (marquee CSS) |
| `FeaturedProducts.tsx` | Productos destacados home | `components/site/featured-products.tsx` | Datos mock → Supabase después |
| `Categories.tsx` | Grid categorías | `components/site/categories.tsx` | Links `?cat=` → `searchParams` Next |
| `Services.tsx` | Bloque servicios (si se usa en home) | `components/site/services.tsx` | Ver si está en index |
| `Stores.tsx` | Tiendas (si aplica) | `components/site/stores.tsx` | Idem |

### `lib/` Lovable

| Archivo | Migrar | Destino / tratamiento |
|---------|--------|----------------------|
| `lib/utils.ts` | ✅ | `src/lib/utils.ts` (idéntico) |
| `lib/products.ts` | ⚠️ Temporal | `src/lib/mock/products.ts` hasta Fase 5 Supabase |
| `lib/favorites.ts` | ⚠️ Adaptar | `src/hooks/use-favorites.ts` → localStorage V1, Supabase Fase 6 |
| `lib/error-page.ts`, `lib/error-capture.ts` | ❌ | Usar `app/error.tsx`, `app/not-found.tsx` de Next |

### `hooks/`

| Archivo | Migrar |
|---------|--------|
| `use-mobile.tsx` | ✅ → `src/hooks/use-mobile.ts` (si sidebar/drawer lo necesitan) |

### `assets/` → `public/brand/` o `src/assets/`

Copiar (no referenciar desde repo Lovable en build de producción):

- `logo-radio-shalko.svg`, logos PNG
- `hero-*.jpg`, `cat-*.jpg`
- `brands/*.png`

En Next.js preferir:

```
public/
  images/
    hero/
    categories/
    brands/
```

Y `next/image` con `width` / `height` o `fill`.

---

## 3. Archivos que NO deben migrarse

| Archivo | Motivo |
|---------|--------|
| `router.tsx` | Router TanStack |
| `routeTree.gen.ts` | Generado por TanStack |
| `start.ts` | Entry TanStack Start |
| `server.ts` | Servidor Vite/TanStack |
| `routes/*.tsx` (como archivos de ruta) | Solo extraer **contenido** a `page.tsx` Next, no copiar `createFileRoute` |
| `routes/__root.tsx` (shell TanStack) | Reemplazado por `app/layout.tsx` |
| `components/ui/*` no listados arriba | ~35 componentes shadcn sin uso (chart, sidebar, menubar, etc.) |
| `package.json` / `bun.lock` / `bunfig.toml` del subrepo | No mezclar dependencias |
| `.lovable/` | Config Lovable |

---

## 4. Mapeo detallado UI

### Home (`routes/index.tsx`)

```
┌─────────────────────────────────────┐
│ Header (Navbar)                     │  ← components/site/Header.tsx
├─────────────────────────────────────┤
│ Hero                                │  ← Hero.tsx
│ StoryStrip                          │  ← StoryStrip.tsx
│ Brands                              │  ← Brands.tsx
│ FeaturedProducts                    │  ← FeaturedProducts.tsx
│ Categories                          │  ← Categories.tsx
├─────────────────────────────────────┤
│ Footer                              │  ← Footer.tsx
└─────────────────────────────────────┘
```

**Next:** `app/(site)/page.tsx` importa secciones; eliminar placeholders actuales (`hero-carousel.tsx` genérico).

### Navbar

- **Origen:** `Header.tsx` (~840 líneas, cliente pesado).
- **Incluye:** logo, NAV, mega menú productos/marcas, búsqueda, favoritos sheet, cotización sheet, menú móvil.
- **Next:** un solo `components/site/header.tsx` con `"use client"`.
- **Reemplazos:**

  | Lovable | Next.js |
  |---------|---------|
  | `Link to="/productos"` | `<Link href="/productos">` |
  | `useNavigate()` | `useRouter().push()` |
  | `Route.useSearch()` | `useSearchParams()` en page o props desde server |
  | `import logo from "@/assets/..."` | `import Image from "next/image"` + `/public/images/logo.svg` |

### Hero

- **Origen:** `Hero.tsx` — carrusel por opacidad, 3 slides, sin TanStack Query.
- **Reemplaza:** `src/components/home/hero-carousel.tsx` (Framer) del setup inicial.
- **Migración:** copiar markup + clases; imágenes a `public/images/hero/`.

### Productos

- **Origen:** `routes/productos.tsx` (monolito ~520 líneas).
- **Dividir en Next:**

  ```
  app/(site)/productos/page.tsx          # Server: metadata, searchParams
  components/catalog/product-grid.tsx
  components/catalog/product-card.tsx
  components/catalog/product-row.tsx
  components/catalog/filters-panel.tsx
  components/catalog/products-toolbar.tsx
  ```

- **Lógica mock:** `lib/mock/products.ts` hasta Supabase.

### Footer

- **Origen:** `Footer.tsx` — newsletter, columnas, redes, legal.
- **Reemplaza:** `components/layout/site-footer.tsx` placeholder.

### Layouts

| Lovable | Next.js actual | Acción |
|---------|----------------|--------|
| `__root.tsx` + cada route con Header/Footer repetido | `(site)/layout.tsx` con Header+Footer una vez | Mover Header/Footer al layout; páginas solo `<main>` |
| Sin layout admin en Lovable | `app/admin/layout.tsx` | Mantener Next (no tocar Lovable) |

---

## 5. Estructura ideal — proyecto principal Next.js

```
Radio Shalko WEB/                    # repo principal (git propio, remote radioshalko)
├── responsive-web-design/           # SOLO referencia Lovable (git separado, no importar en build)
├── public/
│   └── images/
│       ├── hero/
│       ├── categories/
│       ├── brands/
│       └── logo-radio-shalko.svg
├── src/
│   ├── app/
│   │   ├── layout.tsx               # html, fonts, metadata global
│   │   ├── globals.css              # tokens desde Lovable styles.css
│   │   ├── (site)/
│   │   │   ├── layout.tsx           # SiteHeader + SiteFooter
│   │   │   ├── page.tsx             # Home (compone site/*)
│   │   │   ├── productos/page.tsx
│   │   │   ├── marcas/page.tsx
│   │   │   ├── servicios/page.tsx
│   │   │   ├── contacto/page.tsx
│   │   │   ├── favoritos/page.tsx
│   │   │   ├── cotizacion/page.tsx
│   │   │   └── garantia/page.tsx
│   │   ├── admin/                   # sin cambios de arquitectura
│   │   └── auth/callback/
│   ├── components/
│   │   ├── site/                    # UI migrada de Lovable
│   │   ├── catalog/                 # productos (extraído de route)
│   │   ├── layout/                  # admin-sidebar (admin only)
│   │   └── ui/                      # shadcn mínimo (7 componentes)
│   ├── hooks/
│   │   ├── use-mobile.ts
│   │   └── use-favorites.ts
│   ├── lib/
│   │   ├── supabase/
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   └── mock/products.ts         # temporal
│   └── types/
├── supabase/migrations/
├── prd.md
├── MIGRACION_UI.md                  # este documento
└── package.json                     # solo deps Next, nunca merge con Lovable
```

### Reglas de oro

1. **Nunca** `import` desde `responsive-web-design/` en código de producción.
2. **Copiar + adaptar** archivos; commit en repo principal.
3. **`responsive-web-design/`** se actualiza con `git pull` solo para comparar diseño nuevo de Lovable.
4. Tras migrar un componente, **borrar** el placeholder equivalente en Next (`site-header.tsx` viejo, etc.).

---

## 6. Plan de migración por fases

### Fase A — Fundación (1 sesión)

- [ ] Instalar deps UI listadas arriba
- [ ] Copiar tokens + fuentes (`styles.css` → `globals.css`): Inter, Fraunces, `--copper`, marquee, `font-display`
- [ ] `lib/utils.ts` + alias `@/` (ya existe)
- [ ] Copiar assets → `public/images/`
- [ ] Copiar 7 componentes `ui/` usados + marcar `"use client"` donde haya Radix

### Fase B — Layout global (P0)

- [ ] `footer.tsx` desde Lovable
- [ ] `header.tsx` desde Lovable (adaptar links y navegación)
- [ ] Actualizar `app/(site)/layout.tsx`
- [ ] Eliminar `components/layout/site-header.tsx` y `site-footer.tsx` viejos

### Fase C — Home (P0)

- [ ] `hero.tsx`, `story-strip.tsx`, `brands.tsx`, `featured-products.tsx`, `categories.tsx`
- [ ] Reescribir `app/(site)/page.tsx`
- [ ] Eliminar `components/home/hero-carousel.tsx`

### Fase D — Catálogo (P0)

- [ ] `lib/mock/products.ts`
- [ ] Refactor `productos` en `catalog/*`
- [ ] `app/(site)/productos/page.tsx` + `searchParams` para `cat`, `sub`, `brand`, `q`

### Fase E — Páginas restantes (P1)

- [ ] marcas, servicios, contacto, garantia
- [ ] favoritos + hook (localStorage → luego Supabase)

### Fase F — Datos reales (Fase 2–6 PRD)

- [ ] Reemplazar `mock/products` por queries Supabase
- [ ] `use-favorites` → tabla `favorites` + Auth Google
- [ ] Cotización (sheet del Header) → estado + DB

### Fase G — Limpieza

- [ ] Metadata/OG por página (copiar `head()` de routes Lovable a `metadata` Next)
- [ ] `error.tsx`, `not-found.tsx`
- [ ] Documentar en `ESTADO_PROYECTO.md`

---

## 7. Adaptaciones técnicas obligatorias

### TanStack `Link` → Next.js

```tsx
// Lovable
import { Link } from "@tanstack/react-router";
<Link to="/productos" search={{ cat: "Instrumentos" }} />

// Next.js
import Link from "next/link";
<Link href="/productos?cat=Instrumentos" />
```

### Componentes con estado / browser

Todo lo que use `useState`, `useEffect`, `window`, `localStorage` → **`"use client"`** al inicio del archivo.

### Imágenes

```tsx
// Lovable
import hero from "@/assets/hero-guitars.jpg";
<img src={hero} />

// Next.js
import Image from "next/image";
<Image src="/images/hero/hero-guitars.jpg" alt="..." fill className="object-cover" priority />
```

### Metadata

```tsx
// Lovable (route head)
head: () => ({ meta: [{ title: "Productos · Radio Shalko" }] })

// Next.js
export const metadata: Metadata = { title: "Productos" };
```

### Favoritos (transición)

1. **V1 migración:** portar `useFavorites` + localStorage (`shalko:favorites`).
2. **V1 Supabase:** mismo hook, backend `favorites` + `user_id`.

---

## 8. Separación Radio Shalko vs Seedis

| Aspecto | Radio Shalko | Seedis |
|---------|--------------|--------|
| Carpeta local | `~/Desktop/Radio Shalko WEB` | (ruta propia Seedis) |
| Git remote | `git@github-radioshalko:Radioshalko01-oss/...` | remote Seedis |
| SSH config | `Host github-radioshalko` | otro Host o cuenta |
| `package.json` | solo Next | solo app móvil |
| Cursor | ventana/workspace separado | ventana separada |

**Nunca:** merge, symlink o monorepo compartido entre ambos.

---

## 9. Orden recomendado de trabajo (próximo sprint)

1. **Fase A** — estilos + assets + shadcn mínimo  
2. **Fase B** — Header + Footer (impacto visual inmediato)  
3. **Fase C** — Home completa  
4. **Fase D** — Productos (página más compleja)  
5. Resto de rutas → Supabase  

Cuando quieras ejecutar, indica por dónde empezar (recomendado: **Fase A + B** en un solo PR lógico).

---

*Referencia viva. Repo Lovable: solo diseño; producción: raíz Next.js.*
