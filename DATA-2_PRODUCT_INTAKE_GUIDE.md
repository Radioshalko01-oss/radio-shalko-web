# DATA-2 — Guía de llenado · Plantilla de intake de productos

**Proyecto:** Radio Shalko WEB (independiente — no SEEDIS)  
**Archivo:** `DATA-2_PRODUCT_INTAKE_TEMPLATE.csv`  
**Base:** DATA-1 (`DATA-1_CATALOG_AUDIT.md`, `DATA-1_PRODUCT_TEMPLATE.md`)

Esta guía es para el **operador de Radio Shalko** (tienda, compras o admin de contenido).  
Completa **solo datos verificados** en piso, ticket, factura o catálogo oficial del fabricante/distribuidor.

---

## Antes de empezar

1. Duplica `DATA-2_PRODUCT_INTAKE_TEMPLATE.csv` con nombre incluyendo fecha, ej. `intake-piloto-2026-06-22.csv`.
2. **Borra la fila `INSTRUCCIONES`** y la fila `EXAMPLE` antes de capturar productos reales.
3. Guarda las fotos en una carpeta local, ej. `intake-images/{real_sku}/`, con los mismos nombres que en `image_*_filename`.
4. No uses SKUs `prod-001`…`prod-039` (mock). Usa el código real de tienda o proveedor.

---

## Columnas — referencia rápida

| Columna | Obligatorio | Valores / formato |
|---------|-------------|-------------------|
| `status` | ✅ | `draft` · `ready` · `published` · nunca `EXAMPLE` en datos reales |
| `real_sku` | ✅ | Código único real; alfanumérico recomendado |
| `product_name` | ✅ | Título en sitio (admin → Título) |
| `brand` | ✅ | Nombre exacto de marca en admin |
| `category` | ✅ | `Instrumentos` · `Accesorios` · `Equipos de Audio` |
| `subcategory` | ✅ | Una de las 13 subcategorías seed (ver tabla abajo) |
| `price_mxn` | ✅ | Entero, sin decimales, pesos mexicanos |
| `is_new` | ✅ | `true` o `false` |
| `is_published` | ✅ | `false` al capturar; `true` solo tras QA en staging |
| `short_description` | Recomendado | 1–2 frases; puede ir en subtítulo o inicio de descripción |
| `commercial_description` | Recomendado | Párrafo PDP (ver § Descripciones) |
| `specs` | Opcional | `Etiqueta:Valor \| Etiqueta2:Valor2` |
| `image_1_filename` | ✅ | Archivo local de foto principal |
| `image_1_alt` | ✅ | Texto accesible descriptivo |
| `image_2_filename` | Opcional | Segunda foto |
| `image_2_alt` | Si hay img 2 | Alt de segunda foto |
| `chalco_internal_stock` | Recomendado | Entero ≥ 0; uso interno admin |
| `amecameca_internal_stock` | Recomendado | Entero ≥ 0; uso interno admin |
| `public_availability_note` | Opcional | Nota interna; el sitio muestra Disponible/Consultar, no cifras |
| `admin_notes` | Opcional | Ej. "Esperar foto proveedor", "Confirmar precio con gerente" |

---

## Subcategorías válidas (copiar exacto)

| Categoría | Subcategorías |
|-----------|---------------|
| Instrumentos | Guitarras acústicas · Guitarras eléctricas · Bajos · Docerolas · Teclados · Violines · Baterías · Ukuleles |
| Accesorios | Amplificadores · Pedales · Cables |
| Equipos de Audio | Mezcladoras · Bafles |

Si el producto no encaja, anótalo en `admin_notes` y define con el equipo antes de cargar.

---

## Por columna — detalle

### `status`

| Valor | Significado |
|-------|-------------|
| `draft` | Datos incompletos; no cargar a admin aún |
| `ready` | Listo para carga manual en admin |
| `published` | Ya cargado y publicado en staging (control) |

Flujo recomendado: `draft` → `ready` → (carga admin) → `published`.

### `real_sku`

- Código **único** en tienda: etiqueta, sistema interno, código proveedor o combinación acordada.
- Sin espacios si es posible; guiones permitidos (`RS-GTR-1234`).
- **Prohibido:** `prod-001`, `prod-002`, etc.
- Verificar en admin → Productos que no exista otro producto con el mismo SKU.

### `product_name`

- Nombre comercial claro: marca + tipo + modelo cuando aplique.
- Evitar MAYÚSCULAS completas y emojis.
- El admin generará el **slug** automáticamente; si choca con un mock, el sistema añade `-2`, `-3`… — preferible slug nuevo y despublicar mock aparte.

