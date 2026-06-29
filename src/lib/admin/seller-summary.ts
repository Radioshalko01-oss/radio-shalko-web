/**
 * Resumen de venta POS · CART-5 (copiar, WhatsApp, imprimir).
 */
import { formatPrice } from "@/lib/catalog/format";
import { SITE_CONTACT, whatsappHref } from "@/lib/site-contact";
import {
  formatSaleLabel,
  lineSubtotal,
  sessionTotal,
  type PosCartLine,
} from "@/lib/admin/seller-session";

export type PosSummaryInput = {
  saleNumber: number;
  startedAt: string;
  branchLabel: string | null;
  lines: PosCartLine[];
};

const DISCLAIMER =
  "Total estimado sujeto a disponibilidad y confirmación en tienda.";

export function formatSaleDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Texto plano ordenado para copiar al portapapeles. */
export function buildPosSaleSummaryText(input: PosSummaryInput): string {
  const total = sessionTotal(input.lines);
  const out: string[] = [
    "RADIO SHALKO",
    "────────────────────",
    formatSaleLabel(input.saleNumber),
    `Fecha: ${formatSaleDateTime(input.startedAt)}`,
  ];

  if (input.branchLabel) {
    out.push(`Sucursal: ${input.branchLabel}`);
  }

  out.push("", "PRODUCTOS", "");

  input.lines.forEach((line, i) => {
    const sub = lineSubtotal(line);
    out.push(`${i + 1}. ${line.name}`);
    if (line.brandName) out.push(`   Marca: ${line.brandName}`);
    out.push(`   Cantidad: ${line.quantity}`);
    out.push(`   Precio unitario: ${formatPrice(line.price)}`);
    out.push(`   Subtotal: ${formatPrice(sub)}`);
    out.push("");
  });

  out.push("────────────────────");
  out.push(`TOTAL ESTIMADO: ${formatPrice(total)}`);
  out.push("");
  out.push(`Nota: ${DISCLAIMER}`);

  return out.join("\n");
}

/** Mensaje WhatsApp con metadata POS + tono de asesoría. */
export function buildPosWhatsAppMessage(input: PosSummaryInput): string {
  const total = sessionTotal(input.lines);
  const out: string[] = [
    "Hola, estoy interesado en estos productos y me gustaría recibir asesoría sobre disponibilidad y recomendaciones.",
    "",
    formatSaleLabel(input.saleNumber),
    `Fecha: ${formatSaleDateTime(input.startedAt)}`,
  ];

  if (input.branchLabel) {
    out.push(`Sucursal: ${input.branchLabel}`);
  }

  out.push("", "Productos:", "");

  input.lines.forEach((line, i) => {
    const qty = Math.max(1, Math.floor(line.quantity || 1));
    const sub = lineSubtotal(line);
    out.push(`${i + 1}. ${line.name}`);
    if (line.brandName) out.push(`   Marca: ${line.brandName}`);
    out.push(`   Cantidad: ${qty}`);
    out.push(`   Precio unitario: ${formatPrice(line.price)}`);
    out.push(`   Subtotal: ${formatPrice(sub)}`);
    out.push("");
  });

  out.push(`Total estimado: ${formatPrice(total)}`);
  out.push("");
  out.push("¿Me pueden orientar con disponibilidad y recomendaciones? Gracias.");

  return out.join("\n");
}

export function buildPosWhatsAppHref(
  input: PosSummaryInput,
  phoneE164?: string,
): string {
  return whatsappHref(
    phoneE164 ?? SITE_CONTACT.whatsapp.e164,
    buildPosWhatsAppMessage(input),
  );
}

export { DISCLAIMER as POS_SUMMARY_DISCLAIMER };
