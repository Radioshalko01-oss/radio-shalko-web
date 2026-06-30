# PUBLIC-REDESIGN-1B.3 — Megamenu Rebuild (reconstrucción conceptual)

**Proyecto:** Radio Shalko WEB (independiente)
**Fecha:** 2026-06-30
**Estado:** Completado · `npm run build` → exit 0
**Alcance:** Solo local — sin push ni deploy

---

## Resumen ejecutivo

Se **reconstruyó el concepto** de los megamenús Productos y Marcas desde cero. No fue un polish de padding o tipografía: se replanteó la arquitectura visual en módulos editoriales compactos, con jerarquía clara, curaduría de enlaces y rails laterales integrados. El panel dejó de ser “texto repartido en columnas”.

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/components/site/mega-menus.tsx` | Reescritura completa del layout y componentes internos |
| `src/components/site/header.tsx` | Altura máxima del panel reducida a `420px` |

---

## Cambios de arquitectura visual

### Antes (problema)
- Tres columnas largas con listas del mismo peso visual.
- Scroll interno en familias densas.
- Rail lateral como “tarjeta pegada”.
- Marcas = directorio alfabético plano.
- Panel alto (~640px) con mucho espacio mal resuelto.

### Después (solución)
- **Shell común** (`MegaPanelHeader`): eyebrow + título + subtítulo + CTA alineado a la derecha, separado por línea sutil.
- **Cuerpo en módulo único** (`border + bg-muted/15`): contenido principal agrupado como una sola unidad visual.
- **Grid 9+3**: bloque principal + rail editorial estrecho con `border-l`.
- **Sin scroll interno** en ningún bloque.
- **Altura total reducida** (`max-h-[420px]`).
- **Curaduría de enlaces**: solo hasta 3–4 por subgrupo; prioriza categorías con destino real en catálogo.

---

## Cambios específicos — Productos

1. **Encabezado:** “Explorar productos” + subtítulo “Tres familias principales…” + CTA “Ver catálogo completo”.
2. **Tres módulos horizontales** dentro de un contenedor unificado:
   - `01 Instrumentos` · `02 Accesorios` · `03 Audio profesional`
   - Numeración mono + título en `font-display` (ancla visual).
   - Subgrupos en **grid 2×2** interno (no columna corrida).
3. **Enlaces curados** (`curatedLeaves`): máx. 4 en Instrumentos, 3 en el resto; oculta categorías futuras sin destino real.
4. **Tipografía compacta** (`12px` / `9px` labels) — menos altura, más escaneo.
5. **Rail editorial** (`ProductEditorialRail`): copy breve, 2 CTAs compactos + WhatsApp; sin tarjeta con borde pesado.

---

## Cambios específicos — Marcas

1. **Encabezado:** “Explorar marcas” + subtítulo orientador + CTA superior.
2. **Bloque destacado** (`BrandFeaturedStrip`): fila “Más buscadas” con chips rectangulares (no pills genéricos); solo marcas del listado actual.
3. **Alfabético compacto** (`BrandAlphaGrid`): 5 columnas en una fila, tipografía `11.5px`, espaciado mínimo vertical.
4. **Rail editorial** (`BrandEditorialRail`): contexto + CTA “Ver todas las marcas”.
5. Mismo contenedor modular `bg-muted/15` + rail lateral — coherencia con Productos.

---

## Qué NO se tocó

- Lógica de navegación (`goLeaf`, `goCategoryGroup`, `goBrand`, rutas).
- `PRODUCT_MENU` en `header.tsx` (datos fuente).
- Stripe, Supabase, Sales OS, admin, auth, carrito, checkout.
- Drawer móvil.
- Sin “marcas oficiales”, stock, envíos ni conteos inventados.

---

## Resultado de `npm run build`

```
✓ Compiled successfully
✓ Finished TypeScript
✓ Generating static pages (29/29)
Exit code: 0
```

---

## Pendientes / mejoras futuras

- Alinear drawer móvil con la nueva arquitectura modular.
- Cuando el catálogo real crezca, ajustar `curatedLeaves` o mostrar “Ver más en [familia]” en lugar de ocultar enlaces.
- Imágenes editoriales por familia/marca (fase 1D).
- Conectar taxonomía 100% a Supabase (fase 2A).

---

## Criterio clave

El panel ya no es tres columnas de listas del mismo peso: es un **módulo compuesto** (header + bloque principal + rail) con **anclas visuales** (01/02/03, “Más buscadas”, eyebrow copper) y **menos enlaces visibles** por diseño intencional.
