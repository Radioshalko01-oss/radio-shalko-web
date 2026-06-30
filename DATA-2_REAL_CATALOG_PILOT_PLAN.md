# DATA-2 — Plan de catálogo real piloto (Radio Shalko)

**Proyecto:** Radio Shalko WEB (independiente — no SEEDIS)  
**Fase:** DATA-2 · Primera carga controlada en staging  
**Fecha:** 2026-06-22  
**Base:** DATA-1 (`DATA-1_CATALOG_AUDIT.md`, `DATA-1_PRODUCT_TEMPLATE.md`)

---

## 1. Resumen

DATA-2 prepara la **primera carga manual** de productos reales en staging sin tocar Sales OS, Stripe ni la base de datos de forma destructiva. Se entregan:

- Plantilla CSV de captura (`DATA-2_PRODUCT_INTAKE_TEMPLATE.csv`)
- Guía de llenado (`DATA-2_PRODUCT_INTAKE_GUIDE.md`)
- Estructura de piloto **10–20 slots** (sin productos inventados)
- Checklist de carga en admin
- Estrategia segura de reemplazo del mock
- Inventario de **mock residual** en UI y recomendación DATA-2B

**No se cargaron productos reales en esta fase** — solo documentación y plantillas para el operador.

---

## 2. Objetivo del piloto

1. Validar el **proceso operativo** (captura → admin → PDP → carrito → solicitud).
2. Tener **10–20 SKUs reales** con foto, precio verificado y copy comercial en staging.
3. **Reemplazar gradualmente** productos mock equivalentes, uno a uno.
4. Confirmar que el catálogo piloto se siente **creíble** antes de escalar o pensar en CSV/script.

---

## 3. Cantidad recomendada de productos

| Parámetro | Valor |
|-----------|-------|
| **Mínimo útil** | 10 productos reales |
| **Ideal piloto** | 15–20 productos reales |
| **Máximo piloto** | 20 (no intentar todo el catálogo) |

Motivo: calidad de foto/descripción > volumen. Cada producto requiere QA en PDP y carrito.

---

## 4. Categorías sugeridas (estructura vacía)

La **selección final debe salir del inventario real** de Radio Shalko (piso, bodega, rotación, WhatsApp).  
La tabla siguiente define **slots a llenar**, no productos concretos.

| Subcategoría | Slots sugeridos | Notas para operador |
|--------------|-----------------|---------------------|
| Guitarras acústicas | 3 | Priorizar top sellers |
| Guitarras eléctricas | 3 | Incluir rango entrada y medio |
| Bajos | 2 | |
| Teclados | 2 | |
| Amplificadores | 1 | Categoría Accesorios |
| Pedales o Cables | 1 | Accesorios |
| Mezcladoras | 1 | Equipos de Audio |
| Bafles | 1 | Equipos de Audio |
| Ukuleles | 1 | Opcional si hay stock |
| Violines o Docerolas | 1 | Opcional según piso |
| **Total orientativo** | **15–17** | Ajustar a ±20 según realidad |

### Criterios de selección (operador)

1. Productos que **más se preguntan** en tienda/WhatsApp.  
2. Al menos un producto con stock confirmado en **Chalco** y otro en **Amecameca**.  
3. Mezcla de **marcas propias/distribuidas** (Extreme, Century, Segovia, Tagima, etc.) y marcas globales que manejan.  
4. Rango de precio variado (entrada / medio / premium) para probar home "destacados".  
5. Solo productos con **foto real disponible** o sesión fotográfica agendada.

---

## 5. Plantilla CSV creada

**Archivo:** `DATA-2_PRODUCT_INTAKE_TEMPLATE.csv`

| Columna | Propósito |
|---------|-----------|
| status | draft / ready / published |
| real_sku | SKU real único |
| product_name | Título |
| brand | Marca |
| category | Instrumentos / Accesorios / Equipos de Audio |
| subcategory | Una de 13 seed |
| price_mxn | Precio entero MXN |
| is_new | true/false |
| is_published | false hasta QA |
| short_description | 1–2 frases |
| commercial_description | Copy PDP |
| specs | `Label:Valor \| Label2:Valor2` |
| image_1_filename / image_1_alt | Foto principal |
| image_2_filename / image_2_alt | Foto secundaria opcional |
| chalco_internal_stock / amecameca_internal_stock | Stock interno |
| public_availability_note | Nota operador |
| admin_notes | Contexto interno |

Incluye filas `INSTRUCCIONES` y `EXAMPLE` (sin datos reales) — **borrar antes de capturar**.

---

## 6. Guía de llenado creada

**Archivo:** `DATA-2_PRODUCT_INTAKE_GUIDE.md`

Cubre: obligatorios/opcionales, SKU, taxonomía, precio, descripciones, specs, imágenes, alt text, disponibilidad sin stock público, borrador vs publicado, errores frecuentes.

