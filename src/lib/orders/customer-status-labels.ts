/**
 * Etiquetas y copy para el cliente · SALES-5.2 / SALES-7 (sin datos internos).
 */
import { branchDisplayName } from "@/lib/orders/status-labels";

export type CustomerOrderStatusUi = {
  label: string;
  description: string;
  tone: "pending" | "approved" | "paid" | "cancelled" | "neutral" | "ready";
};

export type CustomerOrderStatusOpts = {
  hasPaymentUrl?: boolean;
  fulfillmentStatus?: string;
  pickupReadyMessage?: string | null;
  pickupReadyEstimate?: string | null;
};

export function customerOrderStatusUi(
  status: string,
  paymentStatus: string,
  opts?: CustomerOrderStatusOpts,
): CustomerOrderStatusUi {
  if (paymentStatus === "paid") {
    const fs = opts?.fulfillmentStatus ?? "unfulfilled";
    if (fs === "delivered") {
      return {
        label: "Entregado",
        description:
          "Este pedido fue marcado como entregado. Gracias por comprar en Radio Shalko.",
        tone: "paid",
      };
    }
    if (fs === "ready_for_pickup") {
      const base =
        opts?.pickupReadyMessage?.trim() ||
        "Tu pedido ya está listo para recoger en tienda.";
      const withEstimate = opts?.pickupReadyEstimate?.trim()
        ? `${base} ${opts.pickupReadyEstimate.trim()}`
        : base;
      return {
        label: "Listo para recoger",
        description: withEstimate,
        tone: "ready",
      };
    }
    if (fs === "preparing") {
      return {
        label: "Preparando pedido",
        description:
          "Estamos preparando tu pedido. Te avisaremos cuando esté listo para recoger.",
        tone: "approved",
      };
    }
    return {
      label: "Pago confirmado",
      description:
        "Recibimos tu pago. Radio Shalko continuará con la preparación de tu pedido para recolección en tienda.",
      tone: "paid",
    };
  }
  if (status === "cancelled" || paymentStatus === "refunded") {
    return {
      label: "No disponible",
      description: "Por el momento no fue posible continuar con esta solicitud.",
      tone: "cancelled",
    };
  }
  if (status === "confirmed" && paymentStatus === "unpaid") {
    if (opts?.hasPaymentUrl) {
      return {
        label: "Pago disponible",
        description:
          "Tu solicitud fue aprobada. Puedes completar el pago de forma segura para continuar con la recolección en tienda.",
        tone: "approved",
      };
    }
    return {
      label: "Aprobado · esperando pago",
      description:
        "Tu solicitud fue aprobada. Estamos preparando las instrucciones de pago.",
      tone: "approved",
    };
  }
  if (status === "pending" && paymentStatus === "unpaid") {
    return {
      label: "Solicitud recibida",
      description: "Estamos revisando la disponibilidad de tus productos.",
      tone: "pending",
    };
  }
  if (status === "completed") {
    return {
      label: "Completado",
      description: "Tu pedido fue completado. Gracias por confiar en Radio Shalko.",
      tone: "paid",
    };
  }
  return {
    label: "Solicitud recibida",
    description: "Estamos revisando la disponibilidad de tus productos.",
    tone: "pending",
  };
}

const CUSTOMER_BADGE_STYLES: Record<CustomerOrderStatusUi["tone"], string> = {
  pending: "bg-muted text-foreground/80 ring-border",
  approved: "bg-muted text-foreground ring-border",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  cancelled: "bg-muted text-muted-foreground ring-border",
  neutral: "bg-muted text-foreground/80 ring-border",
  ready: "bg-emerald-50 text-emerald-800 ring-emerald-100",
};

export function customerOrderStatusBadgeClass(tone: CustomerOrderStatusUi["tone"]): string {
  return `inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${CUSTOMER_BADGE_STYLES[tone]}`;
}

export function customerPickupHint(fulfillmentStatus?: string): string {
  if (fulfillmentStatus === "ready_for_pickup") {
    return "Puedes pasar a recoger tu pedido en la sucursal indicada.";
  }
  if (fulfillmentStatus === "delivered") {
    return "Este pedido ya fue entregado.";
  }
  return "Te avisaremos cuando el pedido esté listo para continuar.";
}

export function buildCustomerOrderWhatsAppMessage(orderNumber: string): string {
  return `Hola, quiero consultar el estado de mi pedido ${orderNumber}.`;
}

export { branchDisplayName };
