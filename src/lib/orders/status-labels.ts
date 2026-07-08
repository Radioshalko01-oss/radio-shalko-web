/** Etiquetas UI para pedidos · mapeo temporal hasta migración de estados completos. */

import type { AvailabilityDecision } from "@/lib/orders/types";
import { AVAILABILITY_DECISION_LABELS } from "@/lib/orders/types";
import { formatPickupDateLong, formatPickupDateYmd } from "@/lib/orders/dates";
import { orderStatusBadgeClass } from "@/lib/design/admin-badges";

export type OrderStatusUi = {
  label: string;
  tone: "pending" | "paid" | "cancelled" | "neutral" | "approved" | "ready";
};

export { orderStatusBadgeClass };

export function orderStatusUi(
  status: string,
  paymentStatus: string,
  opts?: { hasPaymentUrl?: boolean; fulfillmentStatus?: string },
): OrderStatusUi {
  if (paymentStatus === "paid") {
    const fs = opts?.fulfillmentStatus ?? "unfulfilled";
    if (fs === "delivered") return { label: "Entregado", tone: "paid" };
    if (fs === "ready_for_pickup") return { label: "Listo para recoger", tone: "ready" };
    if (fs === "preparing") return { label: "Preparando", tone: "approved" };
    if (fs === "cancelled") return { label: "Cancelado", tone: "cancelled" };
    return { label: "Pago confirmado", tone: "paid" };
  }
  if (status === "cancelled" || paymentStatus === "refunded") {
    return { label: "No disponible", tone: "cancelled" };
  }
  if (paymentStatus === "failed") {
    return { label: "Pago fallido", tone: "cancelled" };
  }
  if (status === "confirmed" && paymentStatus === "unpaid") {
    return { label: "Aprobado · esperando pago", tone: "approved" };
  }
  if (status === "pending" && paymentStatus === "unpaid") {
    return { label: "Pendiente de revisión", tone: "pending" };
  }
  if (status === "completed") {
    return { label: "Completado", tone: "paid" };
  }
  return { label: "Solicitud recibida", tone: "pending" };
}

export function paymentStatusUi(
  paymentStatus: string,
  status?: string,
  opts?: { hasPaymentUrl?: boolean; fulfillmentStatus?: string },
): string {
  if (paymentStatus === "paid") {
    const fs = opts?.fulfillmentStatus ?? "unfulfilled";
    if (fs === "delivered") return "Entregado";
    if (fs === "ready_for_pickup") return "Listo para recoger";
    if (fs === "preparing") return "Preparando pedido";
    return "Pago confirmado";
  }
  if (status === "confirmed" && paymentStatus === "unpaid") {
    return "Esperando pago";
  }
  switch (paymentStatus) {
    case "paid":
      return "Pagado";
    case "pending":
      return "Pago pendiente";
    case "failed":
      return "Pago fallido";
    case "refunded":
      return "Reembolsado";
    default:
      return "Sin pago solicitado";
  }
}

export function pickupAvailabilityHint(
  decision: string | null,
  pickupDate: string | null,
): string | null {
  if (!decision || decision === "unavailable") return null;
  if (decision === "available_today") return "Disponible hoy";
  if (decision === "available_tomorrow") return "Disponible mañana";
  if (pickupDate) return `Disponible el ${formatPickupDateYmd(pickupDate)}`;
  return null;
}

export function defaultCustomerMessage(
  decision: AvailabilityDecision,
  customDate?: string | null,
): string {
  switch (decision) {
    case "available_today":
      return "Tu solicitud fue revisada y podemos continuar hoy con el pedido. El siguiente paso será enviarte las instrucciones de pago.";
    case "available_tomorrow":
      return "Tu solicitud fue revisada y podremos continuar con el pedido a partir de mañana. El siguiente paso será enviarte las instrucciones de pago.";
    case "available_custom": {
      const formatted = customDate ? formatPickupDateLong(customDate) : "la fecha indicada";
      return `Tu solicitud fue revisada y podremos continuar con el pedido a partir del ${formatted}. El siguiente paso será enviarte las instrucciones de pago.`;
    }
    case "unavailable":
      return "Por el momento no contamos con disponibilidad para completar esta solicitud. Podemos ayudarte a revisar opciones similares.";
  }
}

export function availabilityDecisionLabel(decision: string | null): string {
  if (!decision) return "—";
  if (decision in AVAILABILITY_DECISION_LABELS) {
    return AVAILABILITY_DECISION_LABELS[decision as AvailabilityDecision];
  }
  return decision;
}

