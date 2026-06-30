# PUBLIC-REDESIGN-1B.3 — Megamenú Productos + Marcas (taxonomía comercial)

## 1. Resumen ejecutivo

Se reconstruyó el megamenú de **Productos** y **Marcas** con jerarquía comercial real: accesorios organizados **por tipo primero** y compatibilidad en panel contextual al hover; instrumentos y audio con subniveles donde aportan claridad; marcas con header editorial, destacadas y lista alfabética compacta. La taxonomía vive en un archivo dedicado para mantenimiento. Sin cambios en BD, Stripe, admin ni checkout.

## 2. Archivos modificados / creados

| Archivo | Acción |
|---------|--------|
| `src/lib/navigation/catalog-taxonomy.ts` | **Creado** — taxonomía, hrefs, marcas destacadas |
| `src/components/site/mega-menus.tsx` | **Reescrito** — UI Productos, Marcas, mobile |
| `src/components/site/header.tsx` | **Actualizado** — navegación, props, mobile drawer |
| `PUBLIC-REDESIGN-1B.3_MEGAMENU_TAXONOMY_REBUILD_REPORT.md` | **Creado** — este reporte |

## 3. Nueva estructura de Productos

Panel con:
- **Header:** Navegación / Explorar productos / CTA “Ver catálogo completo”
- **Tres bloques:** Instrumentos · Accesorios · Equipos de audio
- **Rail lateral:** “¿Buscas algo específico?” + Ver catálogo + Asesoría WhatsApp

## 4. Accesorios por tipo + compatibilidad

Tipos principales: Cuerdas, Fundas y estuches, Cables, Pedales de efectos, Pedal de sustain, Amplificadores, Afinadores, Capotrastes, Pastillas de amplificación, Audífonos, Interfaces, Pedestales de micrófono, Bases de teclado, Atriles de partituras.

Al hover sobre un tipo con compatibilidades:
- Panel contextual a la derecha
- Título del tipo + “Elige el uso o instrumento”
- Lista de compatibilidades
- CTA “Ver todos” (navega al tipo completo)

Clic en tipo → `/productos?cat=Accesorios&tipo=...`  
Clic en compatibilidad → `...&instrumento=...`

## 5. Audio profesional

Bafles, Bocinas (10/12/15/18″), Subwoofers, Mezcladoras, Micrófonos, Interfaces, Amplificadores de potencia, Crossover, Switcheras, Iluminación y DMX (subtipos), Cables de audio (XLR, TRS, etc.). Subniveles en panel contextual al hover.

## 6. Instrumentos

Guitarras acústicas/eléctricas, Bajos (flyout eléctricos/acústicos), Docerolas, Violines, Ukuleles, Teclados, Baterías y percusión (flyout), Mandolinas, Instrumentos de viento (flyout), Acordeones.

## 7. Marcas

- Header: Catálogo por fabricante / Explorar marcas
- Destacadas: Fender, Yamaha, Roland, Pearl, Behringer, Gibson, Taylor, Ibanez, JBL (solo si existen en catálogo)
- Lista A–D … T–Z compacta, hover con subrayado suave
- Clic → `/marcas?b=...` (ruta existente, sin romper)

## 8. Decisiones de diseño visual

- Layout horizontal editorial (no caja dashboard)
- Tipografía 13.5px enlaces, títulos de familia en mayúsculas con borde inferior
- Enlaces activos (sub real en BD) en foreground; futuros en muted
- Panel contextual integrado con borde lateral, sin popover flotante
- Sin scroll interno forzado; `max-h-[560px]` en panel

## 9. Interacción

- Hover abre panel contextual (accesorios, instrumentos agrupados, audio)
- Clic en familia → `?cat=`
- Clic en ítem con `sub` real → `?sub=` (filtro activo)
- Clic en ítem con solo `href` semántico → query params futuros
- Escape, cierre al navegar y mouse leave conservados del header
- Mobile: jerarquía anidada por familia → tipo → compatibilidad

## 10. Responsive

- **Desktop:** foco principal; rail CTA visible desde `lg`
- **Tablet:** columnas flex con flyout; grid marcas 3→5 cols
- **Mobile:** drawer con `MobileCatalogFamily` y sublistas indentadas

## 11. Qué NO se tocó

Stripe, Supabase, migraciones, RLS, admin, checkout, carrito, pedidos, Sales OS, productos mock, `.env`, lógica de pagos.

## 12. Resultado `npm run build`

```
✓ Compiled successfully
✓ Generating static pages (29/29)
Exit code: 0
```

## 13. Pendientes futuros

1. **Filtros `tipo` e `instrumento`** en `/productos` — hoy los params se envían pero la página solo filtra `cat`, `sub`, `brand`, `q`.
2. Poblar subcategorías en Supabase para ítems hoy “futuros” (micrófonos, interfaces, tipos de accesorio, etc.).
3. Slugs de marca en `/productos?marca=` si se unifica con marcas en el futuro.
4. Ajuste fino de espaciado entre columnas si el usuario quiere recuperar posiciones exactas del layout anterior.

### Patrón de URLs

| Caso | Patrón actual implementado |
|------|---------------------------|
| Instrumento con sub real | `/productos?cat=Instrumentos&sub=Guitarras+acústicas` |
| Categoría | `/productos?cat=Accesorios` |
| Accesorio tipo | `/productos?cat=Accesorios&tipo=cuerdas` |
| Accesorio + uso | `/productos?cat=Accesorios&tipo=cuerdas&instrumento=violin` |
| Marca | `/marcas?b=Ibanez` (existente) |
