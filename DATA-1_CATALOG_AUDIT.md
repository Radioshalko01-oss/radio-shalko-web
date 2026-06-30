# DATA-1 — Auditoría y preparación del catálogo real

**Proyecto:** Radio Shalko WEB (independiente — no SEEDIS)  
**Fase:** DATA-1 · Preparación de catálogo  
**Fecha:** 2026-06-22  
**Base:** Sales OS v1 + DESIGN-3.1 + Supabase Radio Shalko staging

---

## 1. Resumen ejecutivo

Radio Shalko WEB **ya consume catálogo desde Supabase** en las rutas públicas principales (`/`, `/productos`, PDP, marcas con productos). Sin embargo, los **39 productos publicados actuales provienen del import B5** desde `src/lib/products.ts` — un catálogo **de demostración**, no inventario real de tienda.

**Hallazgos clave:**

| Área | Estado |
|------|--------|
| Esquema Supabase | ✅ Completo para catálogo operativo |
| Admin CRUD productos | ✅ Crear/editar, imágenes, specs, inventario |
| Productos en BD | ⚠ 39 publicados — **contenido mock importado** |
| Descripciones / specs | ❌ Vacías (import no las crea) |
| Imágenes producto | ⚠ Genéricas por subcategoría (grid), no foto real por SKU |
| SKUs | ⚠ `prod-001`…`prod-039` (ids mock) |
| Precios | ⚠ Referencia del mock — **no verificados con tienda** |
| Stock en BD | ⚠ Filas existen (Chalco + Amecameca) pero **quantity = 0** |
| Residuos mock en UI | ⚠ Home categorías y header aún leen `lib/products.ts` parcialmente |
| Script import | ✅ Existe, idempotente, dry-run por defecto |

**Recomendación DATA-2:** Carga mixta — **10–20 productos piloto manuales** en admin (calidad y proceso) + plantilla `DATA-1_PRODUCT_TEMPLATE.md` + eventual script CSV para lotes, **sin re-ejecutar import mock** sobre productos reales.

**Esta fase no modificó BD, Sales OS, Stripe ni código de negocio.**

---

## 2. Estado del catálogo actual

### 2.1 Supabase (validado con `npm run db:import -- --verify`)

```
[PASS] 39 productos publicados
[PASS] slugs únicos 39/39
[PASS] todos con >=1 imagen
[PASS] inventario en ambas sucursales (filas creadas)
```

### 2.2 Origen de los datos

| Fuente | Rol hoy |
|--------|---------|
| `src/lib/products.ts` | 39 productos SAMPLES + 28 marcas lista estática + árbol categorías |
| `scripts/import-catalog-from-mock.ts` | Volcó mock → Supabase (marcas, productos, imágenes, inventario 0) |
| Migraciones seed | 3 categorías, 13 subcategorías, 2 sucursales (Chalco, Amecameca) |
| Admin panel | Fuente de verdad para **ediciones futuras** |

### 2.3 Sitio público — qué lee qué

| Superficie | Fuente de datos |
|------------|-----------------|
| `/`, `/productos`, PDP | ✅ `getCatalogProducts()` / Supabase |
| `/marcas` (productos) | ✅ Supabase; fallback lista `BRANDS` mock si no hay marcas activas |
| Home `FeaturedProducts` | ✅ Supabase |
| Home `Categories` (conteos) | ⚠ **`countProducts()` del mock** — puede desincronizar |
| Home `Brands` (marquee logos) | ⚠ **Lista hardcodeada** (13 logos en `/public/images/brands/`) |
| Header mega-menú | ⚠ **`CATEGORY_TREE` + `BRANDS` del mock** |
| Favoritos / carrito / checkout | ✅ IDs UUID de Supabase (`getProductsByIds`) |

### 2.4 Taxonomía

**Categorías (seed):** Instrumentos · Accesorios · Equipos de Audio  

