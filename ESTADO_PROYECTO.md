# Estado del proyecto — Radio Shalko Web

**Última actualización:** 20 de mayo de 2026  
**Versión del producto:** V1 (catálogo + admin, sin ecommerce)  
**Referencias:** [PRD](./prd.md) · [README](./README.md)

---

## Resumen ejecutivo

Radio Shalko Web es un catálogo profesional con panel administrativo para la empresa Radio Shalko. La V1 prioriza exhibición de productos, cotización (sin pagos), favoritos con login Google y gestión de contenido desde `/admin`.

| Indicador | Valor |
|-----------|--------|
| **Fase global** | Pre-desarrollo estructurado / transición desde prototipo visual |
| **Avance estimado V1** | ~15–20 % (setup Next.js, rutas base, Supabase preparado; datos y auth pendientes) |
| **Bloqueador principal** | Credenciales Supabase + importar UI refinada de Lovable |
| **Próximo hito** | Fase 2: aplicar migraciones y conectar catálogo dinámico |

---

## Estado actual (snapshot)

### En este repositorio

| Elemento | Estado | Notas |
|----------|--------|-------|
| PRD V1 | ✅ Completado | `prd.md` — requisitos funcionales y técnicos |
| README | ✅ Completado | `README.md` — visión, stack y alcance |
| Este documento | ✅ Completado | Seguimiento de fases y entregables |
| Código fuente (Next.js) | ✅ Completado | Next.js 16, TypeScript, Tailwind, rutas públicas y `/admin` |
| Supabase (cliente + migración SQL) | 🔄 En progreso | Cliente SSR; migración en `supabase/migrations/`; falta proyecto remoto |
| `.env.example` | ✅ Completado | Plantilla de variables |
| Despliegue (Vercel) | ⏳ Pendiente | — |
| Cloudflare | ⏳ Pendiente | Recomendado en PRD, no configurado |

### Fuera de este repositorio (según PRD)

| Elemento | Estado | Notas |
|----------|--------|-------|
| UI inicial (Lovable / Cursor) | 🔄 En progreso | Interfaz visual parcial; requiere importación, revisión y optimización |
| Identidad / assets de marca | ❓ Por confirmar | Logos, imágenes hero, contenido legal |

---

## Roadmap por fases

Leyenda de estado: **✅** Completado · **🔄** En progreso · **⏳** Pendiente · **⏸️** Fuera de V1 / pausado

---

### Fase 0 — Definición y documentación

*No aparece en el PRD como fase numerada; corresponde al trabajo previo al desarrollo en repo.*

| # | Entregable | Estado |
|---|------------|--------|
| 0.1 | PRD V1 actualizado | ✅ |
| 0.2 | README del proyecto | ✅ |
| 0.3 | Documento de estado (este archivo) | ✅ |
| 0.4 | `.env.example` y guía de variables | ✅ |
| 0.5 | Estructura de carpetas Next.js acordada | ✅ |
| 0.6 | Criterios de aceptación por página (checklist QA) | ⏳ |

**Resultado de fase:** definición clara del producto; falta materializar el código en un solo repositorio.

---

### Fase 1 — Optimización estructura Lovable

**Objetivo:** Consolidar el frontend existente en una base Next.js mantenible, responsive y alineada al PRD.

| # | Entregable | Estado |
|---|------------|--------|
| 1.1 | Proyecto Next.js + TypeScript + Tailwind | ✅ |
| 1.2 | Integración Framer Motion (animaciones ligeras) | ✅ |
| 1.3 | Layout: Header (logo, menú, buscador, favoritos, cotización, login) | 🔄 |
| 1.4 | Home: hero carrusel (4 slides) | ✅ |
| 1.5 | Home: sección empresa (historia, compromiso, servicios) | ⏳ |
| 1.6 | Home: carrusel infinito de marcas (monocromo, pause on hover) | ⏳ |
| 1.7 | Home: grid categorías destacadas (10 categorías PRD) | ⏳ |
| 1.8 | Footer (categorías, contacto, redes, legales) | ⏳ |
| 1.9 | Responsive mobile-first (revisión en dispositivos reales) | ⏳ |
| 1.10 | Refactor / limpieza del código importado de Lovable | ⏳ |

**Dependencias:** acceso al código o export de Lovable/Cursor.  
**Criterio de cierre:** páginas estáticas navegables con diseño premium y sin regresiones móvil.

---

