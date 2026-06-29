/**
 * Mensajes de WhatsApp por producto (Fase 1 · C4).
 *
 * Fuente única para que PDP, cotización y futuras acciones (apartado) usen el
 * mismo texto profesional. Cliente-safe: solo usa formatPrice + site-contact.
 *
 * No es checkout ni carrito: solo arma el texto y el enlace wa.me.
 */
import { formatPrice } from "@/lib/catalog/format";
import { SITE_CONTACT, whatsappHref } from "@/lib/site-contact";

export type WhatsAppIntent = "consulta" | "cotizacion" | "apartado";

/** Datos mínimos de producto necesarios para el mensaje (mock o catálogo). */
export type WhatsAppProduct = {
  name: string;
  brand?: string | null;
  sku?: string | null;
  price: number;
  slug: string;
};

export type ProductMessageOptions = {
  /** Tipo de mensaje. Por defecto "consulta". */
  intent?: WhatsAppIntent;
  /** Sucursal preferida del cliente, si la indicó. */
  branchName?: string | null;
  /** Base URL para el enlace del producto (sobrescribe el autodetectado). */
  siteUrl?: string;
};

const INTRO: Record<WhatsAppIntent, string> = {
  consulta:
    "Hola, estoy interesado en este producto y me gustaría recibir asesoría sobre disponibilidad y recomendaciones.",
  cotizacion:
    "Hola, estoy interesado en este producto y me gustaría recibir asesoría sobre disponibilidad y recomendaciones.",
  apartado: "Hola, me gustaría apartar este producto:",
};

const CLOSING: Record<WhatsAppIntent, string> = {
  consulta: "¿Me pueden orientar con disponibilidad y recomendaciones? Gracias.",
  cotizacion: "¿Me pueden orientar con disponibilidad y recomendaciones? Gracias.",
  apartado: "¿Me indican cómo proceder con el apartado? Gracias.",
};

function resolveBaseUrl(explicit?: string): string {
  if (explicit) return explicit.replace(/\/+$/, "");
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "https://radioshalko.com";
}

/** URL absoluta de la PDP del producto. */
export function productUrl(slug: string, baseUrl?: string): string {
  return `${resolveBaseUrl(baseUrl)}/productos/${slug}`;
}

/** Texto del mensaje de WhatsApp para un producto, según la intención. */
export function buildProductWhatsAppMessage(
  product: WhatsAppProduct,
  options: ProductMessageOptions = {},
): string {
  const intent = options.intent ?? "consulta";

  const lines: string[] = [INTRO[intent], ""];
  lines.push(`• Producto: ${product.name}`);
  if (product.brand) lines.push(`• Marca: ${product.brand}`);
  if (product.sku) lines.push(`• SKU: ${product.sku}`);
  lines.push(`• Precio: ${formatPrice(product.price)}`);
  if (options.branchName) lines.push(`• Sucursal de interés: ${options.branchName}`);
  lines.push(`• Enlace: ${productUrl(product.slug, options.siteUrl)}`);
  lines.push("");
  lines.push(CLOSING[intent]);

  return lines.join("\n");
}

/** Enlace wa.me listo para usar (mensaje + número oficial o de sucursal). */
export function buildProductWhatsAppHref(
  product: WhatsAppProduct,
  options: ProductMessageOptions & { phoneE164?: string } = {},
): string {
  const message = buildProductWhatsAppMessage(product, options);
  return whatsappHref(options.phoneE164 ?? SITE_CONTACT.whatsapp.e164, message);
}

/* --------------------------------------------------- cotización multi-producto */

/** Línea de cotización: producto + cantidad + precio unitario. */
export type QuoteLine = {
  name: string;
  quantity: number;
  unitPrice: number;
};

/** Texto de WhatsApp para el carrito (varios productos). */
export function buildQuoteWhatsAppMessage(lines: QuoteLine[]): string {
  const out: string[] = [
    "Hola, estoy interesado en estos productos y me gustaría recibir asesoría sobre disponibilidad y recomendaciones.",
    "",
    "Productos en mi carrito:",
    "",
  ];

  let total = 0;
  lines.forEach((line, i) => {
    const qty = Math.max(1, Math.floor(line.quantity || 1));
    const subtotal = line.unitPrice * qty;
    total += subtotal;
    out.push(`${i + 1}. ${line.name}`);
    out.push(`   Cantidad: ${qty}`);
    out.push(`   Precio unitario: ${formatPrice(line.unitPrice)}`);
    out.push(`   Subtotal: ${formatPrice(subtotal)}`);
    out.push("");
  });

  out.push(`Total estimado: ${formatPrice(total)}`);
  out.push("");
  out.push("¿Me pueden orientar con disponibilidad y recomendaciones? Gracias.");

  return out.join("\n");
}

/** Enlace wa.me con la cotización completa prellenada. */
export function buildQuoteWhatsAppHref(
  lines: QuoteLine[],
  phoneE164?: string,
): string {
  return whatsappHref(
    phoneE164 ?? SITE_CONTACT.whatsapp.e164,
    buildQuoteWhatsAppMessage(lines),
  );
}
