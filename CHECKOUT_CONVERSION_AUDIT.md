# ORDER-3.5 — Auditoría de Conversión del Checkout · Radio Shalko

**Fase:** ORDER-3.5 (análisis UX / copy / conversión únicamente)  
**Fecha:** Junio 2026  
**Estado:** Auditoría profesional — sin implementación  
**Base:** ORDER-3 (`/checkout`, `checkout-page.tsx`, `checkout-summary.tsx`)

---

## Resumen ejecutivo

El checkout ORDER-3 es **funcional y bien estructurado** (one-page, resumen sticky, validación), pero se percibe como **formulario administrativo** más que como **experiencia de compra premium**. Los principales frenos de conversión son: título en inglés ("Checkout"), numeración tipo trámite ("01 · Datos del cliente"), copy técnico en éxito y pagos, ausencia de señales de confianza, imágenes de producto pequeñas para el ticket promedio, y un CTA ("Continuar") que no comunica el siguiente paso real.

La prioridad alta se concentra en **copy + confianza + honestidad de pago**; cambios visuales de producto y CTA son prioridad media; refinamientos móviles y acordeón son prioridad baja-media.

---

## 1. Auditoría visual por dispositivo

### 1.1 Desktop

| Aspecto | Estado actual | Problema |
|---------|---------------|----------|
| Layout 2 columnas | ✅ Sólido | — |
| Título "Checkout" | Inglés técnico | Rompe inmersión local; suena a dev, no a tienda |
| Secciones numeradas `01 / 1.` | Estilo formulario B2B | Evoca trámite, no compra emocional |
| Cards con borde uniforme | Limpio pero plano | Todas las secciones tienen mismo peso; no guía el ojo |
| Resumen lateral | Buen total `text-4xl` | Título "Resumen del pedido" suena a back-office |
| CTA duplicado | Columna izq. + derecha | Redundante; el de la izquierda compite con el sticky |
| Mercado Pago + badge | Visualmente activo | Parece pasarela ya conectada |
| Sin bloque confianza | Ausente | Oportunidad perdida junto al total |

**Oportunidades desktop:** Jerarquía por sección (contacto más ligero, entrega+pago más densos), un solo CTA en columna derecha, subtítulo humano bajo el H1.

### 1.2 Tablet (`md` breakpoint)

| Aspecto | Estado actual | Problema |
|---------|---------------|----------|
| 2 columnas desde `md` | ✅ | Sidebar puede sentirse estrecho (320px) |
| Resumen no visible arriba | Solo desktop sidebar | En tablet landscape OK; portrait puede apretar formulario |
| CTA en sidebar | Presente | Bien ubicado |

**Oportunidad:** En tablet vertical, considerar resumen colapsable encima del formulario (como móvil) si el viewport < 900px — prioridad baja.

### 1.3 Mobile

| Aspecto | Estado actual | Problema |
|---------|---------------|----------|
| Resumen compacto arriba | ✅ | Bueno antes del scroll largo |
| Formulario largo (nacional) | Muchos campos | Fatiga; sin indicador de progreso |
| Barra fija inferior | Total + "Continuar" | ✅ Zona de pulgar correcta |
| CTA "Continuar" abreviado en loading (`…`) | Ambiguo | Poco feedback |
| Resumen compacto: total `text-2xl` | Menor que desktop | Aceptable pero producto se ve pequeño |
| Scroll hasta pago | Largo | Usuario pierde de vista el total al bajar |

**Oportunidades móvil:** Sticky mini-resumen al scroll, acordeón de secciones, CTA con microcopy ("Revisar y continuar"), total siempre visible en barra.

### 1.4 Elementos débiles (transversal)

1. **Lenguaje administrativo** — "Datos del cliente", "Resumen del pedido", "Validando…"
2. **CTA ambiguo** — "Continuar" ¿hacia dónde?
3. **Pantalla éxito ORDER-3** — "Checkout validado correctamente" / "Vista previa ORDER-3" destruye confianza
4. **Placeholder identificación** — "Como aparece en tu identificación" suena a trámite fiscal
5. **Sin humanización de marca** — No hay voz Radio Shalko ("te acompañamos", "tu selección")
6. **Mercado Pago** — Icono tarjeta + "Recomendado" = integración implícita

### 1.5 Oportunidades de confianza (no implementadas)

- Años de experiencia (40+ años en copy del footer, no en checkout)
- Garantía Radio Shalko
- Tiendas físicas verificables
- Contacto humano post-pedido
- Seguridad de datos (sin exagerar)

---

## 2. Resumen de compra — análisis de naming

### Alternativas evaluadas

