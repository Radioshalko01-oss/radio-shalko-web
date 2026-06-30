# DESIGN-2B — Admin shell visual polish

**Proyecto:** Radio Shalko WEB (independiente — no SEEDIS)  
**Fase:** DESIGN-2B · Polish visual del panel admin  
**Fecha:** 2026-06-22  
**Base:** `DESIGN-1_AUDIT_RADIO_SHALKO.md`, `DESIGN-2A_REPORT.md`  
**Sales OS v1:** sin cambios de lógica de negocio

---

## 1. Resumen de cambios

Se pulió el **admin shell** para conectarlo visualmente con Radio Shalko (tokens OKLCH, copper, Fraunces en títulos) sin tocar flujos Sales OS.

- **Sidebar** con acento copper en ítem activo, badges copper en pedidos pendientes, badge “Pronto” unificado.
- **Layout admin** con fondo cálido semántico y padding consistente.
- **Dashboard** con cards interactivas, `AdminButton`, alerta copper.
- **Sistema de badges admin** centralizado (`admin-badges.ts` + `AdminStatusBadge`).
- **`AdminButton`** con variantes primary / accent / secondary / ghost / danger.
- **`adminShell`** — clases reutilizables para cards, inputs, filtros, stats.
- **Pedidos, detalle pedido, listas principales** — menos zinc genérico, más tokens.
- **Badges de pedido** — colores sobrios con borde suave (pending ámbar suave, approved copper, paid/ready emerald).

No se modificó lógica de disponibilidad, pago Stripe, webhook, fulfillment ni auth.

---

## 2. Archivos creados

| Archivo | Propósito |
|---------|-----------|
| `src/lib/design/admin-shell.ts` | Clases shell admin (cards, inputs, filtros, stats) |
| `src/lib/design/admin-badges.ts` | Estilos y helpers de badges admin/pedido |
| `src/components/admin/admin-status-badge.tsx` | Componente `AdminStatusBadge` / `AdminOrderStatusBadge` |
| `src/components/admin/admin-button.tsx` | Botón admin con variantes |

---

## 3. Archivos modificados

### Shell y tokens
- `src/app/admin/layout.tsx`
- `src/components/layout/admin-sidebar.tsx`
- `src/lib/design/tokens.ts` — tokens admin semánticos
- `src/components/ui/page-header.tsx` — variante admin usa tokens semánticos
- `src/lib/orders/status-labels.ts` — badges delegados a `admin-badges.ts`

### Dashboard y alertas
- `src/app/admin/page.tsx`
- `src/components/admin/admin-pending-orders-alert.tsx`
- `src/components/admin/orders-summary-cards.tsx`

### Pedidos
- `src/components/admin/orders-manager.tsx`
- `src/components/admin/order-detail-view.tsx`
- `src/components/admin/order-detail-actions.tsx`
- `src/components/admin/order-availability-review.tsx`
- `src/components/admin/order-payment-section.tsx`
- `src/components/admin/order-fulfillment-section.tsx`

### Listas CRUD (shell, no formularios profundos)
- `src/components/admin/products-manager.tsx` — toolbar + badges publicado
- `src/components/admin/categories-manager.tsx` — `StatusPill` unificado
- `src/components/admin/brands-manager.tsx` — toolbar, cards, badges activo

---

## 4. Cambios en sidebar admin

| Antes | Después |
|-------|---------|
| `bg-zinc-50/80`, bordes zinc | `bg-card/40`, `border-border/80`, backdrop sutil |
| Activo: blanco + ring zinc | Activo: card + ring border, **icono copper** |
| Badge pedidos: `bg-zinc-900` | Badge pedidos: **`bg-copper`** |
| “Pronto”: pill zinc genérico | `AdminStatusBadge tone="soon"` |
| Labels grupo: zinc-400 | `typography.eyebrow` |
| Volver al sitio: zinc hover | `adminShell.backLink` + hover card |

Rutas y opciones de navegación **sin cambios**.

---

## 5. Cambios en layout admin

- Fondo: `bg-background` (OKLCH cálido del sitio).
- Main: `px-6 py-7 md:px-8 md:py-8` — ritmo más consistente que `p-8` plano.
- `requireAdmin()` y estructura sidebar + contenido **intactos**.

---

## 6. Cambios en dashboard

