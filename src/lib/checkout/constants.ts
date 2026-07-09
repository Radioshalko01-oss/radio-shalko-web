import type { BranchSlug, PaymentMethod } from "@/lib/checkout/types";
import { SITE_CONTACT } from "@/lib/site-contact";

export const PICKUP_STORE_LABELS: Record<BranchSlug, string> = {
  chalco: "Radio Shalko Chalco",
  amecameca: "Radio Shalko Amecameca",
};

/** Copy público — tienda de recolección (sin envíos). */
export const PICKUP_STORE_HINTS: Record<BranchSlug, string> = {
  chalco:
    "Recogerás tu producto en Radio Shalko Chalco. No realizamos envíos a domicilio.",
  amecameca:
    "Recogerás tu producto en Radio Shalko Amecameca. No realizamos envíos a domicilio.",
};

export const CHECKOUT_GENERAL_NOTE =
  "Radio Shalko revisará tu solicitud y te avisará cuando el pedido esté listo para continuar.";

export const CHECKOUT_PAY_IN_STORE_NOTE =
  "Pagarás y recogerás en la tienda de recolección que selecciones, una vez que confirmemos disponibilidad, precio y garantía.";

export const CHECKOUT_BANK_TRANSFER_NOTE =
  "Radio Shalko te compartirá los datos bancarios oficiales cuando confirme tu solicitud. La compra se confirma hasta validar el pago. Recogerás tu producto en la tienda de recolección que selecciones.";

export function pickupStoreLabel(slug: BranchSlug): string {
  return PICKUP_STORE_LABELS[slug];
}

export function pickupStoreAddress(slug: BranchSlug): string {
  return SITE_CONTACT.stores.find((s) => s.id === slug)?.address ?? "";
}

export function checkoutPaymentPreferenceLabel(paymentMethod: PaymentMethod): string {
  if (paymentMethod === "bank_transfer") return "Transferencia bancaria";
  if (paymentMethod === "pay_in_store") return "Pago presencial en tienda";
  return "Por confirmar";
}

export function buildCheckoutOrderNotes(
  paymentMethod: PaymentMethod,
  branchSlug: BranchSlug,
  customerNotes: string,
): string | null {
  const parts: string[] = [
    `Preferencia de pago: ${checkoutPaymentPreferenceLabel(paymentMethod)}`,
    `Tienda de recolección: ${pickupStoreLabel(branchSlug)}`,
  ];
  const trimmed = customerNotes.trim();
  if (trimmed) parts.push(trimmed);
  return parts.join("\n\n");
}