| Opción | Pros | Contras | Veredicto |
|--------|------|---------|-----------|
| **Resumen del pedido** (actual) | Claro operativamente | Suena a ERP, no a compra; "pedido" antes de confirmar puede confundir | ❌ Reemplazar |
| **Resumen de compra** | Estándar ecommerce MX; neutro y profesional | Menos emocional | ✅ **Recomendado principal** |
| **Tu compra** | Directo, personal, estilo ML/Shopify | Puede sonar definitivo antes de pagar | ✅ Alternativa válida |
| **Tu selección** | Alineado con shared cart y asesoría | Menos estándar en checkout; suave para tickets altos indecisos | ⚠️ Mejor en carrito/pre-checkout |

### Recomendación

**Título del bloque:** `Tu compra` (mobile-first, personal) o `Resumen de compra` (más formal).

**Subtítulo opcional bajo el título:**  
`{n} producto(s) · Total estimado` — refuerza sin repetir "pedido".

### Protagonismo visual del producto (sin exagerar)

| Elemento | Actual | Propuesto | Prioridad |
|----------|--------|-----------|-----------|
| Imagen | 56×56px (`h-14`) | 64–72px en desktop; 60px móvil | Media |
| Marca | `text-[9px]` uppercase | `text-[10px]` copper, más aire arriba | Baja |
| Nombre | `text-sm` | `text-[15px]` font-medium, `line-clamp-2` | Media |
| Subtotal línea | `text-sm` | Mantener; alinear baseline con nombre | Baja |
| Total | `text-4xl` | Mantener; es el ancla correcta | — |
| Separación producto/total | Dos bordes | Un solo bloque productos + bloque totales más contrastado | Media |

**Principio Sweetwater/Fender:** El instrumento debe **verse lo suficiente** para que el usuario sienta que compra algo valioso, no un ítem de lista de inventario.

---

## 3. Microcopy — auditoría y cambios recomendados

### 3.1 Mapa de textos actuales → propuestos

| Ubicación | Actual | Propuesto | Justificación |
|-----------|--------|-----------|---------------|
| H1 | Checkout | **Finalizar compra** | Español; acción clara; estándar ML/Shopify MX |
| Subtítulo | Completa tus datos para continuar con tu pedido. | **Estás a un paso. Revisa tu selección y elige cómo recibirla.** | Acompañamiento; menos burocrático |
| Volver | Volver al carrito | **← Editar carrito** | Acción concreta |
| Sección 1 | 1. Datos del cliente | **¿Cómo te contactamos?** | Humano; quita "cliente" |
| Nombre placeholder | Como aparece en tu identificación | **Tu nombre** | Menos trámite |
| Teléfono label | Teléfono | **WhatsApp o teléfono** * | Alineado con operación real RS |
| Notas | Notas del pedido | **¿Algo que debamos saber?** (opcional) | Conversacional |
| Sección 2 | 2. Entrega | **¿Cómo quieres recibirlo?** | Pregunta directa |
| Pickup hint | Sin costo · Recoge en sucursal | **Gratis · Recoge cuando quieras** | Beneficio |
| Local hint | Zona metropolitana · desde $99 | **Entrega en zona · costo estimado** | Honesto si precio varía |
| Nacional hint | Todo México · desde $199 | **Envío a domicilio · costo estimado** | Idem |
| Sección 3 | 3. Pago | **¿Cómo prefieres pagar?** | Elección, no obligación |
| MP hint | Tarjeta · SPEI · OXXO · MSI | Ver sección 7 (honestidad) | — |
| Transferencia | Transferencia SPEI · Confirmación manual | **Transferencia · Te enviamos los datos al confirmar** | Expectativa clara |
| Pago tienda | Ideal al recoger en tienda | **Pago al recoger · Sin anticipo online** | Honesto |
| Disclaimer total | Precios de referencia. El monto final se confirma al procesar el pedido. | **Total estimado. Te confirmamos disponibilidad y monto final por WhatsApp o teléfono.** | Confianza + canal real |
| CTA | Continuar | Ver sección 6 | — |
| Loading CTA | Validando… | **Un momento…** | Menos técnico |
| Éxito ORDER-3 | Checkout validado correctamente | *(ORDER-4)* **¡Recibimos tu solicitud!** | Emocional |
| Éxito sub | Vista previa ORDER-3 · No se creó ningún pedido | *(eliminar en prod)* | Destruye confianza |
| Editar | Editar datos | **Corregir información** | Claro |

### 3.2 Textos a evitar en implementación

- "Checkout", "Validar", "Cliente", "Procesar pedido" (pre-pago)
- Referencias internas (ORDER-3, ORDER-4)
- "Confirmación manual" sin contexto humano