### Fase 2 — Arquitectura backend Supabase

**Objetivo:** Base de datos, storage y APIs listas para contenido dinámico.

| # | Entregable | Estado |
|---|------------|--------|
| 2.1 | Proyecto Supabase creado | ⏳ |
| 2.2 | Migraciones: `profiles`, `products`, `categories`, `brands` | ⏳ |
| 2.3 | Migraciones: `product_images`, `favorites`, `services`, `banners` | ⏳ |
| 2.4 | Migraciones: `related_products` | ⏳ |
| 2.5 | Storage buckets (imágenes producto, marcas, banners) | ⏳ |
| 2.6 | Cliente Supabase en Next.js (server + browser) | ⏳ |
| 2.7 | Tipos TypeScript generados desde schema | ⏳ |
| 2.8 | Seed inicial (categorías, marcas de prueba) | ⏳ |

**Criterio de cierre:** CRUD de productos posible vía Supabase Studio o script; imágenes subibles a Storage.

---

### Fase 3 — Sistema auth + roles

**Objetivo:** Login Google, perfiles y protección de rutas admin.

| # | Entregable | Estado |
|---|------------|--------|
| 3.1 | Auth Google en Supabase | ⏳ |
| 3.2 | Tabla `profiles` sincronizada con auth.users | ⏳ |
| 3.3 | Roles `user` y `admin` | ⏳ |
| 3.4 | RLS: lectura pública catálogo, escritura solo admin | ⏳ |
| 3.5 | Middleware Next.js: protección `/admin` | ⏳ |
| 3.6 | UI login / logout / estado de sesión en header | ⏳ |

**Criterio de cierre:** usuario anónimo navega; admin accede a `/admin`; usuario normal no entra al panel.

---

### Fase 4 — Panel administrativo

**Objetivo:** Gestión completa de contenido sin tocar código.

| # | Entregable | Estado |
|---|------------|--------|
| 4.1 | Layout admin (`/admin`) | ⏳ |
| 4.2 | Dashboard (conteos, actividad reciente) | ⏳ |
| 4.3 | CRUD productos + subida imágenes | ⏳ |
| 4.4 | CRUD categorías | ⏳ |
| 4.5 | CRUD marcas + logos | ⏳ |
| 4.6 | Gestión banners / hero home | ⏳ |
| 4.7 | Edición sección servicios | ⏳ |
| 4.8 | Búsqueda y filtros en listados admin | ⏳ |

**Criterio de cierre:** un administrador puede publicar un producto nuevo visible en el sitio público.

---

### Fase 5 — Productos dinámicos

**Objetivo:** Catálogo público alimentado por Supabase.

| # | Entregable | Estado |
|---|------------|--------|
| 5.1 | Página `/productos` con datos reales | ⏳ |
| 5.2 | Filtros: categoría, marca, precio | ⏳ |
| 5.3 | Ordenamiento (precio, A-Z, recientes) | ⏳ |
| 5.4 | Vista detalle de producto | ⏳ |
| 5.5 | Productos relacionados (por categoría) | ⏳ |
| 5.6 | Buscador general (header) | ⏳ |
| 5.7 | Página `/marcas` + productos por marca | ⏳ |
| 5.8 | Ajuste tamaño grid / cantidad por página | ⏳ |

**Criterio de cierre:** catálogo 100 % dinámico; sin datos hardcodeados en producción.

---

### Fase 6 — Favoritos + cotización

**Objetivo:** Funciones que requieren usuario autenticado (sin checkout).

| # | Entregable | Estado |
|---|------------|--------|
| 6.1 | Favoritos: agregar / quitar / listar | ⏳ |
| 6.2 | Página `/favoritos` (requiere login) | ⏳ |
| 6.3 | Cotización: agregar productos (estado local o DB) | ⏳ |
| 6.4 | Página `/cotizacion` + solicitud de información | ⏳ |
| 6.5 | Persistencia favoritos en `favorites` | ⏳ |

**Criterio de cierre:** usuario logueado guarda favoritos y arma cotización; sin flujo de pago.

---

### Fase 7 — SEO, seguridad y optimización

**Objetivo:** Producción lista: rendimiento, legales y hardening.