- Stats cards: `adminShell.cardInteractive`, iconos hover copper.
- Accesos rápidos: cards con hover sutil; pedidos pendientes resaltados con borde copper.
- CTA “Nuevo producto”: `AdminButton` primary.
- Métricas: `statValue` / `statLabel` tokens (sin `text-3xl`).

---

## 7. Cambios en badges

### Centralización (`admin-badges.ts`)

| Tone | Uso visual |
|------|------------|
| `pending` | Ámbar suave, borde tenue |
| `approved` | Copper / acento marca |
| `paid`, `ready`, `delivered`, `active` | Emerald sobrio |
| `cancelled`, `inactive`, `neutral` | Muted, no agresivo |
| `soon` | Caps pequeño, borde suave |
| `danger` | Rojo suave |

### Aplicado en
- Pedidos lista y detalle (`orderStatusBadgeClass` → `admin-badges`)
- Productos: Publicado / Oculto
- Categorías: Activa / Oculta
- Marcas: Activa / Oculta
- Sidebar: Pronto

**Valores de status de negocio sin cambios** — solo CSS.

---

## 8. Cambios en botones

### `AdminButton` variantes
- `primary` — foreground (negro marca)
- `accent` — copper (alertas, acciones destacadas)
- `secondary` — borde + card
- `ghost` — acciones terciarias
- `danger` / `dangerSolid` — acciones destructivas

### Aplicado en
- Dashboard, alerta pedidos pendientes
- Orders manager (“Ver detalle”)
- Order detail actions (copiar, WhatsApp)
- Availability review (confirmar / no disponible)
- Payment section (generar enlace, copiar, WhatsApp)
- Fulfillment section (preparar, listo, entregar)
- Products toolbar (“Nuevo producto”)
- Brands toolbar (“Nueva marca”)

Formularios CRUD profundos y modales masivos **no reemplazados** (DESIGN-2C).

---

## 9. Pantallas admin revisadas

| Ruta | Nivel de polish |
|------|-----------------|
| `/admin` | Dashboard completo |
| `/admin/pedidos` | Summary cards + lista + filtros |
| `/admin/pedidos/[id]` | Detalle shell + secciones Sales OS |
| `/admin/productos` | Toolbar + badges lista |
| `/admin/categorias` | Badges activo/oculto |
| `/admin/marcas` | Toolbar + lista + badges |
| Layout global | Sidebar + main + alerta pendientes |

**Parcial / pendiente DESIGN-2C:**
- `/admin/inventario`
- `/admin/productos/nuevo`, `/editar`
- `/admin/cotizaciones`, `/admin/vendedor`
- Modales y tablas densas en CRUD

---

## 10. Qué NO se tocó

- Sitio público, hero, header, checkout, carrito cliente
- Lógica Sales OS (disponibilidad, Stripe checkout, webhook, fulfillment)
- Base de datos / migraciones
- Stripe live
- Auth / `requireAdmin` / middleware
- Inventario automático, Sicar, envíos
- Formularios profundos de producto/categoría (campos internos siguen con algo de zinc)

---

## 11. Riesgos pendientes

| Riesgo | Mitigación DESIGN-2C |
|--------|----------------------|
| CRUD aún mezcla zinc en modales/tablas | Migrar inputs y tablas a `adminShell` |
| Admin mobile sin drawer sidebar | Evaluar nav colapsable |
| POS vendedor (`seller-pos`) muy denso | Fase aparte o 2C extendido |
| Algunos botones inline sin `AdminButton` | Sustitución gradual en formularios |

---

## 12. Recomendación para DESIGN-2C

1. **CRUD polish** — products-manager tabla, categories-manager árbol, inventory-manager.
2. **Formularios** — inputs/labels unificados vía `adminShell.input` + `typography.label`.
3. **Modales admin** — overlay y card con tokens (reemplazar `bg-zinc-900/40` modal).
4. **SectionLabel** — componente para labels caps en formularios.
5. **Admin mobile** — sidebar responsive o top nav.
6. **Quotes / vendedor** — aplicar shell donde el equipo opera diariamente.

---

## 13. Resultado de `npm run build`

```
✓ Compiled successfully
✓ TypeScript OK
✓ 29 rutas
Exit code: 0
```

---

*DESIGN-2B · Radio Shalko WEB · Admin shell polish · Siguiente: DESIGN-2C CRUD polish*