### `brand`

- Debe coincidir con una marca en **Admin → Marcas**.
- Si no existe: crear marca primero (nombre, slug, logo opcional).
- Marcas frecuentes Radio Shalko (referencia, no exhaustiva): Yamaha, Fender, Ibanez, Extreme, Century, McCartney, Segovia, Tagima, Behringer, Roland, Epiphone, etc. — usar solo las que **realmente venden**.

### `category` y `subcategory`

- Copiar texto **exacto** de las tablas seed (acentos incluidos).
- La subcategoría debe pertenecer a la categoría elegida.

### `price_mxn`

- Precio de venta al público en MXN, **sin centavos** (ej. `5650`).
- Confirmar con gerencia/ticket; no copiar precios de internet sin verificar.
- Si el precio cambia después, actualizar en admin (no reimportar CSV en DATA-2).

### `is_new`

- `true` solo para lanzamientos o productos recién llegados a tienda.
- `false` para el resto.

### `is_published`

- Mantener `false` en la hoja hasta que el producto esté revisado en staging.
- En admin: dejar **Oculto / borrador** hasta el paso 11 del checklist.

### Descripciones

Sigue la guía de tono en `DATA-1_CATALOG_AUDIT.md` §8.

**`short_description`:** 1–2 frases para contexto rápido.  
**`commercial_description`:** 3–6 frases con estructura:

1. Qué es  
2. Para quién  
3. Beneficio principal  
4. Detalles verificados  
5. Recolección en Chalco o Amecameca  

No inventar especificaciones. No prometer envío a domicilio.

En admin: `short_description` puede ir en **Subtítulo**; `commercial_description` en **Descripción**.

### `specs`

Formato en CSV (una celda):

```text
Cuerpo:Madera caoba | Cuerdas:6 | Escala:25.5"
```

- Separador entre pares: ` | ` (espacio-pipe-espacio).
- Separador label/valor: `:`.
- Solo datos de ficha oficial o etiqueta del producto.
- En admin: agregar cada par como fila en Especificaciones.

### Imágenes

**Nombres de archivo sugeridos:**

```text
{real_sku}-frontal.jpg
{real_sku}-detalle.jpg
{real_sku}-escala.jpg
```

- Formatos: JPG, PNG o WEBP.
- Resolución mínima ~1200 px; ideal 2000+ px.
- Fondo limpio, producto centrado, sin marcas de agua ajenas.
- Subir manualmente en admin (Storage); el CSV solo documenta nombres locales.

**Alt text:** `[Marca] [Modelo o tipo] — vista frontal` (descriptivo, sin keyword stuffing).

### Stock interno

- `chalco_internal_stock` / `amecameca_internal_stock`: cantidades reales contadas en bodega/piso.
- El **sitio público no muestra** estas cifras; solo "Disponible" o "Consultar disponibilidad".
- Si hay 0 en ambas pero hay pedido a proveedor, dejar 0 y anotar en `admin_notes`.

### `public_availability_note`

Campo de referencia para el operador (no se importa automáticamente en DATA-2). Ejemplos:

- `Disponible en ambas tiendas`
- `Solo Chalco`
- `Consultar — bajo pedido`

### `admin_notes`

Cualquier contexto interno: mock a despublicar, slug conflictivo, pendiente foto, etc.

---

## Obligatorios vs opcionales — resumen

| Obligatorio para `ready` | Opcional |
|--------------------------|----------|
| real_sku, product_name, brand, category, subcategory, price_mxn | image_2, specs extra |
| is_new, is_published (=false) | public_availability_note |
| image_1 + alt | admin_notes (útil) |
| commercial_description o short_description (al menos uno) | |

Stock interno: recomendado antes de publicar, no obligatorio en la hoja si aún no se contó.

---

## Flujo operador → admin

1. Llenar fila en CSV con `status=draft`.
2. Revisar con gerencia → cambiar a `ready`.
3. Seguir checklist en `DATA-2_REAL_CATALOG_PILOT_PLAN.md` §7.
4. Actualizar fila a `published` cuando esté live en staging.

---

## Errores frecuentes

| Error | Corrección |
|-------|------------|
| SKU `prod-012` | Usar SKU real de tienda |
| Subcategoría mal escrita | Copiar de tabla exacta |
| Precio con `$` o comas | Solo número entero: `5800` |
| Specs inventadas | Borrar o verificar con ficha |
| Publicar sin foto real | Mantener `is_published=false` |
| Misma imagen para varios SKUs | Una foto por producto real |

---

*DATA-2 · Radio Shalko WEB · No mezclar con SEEDIS*
