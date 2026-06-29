/**
 * Mensajes para carritos compartidos · CART-5 / CART-6.
 */
import { formatPrice } from "@/lib/catalog/format";
import { SITE_CONTACT, whatsappHref } from "@/lib/site-contact";
import {
  formatSaleLabel,
  sessionTotal,
  type PosCartLine,
} from "@/lib/admin/seller-session";
import type { PosSummaryInput } from "@/lib/admin/seller-summary";
import type { SharedCartItemView } from "@/lib/shared-cart/queries";

export type SharedCartLineInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

/** Líneas del carrito unificado → input de createSharedCart. */
export function cartLinesToSharedInput(lines: SharedCartLineInput[]) {
  return lines.map((l) => ({
    productId: l.productId,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
  }));
}

/** Líneas POS legacy → input de createSharedCart. */
export function posLinesToSharedCartLines(lines: PosCartLine[]) {
  return cartLinesToSharedInput(
    lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      unitPrice: l.price,
    })),
  );
}

/** WhatsApp mínimo con solo enlace (carrito unificado · CART-6). */
export function buildSimpleShareWhatsAppMessage(shareUrl: string): string {
  return [
    "Hola.",
    "",
    "Te comparto la selección de productos que revisamos.",
    "",
    "Puedes verla aquí:",
    "",
    shareUrl,
  ].join("\n");
}

export function buildSimpleShareWhatsAppHref(shareUrl: string, phoneE164?: string): string {
  return whatsappHref(
    phoneE164 ?? SITE_CONTACT.whatsapp.e164,
    buildSimpleShareWhatsAppMessage(shareUrl),
  );
}

/** WhatsApp legacy POS con metadata (modo vendedor desacoplado). */
export function buildSharedCartLinkWhatsAppMessage(
  input: PosSummaryInput,
  shareUrl: string,
): string {
  const total = sessionTotal(input.lines);
  const count = input.lines.length;
  const out: string[] = [
    "Hola, te comparto tu selección de productos en Radio Shalko:",
    "",
    formatSaleLabel(input.saleNumber),
  ];

  if (input.branchLabel) {
    out.push(`Sucursal: ${input.branchLabel}`);
  }

  out.push(
    `${count} producto${count === 1 ? "" : "s"} · Total estimado: ${formatPrice(total)}`,
    "",
    `Ver tu carrito: ${shareUrl}`,
    "",
    "¿Me pueden orientar con disponibilidad y recomendaciones? Gracias.",
  );

  return out.join("\n");
}

export function buildSharedCartLinkWhatsAppHref(
  input: PosSummaryInput,
  shareUrl: string,
  phoneE164?: string,
): string {
  return whatsappHref(
    phoneE164 ?? SITE_CONTACT.whatsapp.e164,
    buildSharedCartLinkWhatsAppMessage(input, shareUrl),
  );
}

/** WhatsApp desde la página pública del carrito compartido (precios congelados). */
export function buildPublicSharedCartWhatsAppHref(
  items: SharedCartItemView[],
  options: { saleLabel?: string | null; branchName?: string | null } = {},
): string {
  const lines = items.filter((i) => i.product);
  if (!lines.length) return "";

  const total = lines.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const parts: string[] = [
    "Hola, revisé mi carrito compartido en Radio Shalko y me gustaría recibir asesoría:",
    "",
  ];
  if (options.saleLabel) parts.push(options.saleLabel);
  if (options.branchName) parts.push(`Sucursal: ${options.branchName}`);
  parts.push("", "Productos:", "");

  lines.forEach((item, i) => {
    const qty = Math.max(1, item.quantity);
    const sub = item.unitPrice * qty;
    parts.push(`${i + 1}. ${item.product!.name}`);
    parts.push(`   Cantidad: ${qty}`);
    parts.push(`   Precio unitario: ${formatPrice(item.unitPrice)}`);
    parts.push(`   Subtotal: ${formatPrice(sub)}`);
    parts.push("");
  });

  parts.push(`Total estimado: ${formatPrice(total)}`);
  parts.push("");
  parts.push("¿Me pueden orientar con disponibilidad y recomendaciones? Gracias.");

  return whatsappHref(SITE_CONTACT.whatsapp.e164, parts.join("\n"));
}