### 3.3 Tono deseado

**Claro · Cálido · Profesional · Local**

Como un vendedor de tienda que te ayuda a cerrar la compra, no como un portal de gobierno.

---

## 4. Bloque de confianza (diseño — no implementar)

### Ubicación

Debajo del total en `CheckoutSummary`, antes del CTA (desktop y mobile).

### Wireframe textual

```
┌─────────────────────────────────────┐
│  Tu compra                    ...   │
│  [productos]                        │
│  TOTAL  $13,600                     │
├─────────────────────────────────────┤
│  ✓ Más de 40 años en instrumentos   │
│  ✓ Garantía Radio Shalko            │
│  ✓ Recoge en tienda o envío a domicilio │
│  ✓ Te confirmamos por WhatsApp      │
└─────────────────────────────────────┘
```

### Especificación visual

| Propiedad | Valor |
|-----------|-------|
| Fondo | `bg-muted/30` o sin fondo, solo iconos `text-copper/80` |
| Iconos | `Check` 14px, no verde llamativo (evitar parecer "pago aprobado") |
| Tipografía | `text-xs text-muted-foreground leading-relaxed` |
| Densidad | 4 líneas máximo; no párrafos |
| Separador | `border-t` sutil arriba del bloque |

### Variante por `delivery_method` (futuro)

- Pickup: destacar línea "Recoge en {sucursal} sin costo de envío"
- Envío: destacar "Te avisamos cuando salga tu paquete"

### Qué NO incluir

- Sellos de pago falsos
- "Compra 100% segura" genérico sin respaldo
- Logos de Mercado Pago hasta ORDER-6

---

## 5. Percepción de valor del producto

### Diagnóstico actual

Con imagen 56px y nombre `text-sm`, un instrumento de $15,000+ se percibe como **línea de ticket pequeño** (estilo Amazon commodity), no como **compra importante** (estilo Fender/Sweetwater).

### Señales de "ticket pequeño"

- Thumbnail igual que drawer del carrito
- "Cant. 1 · $X c/u" en gris pequeño domina sobre el nombre
- Sin link al PDP en checkout (usuario no puede re-verificar el producto)
- Una sola línea de marca en 9px

### Señales de "compra importante" (referencias)

| Referencia | Patrón |
|------------|--------|
| **Apple** | Imagen grande, nombre dominante, precio secundario |
| **Sweetwater** | Foto del instrumento, marca visible, specs mínimas |
| **Fender** | Producto como protagonista del resumen |
| **Shopify Plus** | Sidebar con imagen ≥ 72px en tickets altos |

### Mejoras propuestas (prioridad media)

1. **Imagen 72×72 desktop, 64×64 mobile** en resumen checkout
2. **Nombre `text-base` font-display o font-medium** con más line-height
3. **Marca en copper, siempre visible** cuando exista
4. **Subtotal de línea alineado a la derecha**, cantidad en badge discreto (`×2`) no texto "Cant."
5. **Link sutil al PDP** en nombre del producto (nueva pestaña) — "Ver detalle"
6. **Para 1 producto en carrito:** layout hero en resumen (imagen más grande, nombre 2 líneas) — prioridad baja, alto impacto en PDP único

### Regla

> Si `rows.length === 1` y `subtotal > $5,000`, usar variante **hero summary** (imagen 96px, nombre `text-lg`).

---

## 6. CTA principal — análisis

### "Continuar" — evaluación

| Criterio | Puntuación | Nota |
|----------|------------|------|
| Claridad del siguiente paso | ⚠️ Baja | ¿Continuar qué? ¿Pagar? ¿Revisar? |
| Estándar ecommerce | Media | Shopify usa "Pay now" / "Complete order"; ML "Continuar" solo en pasos intermedios |
| Adecuado pre-ORDER-4 | Media | OK mientras no hay pago real |
| Adecuado post-ORDER-4 | ❌ | Debe cambiar según método de pago |

### Alternativas

| CTA | Cuándo | Pros | Contras |
|-----|--------|------|---------|
| **Continuar** | Actual | Corto, neutro | Ambiguo |
| **Revisar información** | Pre-submit ORDER-3 | Honesto en fase validación | Largo; no empuja conversión |
| **Confirmar datos** | Pre-submit | Claro que no es pago aún | Suena definitivo |
| **Solicitar mi pedido** | ORDER-4 sin MP | Alineado RS (asesoría + pedido) | No aplica si MP redirect |
| **Ir a pagar** | ORDER-6 MP seleccionado | Claro | Falso hoy |
| **Finalizar solicitud** | ORDER-4 transferencia/tienda | Honesto | Menos emocional |