**Subcategorías (13, seed):** Guitarras acústicas/eléctricas, Bajos, Docerolas, Teclados, Violines, Baterías, Ukuleles, Amplificadores, Pedales, Cables, Mezcladoras, Bafles  

**Marcas en BD (post-import mock):** ~20 slugs (Fender, Yamaha, Gibson, Roland, etc.) — mezcla marcas globales del mock.  

**Marcas en home marquee (visual):** Behringer, Yamaha, Casio, Shure, Ibanez, Extreme, Century, McCartney, Segovia, Epiphone, Tagima, Roland, Fender — **más alineadas a Radio Shalko real**, no idénticas al listado mock.

---

## 3. Datos mock detectados

### 3.1 Productos (`src/lib/products.ts`)

- **39 ítems** generados desde `SAMPLES` con ids `prod-001`…`prod-039`.
- Nombres de modelo **genéricos** (ej. "Stratocaster Player Series", "Les Paul Studio") — útiles para UI demo, **no garantizados como SKUs de piso**.
- Precios en MXN enteros — **referencia visual**, no cotización oficial.
- Imagen = **una foto por subcategoría** (`/images/categories/cat-grid-*.jpg`), repetida entre productos de la misma subcategoría.
- Segunda imagen hover = `GALLERY_ALT` por subcategoría (solo en componentes mock legacy).
- Sin `description`, `subtitle`, ni specs en el mock.

### 3.2 Import B5 ya ejecutado en staging

El script (`--commit`) creó/actualizó:

- Marcas, productos `is_published: true`
- 1 imagen por producto (URL del mock)
- Inventario `quantity = 0` en Chalco y Amecameca (no sobrescribe si ya había stock)

**Riesgo:** Re-ejecutar `--commit` **no borra** productos reales futuros (upsert por slug), pero **sí puede resetear campos** del upsert de producto si se vuelve a correr sobre mismos slugs.

### 3.3 Residuos mock en código (no BD)

| Archivo | Uso mock |
|---------|----------|
| `src/lib/products.ts` | Fuente original + `countProducts`, `BRANDS`, `CATEGORY_TREE` |
| `src/lib/catalog/mock-adapter.ts` | Adaptador temporal mock → CatalogProduct |
| `src/components/site/categories.tsx` | Conteos de productos |
| `src/components/site/header.tsx` | Navegación marcas/categorías |
| `src/components/site/featured-product-card.tsx` | Tipo `Product` mock (legacy; home usa `ProductCard` + Supabase) |

---

## 4. Datos incompletos

| Campo / aspecto | Estado en BD (39 productos importados) | Impacto público |
|-----------------|----------------------------------------|-----------------|
| `description` | Vacío (import no lo setea) | PDP sin copy comercial |
| `subtitle` | Vacío | Sin línea secundaria bajo título |
| `product_specs` | 0 filas (import no crea) | Sección specs oculta |
| Imágenes | 1 URL genérica por subcategoría | Credibilidad baja; productos iguales visualmente |
| `sku` | `prod-NNN` mock | No usable en operación real |
| `price` | Del mock | Debe reemplazarse con precio tienda |
| `product_inventory.quantity` | 0 en ambas sucursales | Público: "Consultar disponibilidad" en todos |
| `brands.logo_url` | Probablemente null (import no sube logos) | Marcas sin logo en admin/listados |
| `related_products` | Sin vínculos manuales | Relacionados = algoritmo subcategoría/marca |
| Precio anterior / oferta | **No existe columna** | Solo vía copy manual o `subtitle` |
| Flag "destacado" | **No existe** | Home usa `is_new` o orden por precio |

### Qué conservar

- **Taxonomía seed** (categorías, subcategorías, sucursales) — alineada al negocio.
- **Esquema y admin CRUD** — listo para datos reales.
- **Slugs generados** — pueden servir de base si el operador valida título/marca; mejor regenerar desde nombre real.
- **Estructura de 39 productos** — útil como **mapa de cobertura** de subcategorías para DATA-2 piloto, **no como catálogo final**.

### Qué reemplazar

