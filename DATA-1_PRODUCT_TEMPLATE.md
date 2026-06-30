# DATA-1 — Plantilla de producto real (Radio Shalko)

Copia este bloque **por cada producto** que el operador vaya a cargar.  
Completa solo con información **verificada** en tienda o con el fabricante/distribuidor.  
**No inventar** precios, specs ni stock.

---

## Metadatos de captura

| Campo | Valor |
|-------|-------|
| Fecha de captura | |
| Capturado por | |
| Fuente (ticket, factura, catálogo proveedor, piso de tienda) | |
| Revisado por | |
| Listo para publicar | ☐ Sí ☐ No (borrador) |

---

## 1. Identificación

| Campo | Valor | Notas |
|-------|-------|-------|
| **Nombre del producto** | | Título en sitio (`products.title`). Ej: "Guitarra acústica FG800" |
| **Marca** | | Debe existir en admin → Marcas o crearse antes |
| **Categoría** | ☐ Instrumentos ☐ Accesorios ☐ Equipos de Audio | |
| **Subcategoría** | | Una de las 13 subcategorías seed (ej. Guitarras acústicas) |
| **SKU / código interno** | | Código real de Radio Shalko o proveedor (`products.sku`, único) |
| **Slug sugerido** | | Auto desde marca+nombre; revisar en admin antes de publicar |

---

## 2. Precio y promoción

| Campo | Valor | Notas |
|-------|-------|-------|
| **Precio de venta (MXN, sin decimales)** | $ | Campo obligatorio en admin |
| **Precio anterior / oferta** | $ | *Opcional.* No hay columna en BD hoy; anotar aquí para copy futuro o usar `subtitle` temporalmente |
| **¿Marcar como Nuevo?** | ☐ Sí ☐ No | Badge "Nuevo" en sitio (`is_new`) |
| **¿Destacado en home?** | ☐ Sí ☐ No | Hoy home usa `is_new` o precio alto; no hay flag `is_featured` |

---

## 3. Textos comerciales

| Campo | Contenido |
|-------|-----------|
| **Subtítulo** (1 línea, opcional) | |
| **Descripción corta** (1–2 frases para cards/listados) | |
| **Descripción comercial** (párrafo principal PDP) | Ver guía en `DATA-1_CATALOG_AUDIT.md` §8 |

### Estructura sugerida para descripción comercial

1. **Qué es** — tipo de producto y modelo  
2. **Para quién sirve** — principiante, ensayo, escenario, iglesia, estudio…  
3. **Beneficio principal** — por qué elegirlo  
4. **Detalles relevantes** — solo datos confirmados (madera, conectividad, potencia…)  
5. **Recolección** — "Disponible para solicitud en línea; recoge en Chalco o Amecameca tras confirmación."

---

## 4. Especificaciones técnicas

Solo incluir filas **verificadas** (ficha del fabricante, etiqueta, manual).  
En admin: pares label / value (`product_specs`).

| # | Etiqueta (label) | Valor (value) |
|---|------------------|---------------|
| 1 | | |
| 2 | | |
| 3 | | |
| 4 | | |
| 5 | | |

---

## 5. Imágenes

| # | Archivo / URL | Alt text | Uso |
|---|---------------|----------|-----|
| 1 (principal) | | | Obligatoria para publicar con calidad |
| 2 | | | Opcional — ángulo, detalle, escala |
| 3 | | | Opcional |
| 4 | | | Opcional |
| 5 | | | Opcional |
| 6 | | | Máximo 6 en admin |

**Checklist imagen:** fondo limpio · producto centrado · sin logos no autorizados · buena resolución · no pixelada · no IA evidente · proporción consistente (cuadrada o 4:5 recomendado).

**Subida:** Admin → Producto → Galería → Storage bucket `product-images`.

---

## 6. Disponibilidad (interno + mensaje público)

> El sitio **no muestra stock exacto** al cliente. Solo "Disponible" / "Consultar disponibilidad".

### Inventario interno (admin / inventario)

| Sucursal | Cantidad real | Notas |
|----------|---------------|-------|
| Chalco | | Solo números verificados en piso/bodega |
| Amecameca | | |

### Mensaje público sugerido (sin cifras)

| Sucursal | ☐ Disponible ☐ Consultar |
|----------|--------------------------|
| Chalco | |
| Amecameca | |

---

## 7. Publicación

| Campo | Valor |
|-------|-------|
| **Estado** | ☐ Borrador (`is_published = false`) ☐ Publicado |
| **Productos relacionados** (opcional) | Slugs o nombres de 2–4 productos complementarios |
| **Notas internas** | Ej. "Esperar foto del proveedor", "Precio sujeto a tipo de cambio" |

---

## 8. Checklist antes de publicar

- [ ] Marca, categoría y subcategoría correctas  
- [ ] SKU único y real  
- [ ] Precio confirmado con tienda  
- [ ] Al menos 1 imagen real del producto  
- [ ] Descripción revisada (tono Radio Shalko, sin specs inventadas)  
- [ ] Specs solo con datos verificados  
- [ ] Inventario actualizado en admin (aunque el público no vea cifras)  
- [ ] Slug legible y sin duplicados  
- [ ] Probado en staging: `/productos/[slug]`  

---

*Plantilla DATA-1 · Radio Shalko WEB · No mezclar con SEEDIS*
