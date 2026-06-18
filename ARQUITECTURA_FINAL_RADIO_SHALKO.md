# Arquitectura final — Radio Shalko Web

**Documento:** auditoría estratégica y técnica de producto  
**Versión:** 1.0  
**Fecha:** junio 2026  
**Estado del producto:** catálogo visual avanzado + backend preparado + ecommerce inexistente  
**Modelo objetivo:** híbrido (tienda online + cotización + asesoría WhatsApp + tiendas físicas)  
**Referencias activas:** `prd-v2.md` (PRD oficial) · `README.md`

---

## Resumen ejecutivo

Radio Shalko Web es hoy una **aplicación Next.js con UI de catálogo premium (~75 %)** montada sobre **datos mock locales** y **Supabase desconectado del frontend**. No existe PDP, carrito, checkout, pedidos, envíos ni inventario operativo.

El negocio ha evolucionado de “catálogo + WhatsApp” a un **modelo híbrido** que debe soportar compra en línea, cotización, favoritos, envíos y asesoría humana — sin perder las dos sucursales físicas como ventaja diferencial.

**Brecha principal:** la arquitectura visual está adelantada a la arquitectura de comercio. El siguiente ciclo debe construir **capa de producto real + transacción**, no más superficie de marketing.

**Progreso estimado hacia Radio Shalko 1.0:**

| Capa | Avance |
|------|--------|
| UI pública (home, catálogo, marcas, servicios) | ~75 % |
| Confianza operativa (datos, formularios) | ~20 % |
| Catálogo conectado a DB | ~5 % |
| PDP | 0 % |
| Cotización persistente / carrito | ~15 % (solo localStorage) |
| Auth + roles + admin CRUD | ~10 % |
| Checkout + pagos + envíos + pedidos | 0 % |

---

## 1. Diagnóstico actual

### 1.1 Qué está bien (conservar)

| Área | Detalle |
|------|---------|
| **Stack** | Next.js 16 App Router, React 19, TypeScript, Tailwind v4 — base sólida y escalable |
| **Estructura de rutas** | `(site)` público + `/admin` + `/auth/callback` — separación clara |
| **Home y descubrimiento** | Hero, marcas, destacados, bento categorías — ritmo editorial acordado |
| **Catálogo UI** | Filtros, búsqueda por URL, toolbar, vistas grid/lista — por encima del promedio |
| **Mega menú** | Productos por familia + marcas A–Z — patrón dealer serio |
| **Páginas de confianza** | Servicios, garantía, contacto, footer oscuro — alineadas al negocio real |
| **Supabase infra** | Cliente browser/server/admin, middleware sesión, migraciones iniciales, RLS catálogo, Storage buckets |
| **Hooks locales** | `useFavorites`, `useQuote` — patrón claro para migrar a DB |
| **PRD V2** | Visión híbrida documentada; reemplaza planificación V1 obsoleta |
| **Assets** | Carpeta `catalogo/` por slug; logos de marcas; hero 4K |

### 1.2 Qué está mal (corregir con prioridad)

| Área | Problema | Impacto |
|------|----------|---------|
| **Fuente de datos** | 100 % `src/lib/products.ts` mock; app no consulta Supabase | Catálogo no es negocio real |
| **PDP ausente** | No existe `/productos/[slug]`; cards no enlazan a producto | Flujo central roto |
| **Doble modelo sin arquitectura** | Cotización (localStorage) vs carrito (inexistente) vs PRD V2 | Confusión UX y deuda |
| **Confianza** | Contactos inconsistentes; formularios/newsletter simulan éxito | Daño reputacional |
| **Header público** | “Mi cuenta” → `/admin`; colisión nav/iconos desktop | UX y seguridad percibida |
| **Middleware admin** | Solo exige login; **no verifica rol `admin`** | Cualquier usuario autenticado podría entrar |
| **Token `--copper`** | Igual a `--foreground` (negro) | Identidad visual mentirosa |
| **Product cards** | 6 implementaciones duplicadas; ninguna apunta a PDP | Deuda multiplicada en cada feature |
| **Imágenes producto** | Repetidas por subcategoría; galería hover con stock fake | Credibilidad de tienda |
| **Documentación paralela** | `ROADMAP.md`, `ESTADO_PROYECTO.md`, `prd.md` V1 pueden contradecir V2 | Decisiones divergentes |
| **Admin** | Placeholders sin CRUD | Operación depende de dev |

### 1.3 Qué está incompleto