| # | Entregable | Estado |
|---|------------|--------|
| 7.1 | Metadata dinámica + Open Graph | ⏳ |
| 7.2 | `sitemap.xml` + `robots.txt` | ⏳ |
| 7.3 | URLs limpias y optimización de imágenes | ⏳ |
| 7.4 | Lazy loading y cache | ⏳ |
| 7.5 | Cloudflare (CDN, WAF, bots) | ⏳ |
| 7.6 | Despliegue Vercel (preview + production) | ⏳ |
| 7.7 | Política de privacidad, términos, cookies | ⏳ |
| 7.8 | Auditoría accesibilidad (contraste, navegación) | ⏳ |
| 7.9 | Pruebas de carga / rendimiento móvil | ⏳ |

**Criterio de cierre:** sitio en producción con métricas aceptables en móvil y documentos legales publicados.

---

## Matriz de funcionalidades V1

Estado por área funcional del PRD (no por fase de implementación).

| Área | Funcionalidad | Estado |
|------|---------------|--------|
| **Home** | Hero, empresa, marcas, categorías, footer | ⏳ UI parcial externa; sin integrar en repo |
| **Productos** | Listado, filtros, orden, detalle, relacionados | ⏳ |
| **Marcas** | Listado alfabético + productos por marca | ⏳ |
| **Servicios** | Página servicios (contenido editable) | ⏳ |
| **Contacto** | Chalco, Amecameca, mapas, horarios, WhatsApp | ⏳ |
| **Favoritos** | Con login Google | ⏳ |
| **Cotización** | Carrito sin checkout | ⏳ |
| **Auth** | Login Google | ⏳ |
| **Admin** | Dashboard y CRUD completo | ⏳ |
| **Backend** | Supabase completo | ⏳ |
| **Ecommerce** | Pagos, checkout, órdenes | ⏸️ Fuera de V1 |
| **App admin móvil** | — | ⏸️ Pausado |
| **Inventario avanzado** | — | ⏸️ Pausado |
| **Traspasos / SQLite offline** | — | ⏸️ Pausado |

---

## Infraestructura y entornos

| Componente | Entorno dev | Staging | Producción |
|------------|-------------|---------|------------|
| Repositorio Git | ⏳ Por inicializar en este folder | — | — |
| Supabase | ⏳ | ⏳ | ⏳ |
| Vercel | ⏳ | ⏳ | ⏳ |
| Cloudflare | ⏳ | ⏳ | ⏳ |
| Dominio / DNS | ❓ Por confirmar | — | — |
| `.env.local` | ⏳ Plantilla pendiente | — | — |

---

## Riesgos y dependencias

| Riesgo | Impacto | Mitigación sugerida |
|--------|---------|---------------------|
| Código Lovable no consolidado en un repo | Retraso Fase 1 | Exportar/importar a Next.js lo antes posible; congelar diseño aprobado |
| Contenido (textos, fotos, legales) incompleto | Retraso Fases 4–7 | Checklist de assets por sucursal y producto piloto |
| Sin proyecto Supabase | Bloquea Fases 2–6 | Crear proyecto y aplicar migraciones en sprint dedicado |
| Scope creep (ecommerce) | Desvío de V1 | Mantener cotización sin pagos; documentar V2 por separado |

---

## Próximos pasos recomendados (orden sugerido)

1. **Inicializar repositorio** — `create-next-app` con TypeScript, Tailwind, App Router.  
2. **Importar UI de Lovable** — componentes Home, Header, Footer; validar responsive.  
3. **Crear proyecto Supabase** — migraciones según tablas del PRD; configurar Storage.  
4. **`.env.example`** — documentar variables para el equipo.  
5. **Fase 3 en paralelo temprano** — Auth Google antes de favoritos para no rehacer flujos.  
6. **Producto piloto** — un producto, una categoría y una marca de punta a punta (admin → sitio).  

---

## Historial de actualizaciones

| Fecha | Cambio |
|-------|--------|
| 2026-05-20 | Creación del documento. Estado: solo documentación en repo; UI parcial fuera de repo según PRD. |
| 2026-05-20 | Setup Next.js: rutas, layouts, Supabase client, migración SQL, build OK. |

---

## Cómo mantener este documento

- Actualizar la **fecha** y la tabla **Historial** al cerrar cada fase o hito.  
- Cambiar estados de ⏳ → 🔄 → ✅ en las tablas de entregables.  
- Ajustar **Avance estimado V1** de forma conservadora hasta tener deploy de staging.  
- Enlazar PRs o commits relevantes cuando exista el repositorio Git activo.

---

*Documento vivo. Fuente de verdad funcional: [prd.md](./prd.md).*