---

## 7. Checklist de carga manual en admin

Ruta base: **`/admin/productos/nuevo`** (staging).

### Por cada fila `ready` del CSV

| # | Paso | Detalle |
|---|------|---------|
| 1 | **Crear o confirmar marca** | Admin → Marcas. Nombre y slug coherentes. Logo opcional. |
| 2 | **Confirmar categoría / subcategoría** | Deben existir en seed; subcategoría coherente con categoría. |
| 3 | **Crear producto** | Título = `product_name`, SKU = `real_sku`, slug revisar preview. |
| 4 | **Subir imagen real** | Galería → principal + adicionales. Nombres según CSV. |
| 5 | **Agregar precio** | `price_mxn` entero, verificado. |
| 6 | **Agregar descripción** | Subtítulo + descripción comercial desde CSV. |
| 7 | **Agregar specs verificadas** | Parsear columna `specs` a pares label/value. |
| 8 | **Revisar inventario interno** | Admin producto o Inventario: Chalco / Amecameca según CSV. |
| 9 | **Guardar como borrador** | `is_published = false` (Oculto). |
| 10 | **Revisar PDP** | Abrir `/productos/[slug]` en staging: título, precio, imagen, copy, disponibilidad cualitativa. |
| 11 | **Publicar cuando aprobado** | Toggle publicado + marcar fila CSV `published`. |
| 12 | **Probar carrito** | Agregar al carrito → `/carrito` → verificar total y línea. Opcional: solicitud checkout sin pagar. |

### QA cruzado (una vez por lote de 5 productos)

- [ ] Home muestra productos reales en Novedades/Destacados si aplican `is_new` o precio.  
- [ ] `/productos` filtra por subcategoría correcta.  
- [ ] `/marcas` muestra marca y productos reales.  
- [ ] Favoritos guarda UUID correcto.  
- [ ] Admin lista el SKU real (no `prod-NNN`).

---

## 8. Estrategia para reemplazar mock

### Principios

- **No borrar mock de golpe.**  
- **No despublicar los 39 a la vez.**  
- **Un producto real a la vez** con verificación completa.

### Flujo por producto

```
1. Capturar en CSV (status=ready)
2. Cargar producto REAL en admin (borrador)
3. QA PDP en staging
4. Probar carrito
5. Publicar producto REAL
6. Identificar mock equivalente (misma subcategoría / producto sustituto)
7. Despublicar mock equivalente (is_published=false) — NO eliminar fila
8. Anotar en admin_notes del CSV qué mock se despublicó (slug mock)
9. Repetir
```

### Identificar mock equivalente

| Situación | Acción |
|-----------|--------|
| Mock mismo tipo (ej. guitarra acústica Yamaha) | Despublicar mock más parecido por título/marca |
| Real es producto nuevo sin mock cercano | Solo publicar real; mock de subcategoría puede quedar hasta llenar slot |
| Varios mock misma subcategoría | Despublicar uno por cada real publicado; mantener mínimo en staging hasta completar piloto |

### Si no hay equivalente directo

- Publicar el real **con slug nuevo** (admin auto-genera).  
- Dejar mocks de esa subcategoría visibles **temporalmente** — el catálogo mostrará real + mock hasta completar reemplazos.  
- Priorizar despublicar mocks con **misma marca** para evitar duplicados confusos en `/marcas`.  
- Registrar en hoja de control: `mock_slug_despublicado` en `admin_notes`.

### Prohibido en piloto

- `DELETE` masivo en Supabase  
- `import-catalog-from-mock.ts --commit`  
- Reutilizar slug mock para producto distinto sin despublicar el mock primero

---

## 9. Riesgos de slugs y SKUs

| Riesgo | Mitigación |
|--------|------------|
| Reutilizar slug de mock | Crear producto real → slug nuevo; despublicar mock aparte. No editar slug mock a mano si hay favoritos/pedidos de prueba. |
| SKU `prod-001`… | Nunca en productos reales. |
| SKU duplicado | Admin valida unicidad; verificar antes de guardar. |
| Slug auto `marca-modelo-2` | Aceptable; preferible a colisión con mock activo. |
| Mismo modelo dos veces | Un SKU por variante (color/talla si aplica); notas en admin. |
| Marca duplicada (Fender vs fender) | Usar marcas existentes en admin; no crear duplicado por mayúsculas. |
| Mock y real publicados simultáneos | Temporalmente OK en piloto; despublicar mock al confirmar real. |

**No se modifica la lógica de generación de slugs** en DATA-2 (`ensureUniqueSlug` en product-actions permanece).

---

## 10. Riesgos generales

