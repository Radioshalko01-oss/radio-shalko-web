/** Tipos compartidos · pedidos / checkout / revisión admin. */

/* ── Checkout (ORDER-4 / SALES-2) ── */

export type OrderLineSnapshot = {
  productId: string;
  productTitle: string;
  productSku: string | null;
  brandName: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type CreateOrderSuccess = {
  ok: true;
  orderId: string;
  orderNumber: string;
  customerName: string;
  total: number;
  branchDisplayName: string;
  statusLabel: string;
  paymentPreferenceLabel: string;
};

export type CreateOrderFailure = {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string>;
};

export type CreateOrderResult = CreateOrderSuccess | CreateOrderFailure;

export type OrderValidatedLine = {
  product: import("@/lib/catalog/types").CatalogProduct;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

/* ── Revisión de disponibilidad (SALES-4) ── */

export const AVAILABILITY_DECISIONS = [
  "available_today",
  "available_tomorrow",
  "available_custom",
  "unavailable",
] as const;

export type AvailabilityDecision = (typeof AVAILABILITY_DECISIONS)[number];

export const AVAILABILITY_DECISION_LABELS: Record<AvailabilityDecision, string> = {
  available_today: "Disponible hoy",
  available_tomorrow: "Disponible mañana",
  available_custom: "Fecha personalizada",
  unavailable: "No disponible",
};

export const AVAILABILITY_DECISION_HINTS: Record<AvailabilityDecision, string> = {
  available_today: "El pedido puede continuar hoy.",
  available_tomorrow: "El pedido podrá continuar el siguiente día hábil.",
  available_custom: "Define una fecha específica para continuar con el pedido.",
  unavailable: "El pedido no puede continuar por falta de disponibilidad.",
};

export type OrderReviewInput = {
  orderId: string;
  decision: AvailabilityDecision;
  pickupAvailableDate?: string;
  customerMessage: string;
  adminInternalNote?: string;
};

export type AdminActionResult = { ok: true } | { ok: false; error: string };

/** Alias usado por admin-actions */
export type ActionResult = AdminActionResult;