### Recomendación por fase

| Fase | CTA recomendado | Subtexto bajo botón |
|------|-----------------|---------------------|
| **ORDER-3.5 (ahora)** | **Revisar y continuar** | "Aún no realizas ningún pago" |
| **ORDER-4 (sin MP)** | **Enviar solicitud de compra** | "Te contactaremos para confirmar" |
| **ORDER-6 (MP)** | **Pagar con Mercado Pago** | Logo MP pequeño + "Pago seguro" |
| **ORDER-6 (transferencia)** | **Confirmar pedido** | "Te enviaremos los datos bancarios" |
| **ORDER-6 (tienda)** | **Reservar mi pedido** | "Pagas al recoger en tienda" |

### Cambio inmediato (ORDER-3.5 implementación futura)

**Botón:** `Revisar y continuar`  
**Microcopy debajo:** `No se realizará ningún cargo en este paso.` (hasta ORDER-6)

**Impacto esperado:** +claridad, −ansiedad por pago prematuro.

---

## 7. Mercado Pago — presentación honesta

### Problema actual

- Badge **"Recomendado"** + icono tarjeta + hint "Tarjeta · SPEI · OXXO · MSI"
- Selección por defecto `mercado_pago`
- Usuario infiere: **"ya puedo pagar aquí"**

### Diseño propuesto (honesto)

```
┌─────────────────────────────────────────────────┐
│ ○ Mercado Pago                    [Próximamente] │  ← hasta ORDER-6
│   o sin badge "Próximamente" en ORDER-4:
│   "Al confirmar, te redirigimos a Mercado Pago" │
│   Tarjeta · SPEI · OXXO · meses sin intereses    │
└─────────────────────────────────────────────────┘
```

### Estados por fase

| Fase | Presentación |
|------|--------------|
| ORDER-3 / 3.5 | Badge `Preferido` (no "Recomendado") + línea: **"Disponible al confirmar tu pedido"** |
| ORDER-4 sin MP | Mismo + nota al submit según método |
| ORDER-6 | Badge `Pago seguro` + logo MP oficial + CTA "Pagar con Mercado Pago" |

### Copy recomendado para hint

**Actual:** `Tarjeta · SPEI · OXXO · MSI`  
**Propuesto:** `Pagarás de forma segura al finalizar · tarjeta, SPEI u OXXO`

### Reglas UX

1. No mostrar logos de Visa/Mastercard hasta integración real
2. No usar color verde "aprobado" en la opción MP
3. Si MP no está activo, **no preseleccionar** o mostrar tooltip "Muy pronto"
4. Transferencia y pago en tienda deben verse como **alternativas válidas**, no "plan B"

---

## 8. Móvil — auditoría y mejoras

### 8.1 Alcance del pulgar

| Elemento | Posición | Evaluación |
|----------|----------|------------|
| CTA "Continuar" | Barra inferior derecha | ✅ Zona OK |
| Total | Barra inferior izquierda | ✅ Visible |
| Radio entrega/pago | Centro del scroll | ⚠️ Requiere scroll; OK |
| Campos nacionales | Muy abajo | ❌ Fatiga; lejos del CTA |

### 8.2 Mejoras propuestas

| Mejora | Descripción | Prioridad |
|--------|-------------|-----------|
| **Acordeón de secciones** | Contacto abierto; Entrega/Pago colapsables con check ✓ al completar | Media |
| **Indicador de progreso** | `Paso 1 de 3` discreto bajo H1 | Media |
| **Mini sticky al scroll** | Al pasar resumen inicial, barra muestra `{n} prod · $total` | Baja |
| **CTA más ancho** | `flex-1` en botón, total compacto | Media |
| **Teclado numérico** | `inputMode="tel"` en teléfonos y CP | Alta (implementación trivial) |
| **Reducir campos nacionales** | Agrupar "Dirección" en un solo bloque visual | Baja |
| **Autofocus** | Primer campo nombre al entrar | Baja |

### 8.3 Longitud del formulario

**Pickup (default):** ~6 campos → ✅ Aceptable  
**Local:** ~9 campos → ⚠️ Límite  
**Nacional:** ~14 campos → ❌ Alto abandono potencial

**Mitigación nacional (futuro):** Autocompletado CP → colonia/ciudad (API SEPOMEX o Google Places) — fuera de ORDER-3.5, anotar para ORDER-4+.

### 8.4 Barra fija — copy

Añadir bajo el total en barra móvil (opcional):  
`Envío incluido` o `+ envío $99` según método — evita sorpresa al comparar con resumen superior.