| Riesgo | Severidad | Notas |
|--------|-----------|-------|
| Precio incorrecto en staging | Alta | Revisión gerencia antes de `published` |
| Foto genérica residual | Media | Checklist paso 4 |
| Conteos home incorrectos (mock) | Media | DATA-2B |
| Carrito con UUID mock mezclado | Baja | Usuarios prueba; limpiar carrito local |
| Piloto >20 productos sin QA | Media | Limitar a 20 |
| Operador copia specs de internet sin verificar | Alta | Capacitación + guía DATA-1 §8 |

---

## 11. Mock residual pendiente

Auditoría de código (sin cambios en DATA-2):

| Archivo | Dependencia mock | Impacto |
|---------|------------------|---------|
| `src/components/site/categories.tsx` | `countProducts()` de `@/lib/products` | **Conteos en home** pueden no coincidir con Supabase cuando mock ≠ BD |
| `src/components/site/header.tsx` | `BRANDS`, `CATEGORY_TREE`, `formatPrice` | **Mega-menú** usa taxonomía estática mock, no marcas activas Supabase |
| `src/components/pages/marcas-page.tsx` | `BRANDS` fallback | Solo si no hay marcas activas en BD |
| `src/components/site/featured-product-card.tsx` | Tipo `Product` mock | **Componente legacy** — no usado en home actual (`ProductCard` + Supabase) |
| `src/lib/catalog/mock-adapter.ts` | Adaptador mock | Legacy; no ruta pública principal |
| `src/lib/products.ts` | 39 SAMPLES | Fuente import B5; sigue en repo |
| `scripts/import-catalog-from-mock.ts` | Import mock | **No ejecutar --commit** en piloto |

### Superficies que ya usan Supabase ✅

`/`, `/productos`, PDP, featured home, carrito, favoritos, checkout, marcas (productos).

### Recomendación

| Opción | Cuándo |
|--------|--------|
| **DATA-2B** (recomendado) | Tras **5+ productos reales** publicados: conectar `categories.tsx` y `header.tsx` a `getCatalogProducts` / `getCategoriesTree` / `getBrands({ activeOnly: true })`. Cambio acotado, bajo riesgo. |
| Incluir en DATA-2 código | Solo si el equipo quiere conteos correctos **antes** del primer producto real — opcional, no bloqueante para piloto. |

**Decisión DATA-2:** no modificar código; documentar para DATA-2B.

---

## 12. Recomendación siguiente

### DATA-2 operativo (operador + staging)

1. Duplicar CSV, borrar filas INSTRUCCIONES/EXAMPLE.  
2. Seleccionar 15–17 slots §4 con inventario real.  
3. Sesión fotográfica o fotos de piso por SKU.  
4. Llenar CSV → status `ready`.  
5. Cargar en admin siguiendo checklist §7.  
6. Reemplazar mock uno a uno §8.  
7. Reunión de cierre piloto: ¿listo para más productos o script CSV (DATA-3)?

### DATA-2B (desarrollo, post-piloto inicial)

- Eliminar `countProducts` mock en `categories.tsx`.  
- Header: categorías/marcas desde Supabase.  
- Evaluar deprecar `featured-product-card.tsx` y `mock-adapter.ts`.

### DATA-3 (futuro, si volumen >30)

- Script CSV → Supabase con dry-run, imágenes batch a Storage.  
- Fuera de alcance DATA-2.

---

## Anexo — Archivos DATA-2

| Archivo | Rol |
|---------|-----|
| `DATA-2_PRODUCT_INTAKE_TEMPLATE.csv` | Captura tabular piloto |
| `DATA-2_PRODUCT_INTAKE_GUIDE.md` | Instrucciones por columna |
| `DATA-2_REAL_CATALOG_PILOT_PLAN.md` | Este documento |
| `DATA-1_CATALOG_AUDIT.md` | Contexto técnico |
| `DATA-1_PRODUCT_TEMPLATE.md` | Plantilla narrativa alternativa |

---

## Criterios de aceptación DATA-2

| # | Criterio | Estado |
|---|----------|--------|
| 1 | `DATA-2_PRODUCT_INTAKE_TEMPLATE.csv` | ✅ |
| 2 | `DATA-2_PRODUCT_INTAKE_GUIDE.md` | ✅ |
| 3 | `DATA-2_REAL_CATALOG_PILOT_PLAN.md` | ✅ |
| 4 | Sin productos inventados | ✅ |
| 5 | Sin precios/marcas inventados | ✅ |
| 6 | Sales OS sin cambios | ✅ |
| 7 | Stripe sin cambios | ✅ |
| 8 | BD sin cambios destructivos | ✅ |
| 9 | Mock no borrado | ✅ |
| 10 | Estrategia reemplazo documentada | ✅ |
| 11 | Mock residual documentado | ✅ |
| 12 | `npm run build` exit 0 | ✅ |

---

*DATA-2 completado · Radio Shalko WEB · Independiente de SEEDIS*
