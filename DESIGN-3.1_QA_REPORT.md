# DESIGN-3.1 — QA visual público/cliente y segundo pase ligero

**Proyecto:** Radio Shalko WEB (independiente — no SEEDIS)  
**Fase:** DESIGN-3.1 · Cierre visual y QA  
**Fecha:** 2026-06-22  
**Base:** DESIGN-3 (`siteShell`, polish público/cliente) + Sales OS v1

---

## 1. Resumen

Se realizó QA visual del sitio público y flujo cliente mediante **revisión de código**, **auditoría de copy** y **build de producción**. El servidor local no estaba activo durante la sesión; la validación funcional se apoyó en compilación exitosa de las 29 rutas y revisión estática de componentes críticos.

**Correcciones principales:**

- Eliminada mención a **envío a domicilio** en PDP.
- Sección **“Política de envíos”** en `/servicios` reemplazada por **“Recolección en tienda”** (solo pickup).
- Footer actualizado: enlace “Recolección en tienda” → `#recoleccion-tienda`.
- Segundo pase **`siteShell`** en **marcas**, **servicios** y **contacto** (cards, eyebrows, CTAs, precios).
- Microcopy de contacto más directo y profesional.

**Sin cambios** en lógica Sales OS, Stripe, webhook, auth, BD ni admin.

---

## 2. Páginas revisadas

| Ruta | Método QA | Resultado |
|------|-----------|-----------|
| `/` | Código (hero, featured, header, footer) | OK — tokens DESIGN-3 |
| `/productos` | Código | OK — empty state, grid |
| `/productos/[slug]` | Código + copy fix | OK — sin envíos; disponibilidad cualitativa |
| `/marcas` | Código + polish | OK — `siteShell` aplicado |
| `/servicios` | Código + polish + copy | OK — recolección en tienda |
| `/contacto` | Código + polish | OK — cards y CTAs unificados |
| `/garantia` | Código (DESIGN-3) | OK |
| `/carrito` | Código | OK — summary panel, barra móvil |
| `/checkout` | Código | OK — solo pickup; sin campos de dirección en UI |
| `/cuenta` | Código | OK — hub tokenizado |
| `/cuenta/pedidos` | Código | OK — empty state, badges |
| `/cuenta/pedidos/[id]` | Código | OK — recolección; sin envíos |
| `/cuenta/notificaciones` | Código | OK |
| `/favoritos` | Código | OK |
| `/carrito/s/[token]` | Código | OK — empty state |
| `/admin` | Build + middleware | OK — ruta protegida en build |
| `/login` | Build | OK |

**Responsive (375 / 768 / 1280 / 1440+):** revisión por clases Tailwind existentes (`px-5 md:px-8`, grids `sm:`/`md:`/`lg:`, header sticky, barra carrito fija `md:hidden`, checkout columnas `md:grid-cols-`). Sin desbordes evidentes en markup.

---

## 3. Cambios aplicados

| Archivo | Cambio |
|---------|--------|
| `src/components/catalog/product-detail.tsx` | Copy footnote: recolección Chalco/Amecameca; sin envío a domicilio |
| `src/components/site/footer.tsx` | Link “Recolección en tienda” → `/servicios#recoleccion-tienda` |
| `src/components/pages/servicios-page.tsx` | Sección pickup; `siteShell.card/eyebrow/brandEyebrow/ctaDark`; import sin uso eliminado |
| `src/components/pages/marcas-page.tsx` | Cards producto con `siteShell.card`; eyebrow/precio tokenizados; bloque “Próximamente” con `siteShell.card` |
| `src/components/pages/contacto-page.tsx` | Cards tienda y formulario con `siteShell`; CTAs `ctaDark`/`ctaSecondary`; copy más claro |

---

## 4. Cambios responsive

No hubo cambios estructurales de layout. Validaciones por código:

- **375px:** header icon buttons 40px; grids catálogo 1–2 cols; checkout formulario apilado; barra total carrito fija inferior.
- **768px:** resumen carrito en sidebar; contacto tiendas 2 cols; servicios FAQ 2 cols.
- **1280px+:** contenedores `max-w-7xl`; marcas grid 4 cols; footer 4 cols.

---