export const ADMIN_BRANCH_REVIEW_HINTS = {
  chalco:
    "Solicitud para recolección en Chalco. Revisa disponibilidad antes de confirmar al cliente.",
  amecameca:
    "Solicitud para recolección en Amecameca. Confirma disponibilidad y fecha estimada antes de solicitar el pago.",
} as const;

export function branchDisplayName(slug: string | null, fallback?: string | null): string {
  if (slug === "chalco") return "Radio Shalko Chalco";
  if (slug === "amecameca") return "Radio Shalko Amecameca";
  return fallback ?? "—";
}

/** Mensaje inicial mientras el pedido está pendiente (SALES-3). */
export function buildOrderWhatsAppMessage(orderNumber: string): string {
  return `Hola, te contacto de Radio Shalko sobre tu solicitud de compra ${orderNumber}. Estamos revisando disponibilidad de tus productos.`;
}

/** Mensaje post-revisión con texto guardado para el cliente (SALES-4). */
export function buildOrderDecisionWhatsAppMessage(
  orderNumber: string,
  customerMessage: string,
): string {
  return `Hola, te contacto de Radio Shalko sobre tu solicitud ${orderNumber}.

${customerMessage.trim()}`;
}

export function isOrderPendingReview(status: string, paymentStatus: string): boolean {
  return status === "pending" && paymentStatus === "unpaid";
}

export function isOrderApprovedAwaitingPayment(
  status: string,
  paymentStatus: string,
  opts?: { hasPaymentUrl?: boolean },
): boolean {
  return status === "confirmed" && paymentStatus === "unpaid" && !opts?.hasPaymentUrl;
}

export function isOrderPaymentAvailable(
  status: string,
  paymentStatus: string,
  hasPaymentUrl: boolean,
): boolean {
  return status === "confirmed" && paymentStatus === "unpaid" && hasPaymentUrl;
}

/** Etiqueta legible de preferencia de pago capturada en checkout. */
export function customerPaymentPreferenceLabel(paymentMethod: string): string {
  if (paymentMethod === "bank_transfer") return "Transferencia bancaria";
  if (paymentMethod === "pay_in_store") return "Pago presencial en tienda";
  return "Por confirmar";
}

/** Etiqueta legible del método de pago manual validado por admin. */
export function manualPaymentMethodLabel(
  paymentMethod: string,
  storeLocation?: string | null,
): string {
  if (paymentMethod === "bank_transfer") return "Transferencia bancaria";
  if (paymentMethod === "pay_in_store" && storeLocation === "chalco") {
    return "Pago presencial Chalco";
  }
  if (paymentMethod === "pay_in_store" && storeLocation === "amecameca") {
    return "Pago presencial Amecameca";
  }
  if (paymentMethod === "pay_in_store") return "Pago presencial en tienda";
  return paymentMethod;
}

/** Mensaje WhatsApp con enlace de pago · SALES-6 */
export function buildOrderPaymentWhatsAppMessage(
  orderNumber: string,
  paymentUrl: string,
): string {
  return `Hola, te contacto de Radio Shalko sobre tu solicitud ${orderNumber}.

Tu pedido fue aprobado y ya puedes realizar el pago de forma segura aquí:

${paymentUrl}

Cuando el pago se confirme, prepararemos tu pedido para recolección en tienda.`;
}

/** Mensaje WhatsApp cuando el pedido está listo para recoger · SALES-7 */
export function buildOrderPickupWhatsAppMessage(
  orderNumber: string,
  pickupMessage: string,
): string {
  return `Hola, te contacto de Radio Shalko sobre tu pedido ${orderNumber}.

${pickupMessage.trim()}`;
}

export function defaultPickupReadyMessage(branchLabel: string): string {
  return `Tu pedido ya está listo para recoger en ${branchLabel}. Puedes pasar en horario de tienda.`;
}

export function fulfillmentStatusLabel(fulfillmentStatus: string): string {
  switch (fulfillmentStatus) {
    case "preparing":
      return "Preparando pedido";
    case "ready_for_pickup":
      return "Listo para recoger";
    case "delivered":
      return "Entregado";
    case "cancelled":
      return "Cancelado";
    default:
      return "Pago confirmado";
  }
}

export function historyStatusLabel(
  toStatus: string,
  fromStatus: string | null,
): string {
  if (!fromStatus && toStatus === "pending") return "Solicitud recibida";
  if (toStatus === "pending") return "Solicitud recibida";
  if (fromStatus === "pending" && toStatus === "confirmed") {
    return "Disponibilidad confirmada";
  }
  if (fromStatus === "pending" && toStatus === "cancelled") {
    return "Marcado como no disponible";
  }
  if (toStatus === "confirmed") return "Pedido confirmado";
  if (toStatus === "cancelled") return "Pedido cancelado";
  return `Estado: ${toStatus}`;
}