- Títulos, SKUs, precios, descripciones, specs, imágenes de **todos** los productos importados del mock.
- Inventario interno cuando el operador confirme existencias.
- Lista mock en header/categorías (tarea DATA-2/3 código, no DATA-1).

---

## 5. Estructura actual de datos

### 5.1 Tablas Supabase

```
categories          → id, name, slug, sort_order, is_active, description
subcategories       → id, category_id, name, slug, sort_order, is_active
brands              → id, name, slug, logo_url, sort_order, is_active, description
products            → id, title, subtitle, description, price, sku, slug,
                      category_id, brand_id, subcategory_id,
                      is_new, is_published, created_at, updated_at
product_images      → id, product_id, url, alt_text, sort_order
product_specs       → id, product_id, label, value, sort_order
product_inventory   → product_id, branch_id, quantity, updated_at
branches            → id, slug, name, display_name, address, …
related_products    → product_id, related_product_id
favorites           → user_id, product_id  (FK productos publicados)
quote_items         → vía Sales OS (FK product_id)
order_items         → vía pedidos (FK product_id)
```

### 5.2 RLS relevante

- Público: solo `products.is_published = true`.
- Admin:  borradores + edición completa.
- Inventario legible en público pero UI **no expone cantidades** (solo Disponible / Consultar).

### 5.3 Código clave

| Archivo | Función |
|---------|---------|
| `src/lib/catalog/queries.ts` | Lectura pública catálogo, filtros, relacionados |
| `src/lib/catalog/mappers.ts` | `PRODUCT_SELECT` + normalización |
| `src/lib/admin/product-queries.ts` | Listado admin paginado, filtros stock |
| `src/lib/admin/product-actions.ts` | CRUD, specs, inventario, imágenes URL |
| `src/lib/admin/product-image-upload.ts` | Upload Storage `product-images` (hasta 6 imgs) |
| `src/components/admin/product-form.tsx` | Formulario crear/editar |
| `scripts/import-catalog-from-mock.ts` | Import mock (dry-run / commit / verify) |

---

## 6. Campos requeridos por producto

### Mínimo viable publicable (MVP catálogo real)

| Campo | Obligatorio | Dónde se captura |
|-------|-------------|------------------|
| Título | ✅ | Admin → Producto |
| Marca | ✅ | Select marcas |
| Categoría + subcategoría | ✅ | Select (subcategoría debe pertenecer a categoría) |
| Precio MXN entero | ✅ | Admin |
| Slug | ✅ (auto) | Generado; revisar unicidad |
| Al menos 1 imagen real | ✅ recomendado | Upload galería |
| `is_published` | ✅ decisión | false hasta QA |
| SKU real | ✅ operación | Único en BD |

### Recomendado para calidad comercial

| Campo | Notas |
|-------|-------|
| Subtítulo | 1 línea bajo el título |
| Descripción | Guía §8 |
| 2–4 specs verificadas | Ficha técnica |
| Alt text por imagen | Accesibilidad + SEO |
| Inventario por sucursal | Interno; alimenta "Disponible" |
| `is_new` | Solo lanzamientos reales |

### No requerido hoy (schema)

- Precio anterior (sin columna)
- Flag destacado (home usa heurística)
- Envíos / direcciones
- Stock exacto en UI pública

---

## 7. Plantilla de producto real

Ver archivo dedicado: **`DATA-1_PRODUCT_TEMPLATE.md`**

Incluye secciones copiables: identificación, precio, textos, specs, imágenes, disponibilidad interna, checklist de publicación.

---

## 8. Guía de descripciones (Radio Shalko)

### Tono

- **Profesional** — tienda con 40+ años, no marketplace genérico.
- **Claro** — frases cortas; evitar jerga sin explicar.
- **Musical** — hablar al músico/técnico real, no al "usuario".
- **Confiable** — solo afirmar lo verificable.
- **Sin hype** — evitar "el mejor del mercado", "increíble", "premium" vacío.
- **Sin voz IA** — no listas de adjetivos ni "perfecto para todo tipo de…".

