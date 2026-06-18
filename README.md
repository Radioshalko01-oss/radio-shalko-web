# Radio Shalko Web

Plataforma web profesional para **Radio Shalko**: catálogo, ecommerce y panel administrativo. La dirección oficial del producto está definida en **[PRD V2 — Radio Shalko 1.0](./prd-v2.md)**.

---

## Estado del proyecto

| Aspecto | Detalle |
|--------|---------|
| **Tipo** | Tienda online + panel administrativo |
| **PRD activo** | [prd-v2.md](./prd-v2.md) |
| **Etapa actual** | Transición de catálogo mock → Radio Shalko 1.0 (ver roadmap en PRD V2) |
| **UI inicial** | Desarrollada parcialmente con Lovable y Cursor |

---

## Objetivo

Construir una plataforma moderna, minimalista y altamente funcional para:

- Exhibición profesional de productos
- Navegación, búsqueda y filtrado optimizados
- Catálogo inteligente con favoritos y cotización
- Administración sencilla vía panel `/admin`
- Escalabilidad futura

**Referencia visual:** Apple, Stripe, Shopify, Framer, Arturia.

**Prioridad responsive:** experiencia móvil primero.

---

## Alcance V1

### Incluido

**Sitio público**

- Home (hero, empresa, marcas, categorías)
- Productos (filtros, ordenamiento, relacionados)
- Marcas
- Servicios
- Contacto (sucursales Chalco y Amecameca)
- Favoritos (requiere login Google)
- Cotización (carrito sin checkout)
- Buscador general
- Login con Google

**Panel administrativo** (`/admin`)

- Dashboard, productos, categorías, marcas, banners, servicios y edición de contenido

**Backend**

- Supabase: PostgreSQL, Auth, Storage, RLS y roles

### Fuera de alcance V1

- Pagos, checkout, envíos, pasarelas, órdenes
- App móvil administrativa
- Inventario avanzado, traspasos, sistema offline SQLite

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | Next.js, React, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, APIs, RLS) |
| **Hosting** | Vercel (recomendado) |
| **Seguridad / CDN** | Cloudflare (recomendado) |

---

## Roles

| Rol | Permisos |
|-----|----------|
| **Usuario** | Navegar, buscar, filtrar, favoritos, cotización, login Google, ver servicios y marcas, contactar |
| **Administrador** | Acceso a `/admin`: CRUD productos, categorías, marcas, banners, servicios e imágenes |

Los usuarios no pueden acceder al panel ni editar contenido.

---

## Estructura del sitio

### Header

- **Izquierda:** logotipo / isotipo  
- **Centro:** Productos · Marcas · Servicios · Contacto  
- **Derecha:** Buscador · Favoritos · Cotización · Usuario / Login  

### Páginas principales

| Página | Funcionalidad clave |
|--------|---------------------|
| **Home** | Hero carrusel (guitarras, teclados, baterías, bajos), info empresa, carrusel de marcas, categorías destacadas |
| **Productos** | Filtros (categoría, marca, precio), ordenamiento, tamaño de grid, productos relacionados por categoría |
| **Favoritos** | Lista persistente con cuenta Google |
| **Cotización** | Agregar productos y solicitar información (sin pagos) |
| **Marcas** | Listado alfabético y productos por marca |
| **Servicios** | Técnico, ingeniería de audio, asesoría, pruebas, apartados, garantías |
| **Contacto** | Sucursales, mapas, horarios, teléfonos, WhatsApp |

### Panel admin (`/admin`)

1. **Dashboard** — métricas y actividad reciente  
2. **Productos** — CRUD con imágenes, precio, categoría, marca y relacionados  
3. **Categorías** — crear, editar y organizar  
4. **Marcas** — logos y orden visual  
5. **Banners / Home** — hero, CTAs e imágenes  
6. **Servicios** — textos y contenido visual  

---

## Base de datos (esquema inicial)

Tablas previstas en Supabase:

```
profiles
products
categories
brands
product_images
favorites
services
banners
related_products
```

---

## Seguridad

- Roles: `admin` y `user`
- Middleware para proteger `/admin`
- Row Level Security (RLS) en Supabase
- Variables sensibles en `.env.local` (no commitear)
- Cloudflare: protección, bots, cache y CDN

---

## SEO, rendimiento y accesibilidad

**SEO:** metadata dinámica, Open Graph, sitemap, `robots.txt`, URLs limpias, imágenes optimizadas.

**Rendimiento:** lazy loading, cache, animaciones ligeras, optimización móvil.

**Accesibilidad:** navegación clara, contraste, tipografía legible, responsive real.

**Legal (pendiente):** política de privacidad, términos y condiciones, política de cookies.

---

## Fases de implementación

| Fase | Enfoque |
|------|---------|
| **1** | Optimización de estructura (Lovable) |
| **2** | Arquitectura backend Supabase |
| **3** | Auth + roles |
| **4** | Panel administrativo |
| **5** | Productos dinámicos |
| **6** | Favoritos + cotización |
| **7** | SEO, seguridad y optimización |

---

## Configuración local

```bash
# Instalar dependencias
npm install

# Variables de entorno
cp .env.example .env.local
# Editar .env.local con credenciales de Supabase

# Servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Panel admin: [http://localhost:3000/admin](http://localhost:3000/admin).

**Importante:** La UI de Lovable ya está migrada al proyecto Next.js (raíz). Edita solo `src/` en la raíz. La carpeta `responsive-web-design/` queda como archivo de referencia (no se compila).

### Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo con hot reload |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |

### Estructura del código

```
src/
  app/
    (site)/          # Sitio público (header + footer)
    admin/           # Panel administrativo
    auth/callback/   # OAuth Supabase
  components/        # UI, layout, home
  lib/               # Supabase, constantes
  types/             # Tipos TypeScript
supabase/migrations/ # Esquema SQL inicial
```

### Supabase

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Copia URL y `anon key` a `.env.local`.
3. Aplica la migración inicial: `supabase/migrations/20260520000000_initial_schema.sql`.
4. Configura Google Auth en Authentication → Providers.

Consulta el [roadmap](./ROADMAP.md), el [PRD](./prd.md) y el [estado del proyecto](./ESTADO_PROYECTO.md).

---

## Principios de diseño

- Minimalista, elegante, limpio y premium  
- Jerarquía visual clara y navegación rápida  
- Evitar saturación de color, animaciones excesivas o interfaces pesadas  

---

## Licencia y contacto

Proyecto privado para **Radio Shalko**.  
Sucursales: Chalco y Amecameca (ver sección Contacto en el sitio).

---

*Documento derivado del [PRD V1](./prd.md). Actualizar este README cuando cambien alcance o stack.*