---

## 9. Consolidado — problemas, oportunidades y cambios

### 9.1 Problemas encontrados (top 10)

1. Título "Checkout" en inglés
2. Numeración administrativa de secciones (01, 1., 2., 3.)
3. "Resumen del pedido" prematuro y frío
4. CTA "Continuar" ambiguo
5. Mercado Pago parece integrado
6. Pantalla éxito con copy técnico ORDER-3
7. Producto visualmente pequeño para ticket alto
8. Sin bloque de confianza
9. Disclaimer genérico sin canal humano (WhatsApp)
10. Formulario nacional muy largo en móvil

### 9.2 Oportunidades (top 8)

1. Renombrar a experiencia "Finalizar compra" en español
2. Preguntas como títulos de sección
3. Bloque confianza bajo total
4. CTA contextual + subtexto anti-ansiedad
5. MP honesto ("al confirmar")
6. Hero summary para carrito de 1 instrumento caro
7. Acordeón móvil con progreso
8. Alineación copy con WhatsApp como canal de confirmación real

### 9.3 Tabla de cambios recomendados

| # | Cambio | Impacto esperado | Prioridad |
|---|--------|------------------|-----------|
| 1 | H1 → "Finalizar compra" + subtítulo humano | +confianza, +claridad local | **Alta** |
| 2 | Secciones sin números; títulos en forma de pregunta | −percepción trámite | **Alta** |
| 3 | "Resumen del pedido" → "Tu compra" | +emoción, +estándar retail | **Alta** |
| 4 | CTA → "Revisar y continuar" + subtexto sin cargo | +claridad, −ansiedad pago | **Alta** |
| 5 | MP: hint honesto + badge "Preferido" vs "Recomendado" | −frustración expectativa | **Alta** |
| 6 | Bloque confianza (4 bullets) | +conversión tickets altos | **Alta** |
| 7 | Disclaimer con WhatsApp/teléfono | +alineación operación real | **Media** |
| 8 | Imagen producto 72px + nombre más grande | +percepción valor | **Media** |
| 9 | Eliminar CTA duplicado columna izquierda desktop | +jerarquía | **Media** |
| 10 | Placeholders y labels humanizados | +warmth | **Media** |
| 11 | Hero summary si 1 producto > $5k | +premium instrumentos | **Media** |
| 12 | `inputMode="tel"` en tel/CP | +UX móvil | **Media** |
| 13 | Acordeón + progreso móvil | −abandono formulario largo | **Baja** |
| 14 | Link "Ver detalle" al PDP desde resumen | +confianza pre-compra | **Baja** |
| 15 | Pantalla éxito preparada para ORDER-4 (sin refs internas) | +profesionalismo | **Alta** (antes de prod) |

### 9.4 Impacto esperado global

| Métrica (estimación cualitativa) | Antes ORDER-3.5 | Después implementación |
|----------------------------------|-----------------|------------------------|
| Percepción "tienda premium" | 6/10 | 8.5/10 |
| Claridad del siguiente paso | 5/10 | 8/10 |
| Ansiedad de pago prematuro | Alta | Baja |
| Confianza en marca local | Media | Alta |
| Abandono móvil (nacional) | Alto riesgo | Medio (sin API CP) |

*Notas: sin A/B test real; basado en heurísticas Nielsen + patrones Shopify/ML/Sweetwater.*

---

## 10. Roadmap de implementación sugerido

| Sprint | Alcance | Fase |
|--------|---------|------|
| **3.5a** | Copy + títulos + CTA + MP honesto + disclaimer | UI only |
| **3.5b** | Bloque confianza + resumen "Tu compra" + producto más grande | UI only |
| **3.5c** | Móvil: acordeón, inputMode, barra mejorada | UI only |
| **4** | Pantalla éxito real + CTA por método de pago | Con backend |

**No modificar:** Supabase, payload, `createOrderFromCart`, RLS, Mercado Pago SDK.

---

## 11. Checklist pre-implementación (ORDER-3.5 dev)

Cuando se apruebe implementar, verificar:

- [ ] Ningún string contiene "ORDER-" en UI de producción
- [ ] "Checkout" no aparece en UI visible (solo ruta `/checkout` OK)
- [ ] Mercado Pago no implica cobro inmediato
- [ ] CTA tiene subtexto de expectativa
- [ ] Bloque confianza no compite visualmente con el total
- [ ] `npm run build` exit 0
- [ ] Probar flujo pickup en móvil (camino feliz más corto)

---

*Documento generado en fase ORDER-3.5. Solo auditoría — sin cambios de código.*
