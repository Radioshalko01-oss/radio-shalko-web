# CHECKOUT_POLISH_REPORT — ORDER-3.6

**Fecha:** 22 jun 2026  
**Alcance:** UX, diseño, copy y jerarquía visual en `/checkout`. Sin cambios en backend, Supabase, orders, pagos ni carrito.

---

## Resumen

El checkout pasó de un formulario funcional con lenguaje técnico a una experiencia alineada con Radio Shalko: títulos en forma de pregunta, resumen con protagonismo del total, bloque de confianza discreto, copy honesto sobre Mercado Pago y CTA orientado a conversión.

---

## Cambios realizados

### Parte 1 — Header
| Antes | Después |
|-------|---------|
| Checkout | **Finalizar compra** |
| Completa tus datos para continuar con tu pedido. | **Completa tus datos para preparar tu pedido.** |

Metadata de página actualizada a `Finalizar compra`.

### Parte 2 — Secciones
- Eliminada numeración `01 / 02 / 03`.
- Títulos reemplazados por preguntas humanas:
  - ¿Cómo te contactamos?
  - ¿Cómo deseas recibir tu pedido?
  - ¿Cómo prefieres realizar el pago?

### Parte 3 — Resumen
- **Resumen del pedido** → **Tu compra**
- Imágenes ampliadas (72×72 px desktop, 64×64 compacto móvil).
- Nombre de producto con mayor peso tipográfico; línea hero en compras de un solo ítem ≥ $5,000.
- Sombra suave en la tarjeta del resumen.

### Parte 4 — Total
- Subtotal y envío en `text-xs` y color secundario.
- **Total estimado** como elemento dominante (`text-[2.5rem]` desktop, `text-3xl` móvil compacto).
- Disclaimer: *Te confirmamos disponibilidad y monto final por WhatsApp o teléfono.*

### Parte 5 — Bloque de confianza
Debajo del total (desktop y móvil):
- ✓ Atención personalizada
- ✓ Garantía Radio Shalko
- ✓ Recoge en sucursal o recibe en domicilio
- ✓ Confirmaremos tu pedido por teléfono o WhatsApp

Estilo: lista con checks en cobre tenue, sin cajas ni colores agresivos.

### Parte 6 — Mercado Pago
- Eliminado badge **Recomendado** y copy de métodos activos (*Tarjeta · SPEI · OXXO*).
- Nuevo hint: **Disponible al confirmar tu pedido.**
- Transferencia: *Te enviamos los datos al confirmar.*
- Pago en tienda: *Pagas al recoger o cuando acordemos contigo.*

### Parte 7 — CTA
- **Continuar** → **Revisar y continuar**
- Texto auxiliar: *No se realizará ningún cargo en este paso.*
- CTA duplicado en columna izquierda (desktop) eliminado; único CTA en sidebar sticky.
- Componente reutilizable `CheckoutSubmitBlock`.

### Parte 8 — Pantalla de éxito temporal
| Antes | Después |
|-------|---------|
| Checkout validado correctamente | **Información recibida correctamente** |
| Vista previa ORDER-3 · No se creó ningún pedido. | **Estamos preparando el siguiente paso de tu compra.** |
| Resumen | **Tu compra** |

### Parte 9 — Móvil
- Resumen compacto arriba con trust block incluido.
- Barra sticky inferior rediseñada: total grande, CTA ancho completo, subtexto de confianza, `safe-area-inset-bottom`.
- Padding inferior de página aumentado (`pb-44`) para no tapar campos.
- `inputMode="tel"` en campos de teléfono.
- Copy de formulario más humano (WhatsApp o teléfono, ¿Algo que debamos saber?).

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/components/pages/checkout-page.tsx` | Header, secciones, form copy, pago, CTA, éxito, móvil sticky |
| `src/components/checkout/checkout-summary.tsx` | Tu compra, jerarquía visual, total, trust block |
| `src/components/checkout/checkout-submit-block.tsx` | **Nuevo** — CTA + disclaimer |
| `src/app/(site)/checkout/page.tsx` | Metadata title |

**No modificados (según reglas):** migraciones, orders, `createOrderFromCart`, Mercado Pago, shared carts, carrito, validación backend.

---

## Capturas sugeridas

1. **Desktop — formulario completo**  
   `/checkout` con 2–3 productos. Verificar sidebar sticky: Tu compra, total grande, trust block, CTA.

2. **Desktop — sección pago**  
   Mercado Pago sin badge “Recomendado”; hint “Disponible al confirmar tu pedido.”

3. **Móvil — vista inicial**  
   Resumen compacto + preguntas de sección + barra sticky con total y CTA full-width.

4. **Móvil — scroll formulario**  
   Campos de entrega sin quedar ocultos detrás del sticky footer.

5. **Pantalla de éxito**  
   Tras enviar formulario válido: “Información recibida correctamente” sin referencias ORDER-*.

---

## Observaciones UX finales

1. **Jerarquía clara:** El total es el ancla visual del resumen; subtotal/envío no compiten.
2. **Confianza sin ruido:** El bloque de checks refuerza valor Radio Shalko sin parecer banner promocional.
3. **Expectativas honestas:** Mercado Pago ya no sugiere pago inmediato; reduce fricción post-CTA en ORDER-4.
4. **CTA único en desktop:** Evita doble botón y concentra la acción en el resumen (patrón e-commerce estándar).
5. **Móvil:** CTA full-width mejora área táctil; el subtexto bajo el botón reduce abandono por miedo al cargo.
6. **Próximo paso (ORDER-4):** La pantalla de éxito temporal está lista para reemplazarse por confirmación real + enlace de pago cuando exista `createOrderFromCart()`.

---

## Validación

```bash
npm run build
```

Resultado: **exit 0** — build compilado correctamente (Next.js 16.2.6, ruta `/checkout` presente).
