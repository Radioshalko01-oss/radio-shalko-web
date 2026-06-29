import type { BranchSlug } from "@/lib/checkout/types";
import { SITE_CONTACT } from "@/lib/site-contact";

export const PICKUP_STORE_LABELS: Record<BranchSlug, string> = {
  chalco: "Radio Shalko Chalco",
  amecameca: "Radio Shalko Amecameca",
};

/** Copy público — sin logística interna (SALES-2.1). */
export const PICKUP_STORE_HINTS: Record<BranchSlug, string> = {
  chalco:
    "Recolección en Radio Shalko Chalco. Confirmaremos disponibilidad antes de solicitar el pago.",
  amecameca:
    "Recolección en Radio Shalko Amecameca. Algunos productos pueden requerir confirmación de disponibilidad para programar la entrega en tienda.",
};

export const CHECKOUT_GENERAL_NOTE =
  "Radio Shalko revisará tu solicitud y te avisará cuando el pedido esté listo para continuar.";

export function pickupStoreLabel(slug: BranchSlug): string {
  return PICKUP_STORE_LABELS[slug];
}

export function pickupStoreAddress(slug: BranchSlug): string {
  return SITE_CONTACT.stores.find((s) => s.id === slug)?.address ?? "";
}

/** Placeholder interno hasta integración Stripe (SALES-6). */
export const PENDING_PAYMENT_METHOD = "pay_in_store" as const;