| Componente | Estado |
|------------|--------|
| `/productos/[slug]` (PDP) | No existe |
| `/carrito`, `/checkout`, `/cuenta` | No existen |
| Auth UI (login/logout) | Callback existe; sin UI |
| Favoritos en DB | Tabla `favorites` en schema; app usa localStorage |
| Cotización persistente | Solo localStorage |
| Admin CRUD | Rutas shell sin lógica |
| Schema ecommerce | Faltan: stock, subcategorías, carts, orders, payments, shipments, addresses |
| SEO por producto | Sin metadata dinámica |
| Paginación catálogo | 39 OK; ~300 reales necesitarán paginación |
| Integración pagos/envíos | No iniciada |
| `ProductCard` unificado | No existe |
| `site-contact.ts` (fuente única) | No existe |

### 1.4 Qué debe eliminarse o dejar de usar

| Elemento | Motivo |
|----------|--------|
| **Dependencia operativa de `lib/products.ts`** | Sustituir por queries Supabase + capa de dominio |
| **Formularios que simulan envío** | Hasta tener backend real |
| **Newsletter fake en footer** | Hasta CRM/email real |
| **Enlace público admin en header** | Separar cliente de operador |
| **Segunda imagen hover genérica (`GALLERY_ALT`)** | Refuerza percepción mock |
| **`prd.md` V1 como guía activa** | Solo histórico; V2 manda |
| **Docs ROADMAP/ESTADO desactualizados** | Actualizar o archivar tras este documento |
| **Framer Motion** (si sigue sin uso) | Bundle muerto |
| **Tipos manuales `database.ts`** | Reemplazar por tipos generados cuando DB esté estable |

**No eliminar aún:** ruta `/cotizacion` — evoluciona hacia carrito/cotización híbrida.

---

## 2. Modelo de negocio detectado

### 2.1 Naturaleza híbrida

Radio Shalko opera en cuatro modos simultáneos:

| Modo | Audiencia típica | Canal |
|------|------------------|-------|
| **Compra online** | Usuario decidido, producto en stock | Carrito → checkout → pago → envío |
| **Cotización** | Escuelas, iglesias, sonideros, pedidos multi-SKU | Lista cotización → WhatsApp / contacto |
| **Asesoría** | Principiantes, duda técnica | WhatsApp desde PDP |
| **Tienda física** | Quien quiere probar instrumento | Chalco / Amecameca |

**Regla:** la **PDP** es el hub; desde ahí el usuario elige comprar, cotizar o consultar.

### 2.2 Flujo ideal end-to-end

```
DESCUBRIMIENTO
  Home · Búsqueda · Marcas · Categorías · Destacados
       ↓
CATEGORÍA / LISTADO
  /productos · filtros · marca · precio
       ↓
PRODUCTO (PDP)  ← página más importante
  Galería · precio · stock por sucursal · specs
       ↓
    ┌──────────┬──────────────┬─────────────────┐
    ↓          ↓              ↓                 ↓
 COMPRAR    COTIZAR      WHATSAPP          VISITAR TIENDA
 carrito    lista         asesoría          mapa / apartado
    ↓          ↓              ↓
 CHECKOUT   enviar lista   conversión humana
 pago       a asesor
    ↓
 ENVÍO / RECOGIDA EN TIENDA
    ↓
 POSTVENTA
 pedidos · garantía · servicio técnico · reordenar
```

### 2.3 Entidades de dominio (conceptual)

```
Product ──┬── ProductImage[]
          ├── Brand
          ├── Category / Subcategory
          ├── InventoryLocation (chalco | amecameca)
          └── Specifications[]

User ──┬── Profile (role)
       ├── Favorite[]
       ├── Cart / QuoteList
       ├── Address[]
       └── Order[]

Order ──┬── OrderItem[]
        ├── Payment
        ├── Shipment
        └── OrderStatus

Quote ──┬── QuoteItem[]
        └── channel (web | whatsapp)
```

---

## 3. Roadmap definitivo

### FASE 0 — Verdad operativa y base de confianza

| Campo | Valor |
|-------|-------|
| **Objetivo** | El sitio deja de mentir: contacto unificado, sin formularios falsos, sin admin público, token acento, fixes estructurales menores |
| **Prioridad** | P0 |
| **Impacto** | Muy alto en confianza |
| **Complejidad** | Baja |
| **Dependencias** | Validación datos reales del negocio |

**Entregables:** `site-contact.ts` · footer/contacto alineados · formularios fake eliminados · header sin admin · colisión desktop · padding favoritos · `--copper` real.

---

### FASE 1 — Producto real: datos, PDP, catálogo vivo

