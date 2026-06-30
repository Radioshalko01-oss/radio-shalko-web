# PUBLIC-REDESIGN-1B — Header + navegación + megamenús premium

**Proyecto:** Radio Shalko WEB (independiente — sin relación con ningún otro proyecto)
**Fase:** PUBLIC-REDESIGN-1B
**Fecha:** 2026-06-29
**Estado:** Completado · `npm run build` → exit 0

---

## 1. Resumen de cambios

Se rediseñó el header público y los megamenús de Productos y Marcas para que la
navegación se sienta de marca global, editorial y profesional, sin tocar lógica
de negocio, base de datos, Stripe ni admin.

Cambios principales:

1. **Header con dos estados visuales reales:**
   - **Estado A (hero/top):** solo en la home y en el tope de scroll. El header
     es transparente con un degradado sutil sobre la imagen del hero; logo,
     navegación e iconos en blanco para máxima legibilidad.
   - **Estado B (scroll activo / panel abierto):** fondo glass sólido
     (`bg-background/85–95` + blur), borde inferior sutil, sombra mínima, altura
     ligeramente más compacta. Transición suave de 300 ms.
   - **Páginas internas** (`/productos`, `/marcas`, `/contacto`, etc.) **arrancan
     directamente en estado sólido**, porque no tienen hero a sangre completa.
2. **Header desktop refinado:** navegación principal con mejores hover/active
   states, iconos con color adaptado al estado, badges de favoritos/carrito
   rediseñados (anillo, posición y tope `9+`), divisor adaptable.