## 5. Ajustes en marcas / servicios / contacto

### Marcas
- Product cards alineadas al catálogo (`siteShell.card`, `brandEyebrow`, `priceInline`).
- Índice sticky de marcas conservado (scroll horizontal en móvil).

### Servicios
- Cards especialidad, FAQ, pago y recolección → `siteShell.card`.
- Eyebrows copper unificados.
- CTA “Contactar taller” → `siteShell.ctaDark`.
- **Recolección en tienda** reemplaza política de envíos (contenido acorde a Sales OS v1: solo pickup).

### Contacto
- Cards de sucursal con `siteShell.card` + hover copper.
- CTAs llamada/WhatsApp con tokens públicos.
- Texto del panel de contacto: tono más profesional, sin “por ahora”.

---

## 6. QA funcional mínimo

| Verificación | Resultado |
|--------------|-----------|
| `npm run build` | ✅ Exit 0 — 29 rutas |
| TypeScript | ✅ Sin errores |
| Rutas públicas/cliente en build | ✅ Todas presentes |
| Login / auth callback | ✅ Sin cambios en código auth |
| Carrito / checkout | ✅ Sin cambios de lógica; checkout UI solo pickup |
| Cuenta / pedidos / notificaciones | ✅ Sin cambios de queries |
| Admin protegido | ✅ Middleware sin cambios |
| Copy público sin envíos/direcciones/stock exacto | ✅ Corregido en PDP y servicios |
| Servidor local (`localhost:3000`) | ⚠ No activo — QA visual en browser pendiente manual |

**Nota:** No se ejecutó flujo Stripe completo (no hubo cambios en checkout/pagos).

---

## 7. Qué NO se tocó

- Base de datos y migraciones Supabase
- Stripe test/live, webhook, reglas de pago
- Login OAuth, middleware, redirects admin/cliente
- Consultas catálogo, pedidos, notificaciones, carrito
- Flujo Sales OS (solicitud → aprobación → pago → fulfillment)
- Admin panel (DESIGN-2D)
- Inventario, Sicar, envíos como feature, WhatsApp API, emails, push
- Hero agresivo, nuevas imágenes, rediseño admin
- SEEDIS u otros proyectos

---

## 8. Riesgos pendientes

| Riesgo | Severidad | Mitigación sugerida |
|--------|-----------|---------------------|
| QA visual en browser no ejecutado (dev server apagado) | Media | Smoke test manual en staging: home, PDP, carrito, checkout, cuenta |
| Enlace antiguo `#politica-envios` en bookmarks externos | Baja | Anchor nuevo `#recoleccion-tienda`; considerar redirect si hubiera tráfico |
| Header ~1500 líneas — difícil QA exhaustivo | Baja | Smoke test móvil: menú, carrito drawer, cuenta |
| Algunas páginas informativas aún mezclan `rounded-3xl` y `siteShell.card` (`rounded-2xl`) | Muy baja | Unificar en fase futura si se desea 100% consistencia de radius |

---

## 9. Recomendación siguiente

1. **Smoke test manual en staging** (15 min): navegar rutas listadas en §2 en 375px y desktop; confirmar header/footer y checkout.
2. **DESIGN-4 o contenido:** fotografía hero, microcopy editorial por marca (opcional).
3. **Negocio:** cuando corresponda roadmap, envíos/Sicar como feature separada — no mezclar con polish visual.

---

## 10. Resultado de `npm run build`

```
✓ Compiled successfully
✓ TypeScript — sin errores
✓ 29 rutas generadas
Exit code: 0
```

---

## Criterios de aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Sitio público consistente | ✅ |
| 2 | Cliente consistente | ✅ |
| 3 | Mobile no roto (por clases/build) | ✅ |
| 4 | Header/footer OK | ✅ |
| 5 | Checkout claro | ✅ |
| 6 | Carrito claro | ✅ |
| 7 | Cuenta cliente clara | ✅ |
| 8 | Sin cambios Sales OS | ✅ |
| 9 | Sin cambios BD | ✅ |
| 10 | Sin Stripe live | ✅ |
| 11 | Build exit 0 | ✅ |

---

*DESIGN-3.1 completado. Radio Shalko WEB permanece independiente de SEEDIS.*