| Campo | Valor |
|-------|-------|
| **Objetivo** | Catálogo en Supabase; PDP central; cards a ficha |
| **Prioridad** | P0 |
| **Impacto** | Muy alto |
| **Complejidad** | Alta |
| **Dependencias** | Fase 0 · schema extendido · fotos/datos producto |

**Entregables:** migraciones stock/specs/subcategorías · import ~300 SKUs · `lib/catalog` · `/productos/[slug]` · `ProductCard` unificado · admin CRUD productos · rol admin en middleware · SEO producto.

---

### FASE 2 — Usuario, favoritos, cotización formal

| Campo | Valor |
|-------|-------|
| **Objetivo** | Auth visible; favoritos y cotización persisten; `/cuenta` básica |
| **Prioridad** | P1 |
| **Impacto** | Alto |
| **Complejidad** | Media–alta |
| **Dependencias** | Fase 1 (productos UUID/slug) |

**Entregables:** login Google · `/cuenta` · favoritos DB · quote DB · WhatsApp lista cotización · merge localStorage al login.

---

### FASE 3 — Comercio: carrito, checkout, pagos, pedidos

| Campo | Valor |
|-------|-------|
| **Objetivo** | Compra en línea end-to-end |
| **Prioridad** | P0 negocio (cuando operación lista) |
| **Impacto** | Muy alto |
| **Complejidad** | Muy alta |
| **Dependencias** | Fase 1–2 · pasarela · stock confiable |

**Entregables:** carts/orders/payments · `/carrito` · `/checkout` · Mercado Pago/Stripe · webhooks · admin pedidos · emails confirmación.

---

### FASE 4 — Fulfillment, envíos, postventa, producción

| Campo | Valor |
|-------|-------|
| **Objetivo** | Envío a domicilio; postventa; admin completo; launch |
| **Prioridad** | P1 |
| **Impacto** | Alto |
| **Complejidad** | Alta |
| **Dependencias** | Fase 3 · carriers o tarifas manuales |

**Entregables:** shipments · direcciones · tracking · inventario multi-sucursal · paginación server-side · sitemap · deploy producción.

---

## 4. Qué NO debemos tocar todavía

| Área | Motivo |
|------|--------|
| Estructura Home, hero fullscreen, bento layout | Acordado conservar |
| Pulido visual bento/categorías | Post-PDP |
| Shalko UI / rediseño global | Post-Fase 0 token |
| Pasarela de pago | Antes de checkout + stock |
| Carrier API automatizada | MVP con tablas manuales |
| Landings por segmento | Post-PDP |
| i18n / multi-moneda | Fuera de scope MX |
| Eliminar `/cotizacion` | Evolucionar hacia carrito híbrido |
| Reescritura estética header | Solo fixes Fase 0 |

---

## 5. Componentes a congelar

| Componente | Congelar hasta |
|------------|----------------|
| `hero.tsx` | Post-Fase 1 o indefinido |
| `categories.tsx` + `category-card.tsx` | Post-Fase 1 |
| `brands.tsx`, `story-strip.tsx` | Post-Fase 1 |
| `servicios-page`, `garantia-page` (layout) | Post-Fase 0 solo datos |
| Tipografía/espaciado global | Sin reescala hasta post-PDP |
| Footer layout 4 columnas | Post-Fase 0 contenido |

**Excepción Fase 1:** unificar cards y enlazar PDP sin cambiar estética.

---

## 6. Arquitectura por dominio

### 6.1 PDP

```
app/(site)/productos/[slug]/page.tsx
  → getProductBySlug() [server]
  → ProductDetailView
       ├── ProductGallery [client]
       ├── ProductPurchasePanel [client: CTA, stock]
       ├── ProductSpecs
       ├── ProductTrustBar
       ├── WhatsAppCTA
       └── RelatedProducts
```

### 6.2 Inventario

Tabla `product_inventory(product_id, location, quantity, reserved)`.  
Capa `lib/inventory/`: disponibilidad, reserva en checkout, admin por sucursal.

### 6.3 Cotización

Evolución de `useQuote` → `quote_items` en DB.  
Anónimo: localStorage + merge al login.  
Enviar: WhatsApp URL o registro `quote_requests` para admin.

### 6.4 Carrito

Tablas `carts`, `cart_items` con `unit_price_snapshot`.  
Un carrito por usuario/sesión; merge anónimo → auth.

### 6.5 Checkout

`/checkout` multi-paso: revisión → identidad → dirección/recogida → envío → pago → confirmación.  
Server Actions: `createOrder`, `createPaymentIntent`.