3. **Megamenú Productos editorial:** 3 familias con subgrupos titulados +
   un rail de acciones a la derecha (CTA "Ver todo el catálogo", "Audio
   profesional", "Asesoría por WhatsApp"). Ya no parece una tabla de texto plano.
4. **Megamenú Marcas editorial:** encabezado "Explorar marcas" + CTA superior +
   columnas alfabéticas con tipografía más limpia (sin chips planos).
5. **Navegación móvil/tablet** conservada y pulida: drawer con acordeones de
   Productos (familias → grupos → chips) y Marcas, links secundarios numerados,
   bloque de cuenta y tarjeta de ayuda por WhatsApp.
6. **Accesibilidad:** `aria-label`/`aria-expanded` en botones de icono y menú,
   cierre de overlays con **Escape**, cierre al navegar, focus states visibles.

---

## 2. Archivos creados

- `PUBLIC-REDESIGN-1B_REPORT.md` (este documento).

No se crearon componentes nuevos: el rediseño se realizó de forma contenida
dentro del componente existente para no sobrefragmentar ni alterar contratos de
props/consumo (el header ya recibe `products`, `account`, `taxonomy`, `brands`).

---

## 3. Archivos modificados

- `src/components/site/header.tsx`
  - Import de `usePathname` (`next/navigation`).
  - Lógica `hasHero` / `transparent` para los dos estados.
  - Clases dinámicas `iconBtn` y `badgeClass` según estado.
  - `<header>` con fondo/borde/sombra y altura adaptativos + `data-state`.
  - Logo con `[&_img]:brightness-0 [&_img]:invert` en estado hero (logo blanco).
  - Navegación desktop con colores/subrayado adaptados al estado.
  - Megamenú Productos (layout editorial 9/3 con rail de CTAs).
  - Megamenú Marcas (encabezado + CTA + columnas alfabéticas refinadas).
  - Handler de `Escape` para cerrar mega panel, cuenta y menú móvil.
  - Limpieza de constantes muertas (`HEADER_ICON`, `MEGA_HEADING`).

No se modificó ningún otro archivo (ni footer, ni layout, ni admin, ni queries).

---

## 4. Cambios en header desktop

- **Navegación:** los 5 enlaces (Productos, Marcas, Servicios, Contacto,
  Garantía) mantienen sus rutas. Tipografía `uppercase tracking-[0.2em]`, peso
  `medium`, subrayado animado en hover y estado activo cuando su megapanel está
  abierto.
- **Iconos** (Buscar, Favoritos, Carrito, Cuenta): mismo set y misma lógica, con
  `iconBtn` que cambia de color según el estado del header (blanco sobre hero,
  neutro sobre panel sólido) y hover sutil.
- **Badges:** rediseñados a `min-w-[18px]`, posición `-right-0.5 -top-0.5`,
  anillo (`ring-background` en sólido, transparente en hero) y tope visual `9+`.
- **Divisor** y **punto de atención de cuenta** adaptados al estado.
- **Sin saturar:** se conservó el espaciado y la jerarquía logo / nav central /
  acciones a la derecha.

---

## 5. Cambios en estado top/scroll

| Aspecto            | Estado A — hero (home, top)                          | Estado B — sólido (scroll / interno) |
|--------------------|------------------------------------------------------|--------------------------------------|
| Fondo              | `bg-gradient-to-b from-black/55 via-black/25 to-transparent` | `bg-background/85–95 backdrop-blur-md` |
| Borde inferior     | transparente                                          | `border-border/70` (sutil)          |
| Sombra             | ninguna                                               | mínima                              |
| Logo / texto / iconos | blanco                                             | colores de marca / neutros          |
| Altura (md)        | `h-24` (más aireada)                                  | `h-20` (más compacta)               |
| Transición         | 300 ms ease-out sobre color/borde/sombra/altura       | misma                               |

- El estado A se activa **solo** cuando `pathname === "/"`, no hay scroll
  (`scrollY <= 24`) y no hay panel/menú abierto.
- Al abrir un megamenú o el menú móvil en la home, el header pasa a sólido para
  que el panel se lea contra un fondo limpio.
- **Sin flicker / sin mismatch de hidratación:** el render del servidor y el
  primer render del cliente coinciden (scroll inicial = 0). Se reutiliza el
  listener de scroll ya existente (solo se amplió su efecto visual).

**Verificación (DOM, en local):**
- Home top → `data-state="hero"`, `background-image: linear-gradient(...)`,
  borde transparente, hamburguesa/iconos `rgb(255,255,255)`, logo
  `filter: brightness(0) invert(1)`.
- `/productos` → `data-state="solid"`, fondo near-white `~0.85` alpha, sin
  gradiente, borde sutil.

---

## 6. Cambios en megamenú productos

- Layout **editorial 12 columnas**: `col-span-9` para las familias + `col-span-3`
  para un rail de acciones.
- **3 familias** (Instrumentos, Accesorios, Audio profesional) renderizadas como
  columnas, cada una con sus **subgrupos titulados** (Cuerda, Teclados,
  Percusión, Viento / Para tu instrumento, Soportes y protección / Audio
  profesional, Iluminación).
- Encabezado de familia con borde inferior + flecha animada que navega a la
  categoría (`/productos?cat=...`).
- Enlaces de hoja con hover refinado; las hojas que **sí existen** en el catálogo
  se ven activas y las "próximamente" se atenúan (sin inventar conteos ni stock).
- **Rail de CTAs** (tarjeta con degradado sutil): "Ver todo el catálogo"
  (primario), "Audio profesional" y "Asesoría por WhatsApp". Copy de
  recolección/asesoría, **sin mencionar envíos**.
- La data sigue saliendo de `PRODUCT_MENU` (taxonomía de navegación) con fallback
  a la taxonomía real del catálogo cuando llega por props.

---

## 7. Cambios en megamenú marcas

- **Encabezado** "Catálogo por fabricante / Explorar marcas" + CTA "Ver todas las
  marcas" en la fila superior (separado por borde).
- **Columnas alfabéticas** (A–D, E–H, I–M, N–S, T–Z) con etiqueta de rango y
  enlaces de marca con tipografía limpia (se eliminó el aspecto de chips/lista
  plana y el `uppercase` forzado que dañaba nombres como "Pioneer DJ").
- Copy **neutral**: no se afirma que las marcas sean "oficiales/verificadas".
- Usa marcas activas reales (`brands` por props) con fallback a `BRANDS`.

---

## 8. Cambios en navegación móvil/tablet

- Header compacto (`h-16`) con logo, iconos esenciales y botón de menú con
  `aria-expanded`.
- Drawer con overlay (`top-16`), scroll interno y blur; se bloquea el scroll del
  body mientras está abierto.
- **Acordeón Productos:** tarjetas por familia → grupos titulados → chips de
  subcategoría (activas vs. próximamente) + CTA "Ver catálogo completo".
- **Acordeón Marcas:** chips de marca + CTA "Ver todas las marcas".
- Enlaces secundarios numerados (03–05), bloque de cuenta (o "Iniciar sesión")
  y tarjeta de ayuda con WhatsApp ("Escribir ahora").
- **Sin overflow horizontal** verificado a 613 px (scrollWidth = innerWidth).

---

## 9. Accesibilidad / interacciones

- `aria-label` en todos los icon buttons (Buscar, Favoritos, Carrito, Cuenta,
  Iniciar sesión, Menú); los de favoritos/carrito incluyen el conteo en el label.
- `aria-expanded` en el botón de menú móvil y en el de cuenta.
- **Escape** cierra megapanel, dropdown de cuenta y menú móvil (los Sheet de
  búsqueda/favoritos/carrito ya gestionan Escape internamente vía Radix).
- Cierre de menús **al navegar** (los handlers `goLeaf`/`goSubcategory`/
  `goCategoryGroup`/`goBrand` y los `onClick` de los enlaces resetean estado).
- **Click fuera** cierra el dropdown de cuenta; `onMouseLeave` con timer cierra el
  megapanel sin parpadeos.
- Focus states conservados (`focus-visible`) en items de mega menú.

---

## 10. Responsive QA

Servidor de desarrollo local (`next dev`). Validaciones realizadas vía DOM/CDP
(el pipeline de screenshots del navegador embebido devolvía frames en caché, por
lo que se priorizó evidencia de DOM, que es fiable):

- **Home (hero):** header transparente, logo/iconos blancos, scrim superior →
  OK (captura visual confirmada).
- **Home (scroll):** estado sólido por el listener de scroll existente (lógica
  reutilizada) → OK.
- **`/productos`:** header inicia sólido (`data-state="solid"`) → OK.
- **Desktop 1280 px:** navegación principal visible (`display:flex`) con los 5
  enlaces → OK.
- **Móvil 375–613 px:** drawer abre/cierra, acordeones presentes, sin overflow
  horizontal → OK.
- **Tablet 768 px:** breakpoint `md` activa nav desktop + megapaneles (mismo
  layout que 1280, con `max-w-7xl` y scroll interno en columnas largas).

Recomendación de validación visual final del usuario en su navegador real a
375 / 768 / 1280 / 1440 px (el rediseño es CSS responsive estándar y no depende
de datos).

---

## 11. Qué NO se tocó

- Lógica de negocio / Sales OS, checkout, carrito, favoritos, cuenta, pedidos.
- Base de datos / Supabase (sin migraciones ni queries nuevas).
- Stripe / webhook.
- Panel admin (tiene su propio layout; este header es exclusivo del sitio
  público).
- Hero (no se rediseñó ni se cambiaron imágenes).
- Catálogo, PDP, footer completo, páginas informativas.
- Rutas existentes (todas se conservan).
- Productos/marcas mock (no se cargaron, borraron ni renombraron).

---

## 12. Mock residual pendiente

- `PRODUCT_MENU` (taxonomía del megamenú) sigue siendo una **estructura de
  navegación** definida en el componente, con fallback a la taxonomía real del
  catálogo (`taxonomy`) cuando se provee. No muestra conteos ni stock.
- `BRANDS` (lista estática) se usa solo como **fallback** del listado de marcas;
  cuando llegan `brands` reales por props, se usan esos.
- **Pendiente futuro:** conectar al 100% la navegación (familias/subcategorías y
  marcas) a Supabase para que el menú refleje exactamente el catálogo real y
  permita ocultar hojas sin productos. Se recomienda hacerlo junto a
  PUBLIC-REDESIGN-2A (catálogo + marcas + filtros), no en esta fase.
- El footer aún contiene enlaces/labels heredados ("Marcas oficiales", "Formas de
  pago", etc.); su revisión corresponde a PUBLIC-REDESIGN-2C (footer).

---

## 13. Riesgos

- **Bajo:** la transparencia del header depende de `pathname === "/"`. Si en el
  futuro otra ruta gana un hero a sangre completa, habrá que añadirla a `hasHero`.
- **Bajo:** el logo en estado hero se aclara con un filtro CSS
  (`brightness(0) invert(1)`); si se cambia el asset del logo por uno ya claro,
  habría que revisar ese filtro.
- **Muy bajo:** si una página interna llegara a renderizar contenido bajo el
  header sin el `pt-28/md:pt-32` correspondiente, podría quedar tapada; las rutas
  actuales ya incluyen ese padding.
- Sin riesgos de datos, pagos ni lógica: cambios estrictamente de presentación.

---

## 14. Recomendación siguiente

Avanzar a **PUBLIC-REDESIGN-1C — Responsive foundation pública** o, si se prefiere
impacto visual inmediato, **PUBLIC-REDESIGN-1D — Sistema de imágenes / hero
strategy** (el hero es lo primero que ve el usuario y hoy usa imágenes que el
usuario considera no definitivas). Tras eso, **2A (catálogo + marcas + filtros)**,
donde además conviene conectar la navegación del header a Supabase para retirar el
mock residual.

---

## 15. Resultado de `npm run build`

```
✓ Compiled successfully
✓ Finished TypeScript
✓ Generating static pages (29/29)
Exit code: 0
```

Build verde. Sin errores de TypeScript ni de lint en el archivo modificado.