### Estructura (5 bloques)

1. **Qué es** — instrumento/equipo + modelo en lenguaje natural.  
2. **Para quién sirve** — nivel, contexto (casa, ensayo, iglesia, evento).  
3. **Beneficio principal** — una razón concreta para considerarlo.  
4. **Detalles relevantes** — 2–4 hechos confirmados (no inventar madera, watts, etc.).  
5. **Recolección** — "Solicítalo en línea; recoge en Chalco o Amecameca cuando confirmemos tu pedido."

### Ejemplo de esqueleto (rellenar con datos reales)

> La **FG800** es una guitarra acústica de la línea **Yamaha** orientada a quien busca un instrumento confiable para practicar y tocar en casa.  
> Su construcción tradicional y una acción cómoda la hacen una opción sensata para principiantes y guitarristas que quieren un daily player sin complicaciones.  
> Incluye [detalle verificado].  
> Disponible para solicitud en nuestro sitio; coordina recolección en **Chalco** o **Amecameca** con nuestro equipo.

### Evitar

- Especificaciones no confirmadas  
- Comparaciones denigrando otras marcas  
- Promesas de envío a domicilio (fuera de scope Sales OS v1)  
- Mencionar stock exacto ("quedan 3 unidades")

---

## 9. Guía de imágenes

### Estándar por producto

| Criterio | Requisito |
|----------|-----------|
| Fondo | Limpio, neutro (blanco, gris claro o negro suave) |
| Producto | Centrado, completo, sin recortes agresivos |
| Resolución | Mín. 1200 px lado largo; ideal 2000+ px |
| Proporción | Consistente en catálogo (cuadrado 1:1 o 4:5) |
| Cantidad | 1 obligatoria; 2–4 recomendadas (detalle, ángulo, escala) |
| Formato | JPG, PNG o WEBP · máx. 5 MB (límite admin) |
| Alt text | "[Marca] [Modelo] — vista frontal" (descriptivo, no spam) |

### Prohibido / evitar

- Logos de terceros no autorizados superpuestos  
- Marcas de agua ajenas  
- Fotos de catálogo competidor sin licencia  
- Imágenes pixeladas o muy comprimidas  
- Renders IA evidentes  
- Reutilizar la misma imagen para SKUs distintos  

### Almacenamiento

- Bucket Supabase: `product-images/{productId}/main.{ext}` + galería adicional  
- URLs públicas registradas en `product_images`  

### Assets editoriales existentes (no sustitutos de foto producto)

- `/public/images/categories/` — grids home/catálogo  
- `/public/images/catalogo/` — tarjetas "compra por categoría"  
- `/public/images/brands/` — logos marquee home  

---

## 10. Catálogo mínimo recomendado (estructura vacía)

**Objetivo:** ~30 SKUs reales para prueba de catálogo creíble — **el operador llena filas**, no el equipo dev.

| Subcategoría | Slots sugeridos | Notas operador |
|--------------|-----------------|----------------|
| Guitarras acústicas | 5 | |
| Guitarras eléctricas | 5 | |
| Bajos | 5 | |
| Teclados | 5 | |
| Ukuleles | 2 | |
| Baterías | 3 | |
| Amplificadores | 3 | |
| Mezcladoras | 2 | |
| Bafles | 3 | |
| Accesorios (cables/pedales) | 2 | |
| **Total orientativo** | **~35** | Ajustar a inventario real |

### Priorización sugerida (DATA-2)

1. **Top sellers de piso** — lo que más se pregunta en WhatsApp.  
2. **Marcas propias / distribuidas** — Extreme, Century, McCartney, Segovia, Tagima + marcas globales que manejan.  
3. **Rango de precio** — entrada, medio, premium (para probar home "destacados").  
4. **Cobertura sucursal** — al menos un producto con stock confirmado en Chalco y otro en Amecameca.

