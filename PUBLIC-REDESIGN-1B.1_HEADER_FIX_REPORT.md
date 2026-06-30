# PUBLIC-REDESIGN-1B.1 — Corrección fina del header público

**Proyecto:** Radio Shalko WEB (independiente)
**Fecha:** 2026-06-30
**Estado:** Completado · `npm run build` → exit 0

---

## 1. Problemas corregidos

| # | Problema reportado | Corrección |
|---|-------------------|------------|
| 1 | Isotipo invisible / cuadro blanco en estado hero | Se eliminó el filtro global sobre el logo; el isotipo conserva su arte original |
| 2 | Línea divisoria dura entre header y pantalla | Borde inferior eliminado en ambos estados (`border-transparent`) |
| 3 | Transición poco profesional | Duración unificada a 250 ms, solo propiedades necesarias; sin cambio de altura |
| 4 | Header glass/transparente al hacer scroll | Fondo 100 % sólido (`bg-background`), sin blur ni opacidad |

---

## 2. Qué causaba que el isotipo no se viera

En PUBLIC-REDESIGN-1B se aplicó al contenedor del logo:

```css
[&_img]:brightness-0 [&_img]:invert
```

Eso afectaba **ambas** imágenes del lockup (isotipo + wordmark).

El archivo `public/brand/icon.svg` tiene esta estructura:

- Rectángulo negro redondeado (`fill:#000000`) como fondo del isotipo
- Símbolo blanco (`fill:#ffffff`) encima

Al aplicar `brightness(0) invert(1)` a todo el SVG:

1. Todo se vuelve negro (`brightness-0`)
2. Todo se invierte a blanco (`invert`)

Resultado: un **bloque blanco sólido** sin símbolo visible. Al hacer scroll, al quitar el filtro, el isotipo volvía a verse con su fondo negro y símbolo blanco.

El wordmark (`wordmark.svg`) sí es texto negro sobre fondo transparente, por lo que invertirlo solo a él es correcto para el hero.

---

## 3. Cómo quedó el estado hero

- Header con degradado superior muy suave (`from-black/45 via-black/15 to-transparent`), sin borde visible.
- **Isotipo:** se muestra tal cual (fondo negro + símbolo blanco del SVG original).
- **Wordmark:** recibe `brightness-0 invert` solo en esa imagen, vía prop `tone="on-dark"` en `SiteLogo`.
- Nav e iconos siguen en blanco sobre el hero.
- Altura fija `h-16 md:h-20` (sin salto al activarse).

---

## 4. Cómo quedó el estado scroll / sólido

- Fondo **opaco**: `bg-background` (token del sitio, sin `/95` ni `/85`).
- **Sin** `backdrop-blur`, **sin** glassmorphism, **sin** transparencia.
- Separación del contenido con sombra mínima: `shadow-[0_1px_0_0_rgba(0,0,0,0.06)]`.
- Borde inferior: `border-transparent` (sin línea).
- Logo en `tone="default"` (colores de marca normales).
- Páginas internas arrancan directamente en este estado.

---

## 5. Qué se quitó de la línea / división

**Antes (sólido):** `border-b border-border/70` — línea gris perceptible.

**Ahora:** `border-b border-transparent` en ambos estados. La separación en scroll se logra solo con el fondo sólido y una sombra de 1 px muy suave, no con un trazo visible.

---

## 6. Qué se cambió de la transparencia / glass

**Eliminado del estado sólido:**

- `bg-background/95`
- `supports-[backdrop-filter]:bg-background/85`
- `backdrop-blur-md`
- `transition` sobre `backdrop-filter`

**Reemplazado por:** `bg-background` completamente opaco.

---

## 7. Transición refinada

- Duración: **250 ms** (`duration-[250ms]`).
- Curva: `ease-out`.
- Propiedades animadas: `background-color`, `box-shadow`, `border-color`, `color` (iconos/nav).
- **Eliminado:** cambio de altura `h-16 md:h-24` → `h-16 md:h-20` que podía sentirse como salto.
- **Eliminado:** transición de `filter` en el enlace del logo.

---

## 8. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/components/site/header.tsx` | Estados hero/sólido, logo sin filtro global, panel sólido sin glass, transición y bordes |
| `src/components/brand/site-logo.tsx` | Nueva prop `tone: "default" \| "on-dark"`; inversión solo en wordmark |

---

## 9. Qué NO se tocó

- Hero, megamenús (estructura), catálogo, PDP, footer.
- Admin, Stripe, Supabase, base de datos, Sales OS.
- Rutas, lógica de búsqueda, carrito, favoritos, cuenta.
- Mock de navegación / marcas.

---

## 10. Verificación funcional

- Megamenús Productos y Marcas: sin cambios de lógica; el header sólido al abrirlos sigue siendo opaco.
- Mobile drawer: sin cambios estructurales; al abrir, `headerSolid` activa estado sólido.
- Iconos, badges y `Escape`: conservados de 1B.

---

## 11. Resultado de `npm run build`

```
✓ Compiled successfully
✓ Finished TypeScript
✓ Generating static pages (29/29)
Exit code: 0
```

---

## Criterios de aceptación

| Criterio | Estado |
|----------|--------|
| Isotipo visible en home desde el inicio | ✓ |
| Sin cuadro blanco en el logo | ✓ |
| Línea divisoria fuerte eliminada | ✓ |
| Scroll → header sólido, no transparente | ✓ |
| Transición más sobria | ✓ |
| Páginas internas sólidas al inicio | ✓ |
| Megamenús / mobile / admin / BD / Stripe intactos | ✓ |
| Build verde | ✓ |