### 6.6 Pedidos

`orders`, `order_items`, `order_status_history`.  
Admin: gestión estados. Cliente: `/cuenta/pedidos`.

### 6.7 Envíos

`shipments` + tarifas por zona (manual Fase 4 inicial).  
Opción recoger Chalco/Amecameca en checkout.

### 6.8 Favoritos

Tabla existente `favorites`. Hook con adapter localStorage | Supabase.

### 6.9 WhatsApp

`lib/whatsapp/`: mensajes prellenados producto, lista cotización, tienda.  
Números desde `site-contact.ts`. Sin backend propio.

### 6.10 Schema actual vs objetivo

| Existe en migraciones | Falta |
|-----------------------|-------|
| profiles, categories, brands, products, product_images, related_products, favorites, services, banners | subcategories, specs, inventory, carts, orders, payments, shipments, addresses, quote_items |

---

## 7. Riesgos técnicos

| Riesgo | Mitigación |
|--------|------------|
| Schema cambia mid-flight | Migraciones versionadas; congelar post-F1 |
| Mock vs DB divergen | Eliminar mock al conectar catálogo |
| 6 ProductCards | Unificar en F1 |
| Header monolítico | Extraer módulos F1–F2 |
| Middleware sin rol admin | F1 obligatorio |
| Stock sin reserva concurrente | Transacciones DB |
| Webhooks pago | Sandbox + idempotencia |
| 300 fotos sin pipeline | Batch Storage + naming rules |

---

## 8. Riesgos de negocio

| Riesgo | Mitigación |
|--------|------------|
| Operación no lista para envíos | Recogida en tienda primero |
| Precios web ≠ tienda | Disclaimer + confirmación |
| Cotización vs compra confunde | Copy claro en PDP |
| WhatsApp saturado | Horarios visibles |
| Inventario desactualizado | Admin obligatorio |
| Equipo sin hábito admin | CRUD simple + import asistido |

---

## 9. Orden exacto de implementación

```
A. Fase 0 — Confianza
   A1 Datos negocio validados
   A2 site-contact.ts
   A3 Footer + contacto + garantía
   A4 Sin formularios fake
   A5 Header sin admin + colisión
   A6 Padding favoritos/garantía
   A7 Token copper

B. Fase 1 — Datos
   B1 Migraciones schema extendido
   B2 Tipos Supabase generados
   B3 Middleware rol admin
   B4 lib/catalog queries
   B5 Import productos + Storage

C. Fase 1 — PDP
   C1 ProductCard unificado
   C2 Cards → /productos/[slug]
   C3 PDP completa
   C4 WhatsApp utils
   C5 Relacionados + SEO
   C6 Reemplazar mock en sitio

D. Fase 1 — Admin catálogo
   D1 CRUD productos + imágenes
   D2 CRUD categorías/marcas
   D3 Paginación si necesario

E. Fase 2 — Usuario
   E1 Auth UI
   E2 /cuenta
   E3 Favoritos DB
   E4 Quote DB
   E5 WhatsApp cotización lista

F. Fase 3 — Transacción
   F1 Schema orders/payments
   F2 /carrito
   F3 /checkout UI
   F4 Pasarela
   F5 Webhooks + emails
   F6 Admin pedidos

G. Fase 4 — Fulfillment
   G1 Envíos + direcciones
   G2 Pickup tienda
   G3 Tracking
   G4 Inventario multi-sucursal
   G5 SEO + producción
```

**No paralelizar:** checkout antes de PDP + stock + admin productos.

---

## 10. Criterios Radio Shalko 1.0

- [ ] ~300 productos Supabase con foto por SKU
- [ ] PDP desde cualquier entrada
- [ ] Compra online o recogida con pago confirmado
- [ ] Cotización persistente + WhatsApp
- [ ] Favoritos con login
- [ ] Admin productos + pedidos + stock
- [ ] Contacto único veraz
- [ ] Envío o recogida en checkout
- [ ] Postventa operativa
- [ ] Home/bento sin regresión acordada

---

## 11. Conclusión

El proyecto tiene **frontend de tienda premium** y **backend de catálogo a medias**. El modelo híbrido es el correcto para Radio Shalko; la arquitectura debe construirse en orden **F0 → F1 (PDP+d datos) → F2 (usuario) → F3 (transacción) → F4 (envío/postventa)**.

**Próximo paso:** cerrar Fase 0, luego schema extendido + PDP como núcleo del sistema.

---

*Auditoría junio 2026 — sin código — sin rediseño visual.*