Usar una fila de **`DATA-1_PRODUCT_TEMPLATE.md`** por slot.

---

## 11. Forma recomendada de carga

### Opciones evaluadas

| Opción | Pros | Contras | Veredicto |
|--------|------|---------|-----------|
| **A. Panel admin** | Validación zod, imágenes Storage, specs, inventario, borrador/publicado | Lento para 100+ SKUs | ✅ **Principal** |
| **B. CSV/Excel** | Rápido en volumen | No existe hoy; imágenes aparte; riesgo slugs duplicados | DATA-3 si crece catálogo |
| **C. Script importación** | Idempotente, dry-run (`import-catalog-from-mock.ts`) | Solo diseñado para mock; sin imágenes upload | ⚠ Solo migraciones controladas |
| **D. Mixta** | Calidad + escala | Requiere disciplina | ✅ **Recomendada** |

### Recomendación: **D — Mixta**

**Fase DATA-2 (piloto):**

1. Operador captura 10–20 productos con **`DATA-1_PRODUCT_TEMPLATE.md`**.  
2. Carga **manual en admin** (crear producto → imágenes → specs → inventario → publicar en staging).  
3. QA en staging: PDP, carrito, checkout solicitud, favoritos.  
4. Ocultar (`is_published = false`) o archivar slugs mock que se reemplacen — **no borrar masivo** sin confirmación.

**Fase DATA-3+ (escala):**

- Script CSV → Supabase (nuevo, basado en plantilla) con dry-run.  
- Imágenes: lote a Storage + CSV de URLs, o carga manual post-import.

**No recomendado ahora:**

- Re-ejecutar `import-catalog-from-mock.ts --commit` sobre staging con productos reales mezclados.  
- Carga masiva sin imágenes reales.

---

## 12. Riesgos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Catálogo publicado parece real pero es demo | **Alta** | DATA-2: reemplazar o despublicar mock; comunicar a equipo |
| Precios mock en producción | **Alta** | No activar dominio final hasta QA precios |
| Conteos home (`categories.tsx`) desincronizados | Media | DATA-2/3: query Supabase en lugar de mock |
| Header navega taxonomía mock | Media | Conectar a `getCategoriesTree()` / marcas activas |
| Re-import mock sobrescribe productos por slug | Media | No usar `--commit` salvo entorno limpio |
| Favoritos/pedidos referencian UUID mock | Baja | Al despublicar producto, usuario pierde favorito — aceptable en staging |
| Sin specs/descripciones → SEO débil | Media | Completar en piloto antes de go-live catálogo |
| Inventario 0 → todo "Consultar" | Esperado | Operador carga stock interno; público sigue cualitativo |

---

## 13. Siguiente fase recomendada (DATA-2)

1. **Seleccionar 10–20 SKUs reales** con el operador (usar §10).  
2. **Capturar** con `DATA-1_PRODUCT_TEMPLATE.md`.  
3. **Cargar en admin staging** + fotos reales.  
4. **Despublicar** productos mock equivalentes (mismo slug/subcategoría) — uno a uno, con confirmación.  
5. **Smoke test** Sales OS: carrito → checkout solicitud → admin aprueba → pago test.  
6. **Código (DATA-2B opcional):** eliminar dependencias mock en `categories.tsx` y `header.tsx`.  
7. **Evaluar script CSV** si el piloto supera ~30 productos.

---

## Anexo — Dependencias carrito / favoritos / pedidos

- **Favoritos:** `favorites.product_id` → UUID Supabase. Producto despublicado deja de aparecer en `getProductsByIds`.  
- **Carrito / cotización:** IDs en localStorage + sync Supabase (`quote_items`). Mismas reglas.  
- **Pedidos:** `order_items` snapshot por pedido; cambios de catálogo no alteran pedidos históricos.  
- **Shared cart / POS:** Referencian product_id activos.

---

*DATA-1 completado · Sin cambios a BD, Sales OS, Stripe · Radio Shalko WEB independiente de SEEDIS*
