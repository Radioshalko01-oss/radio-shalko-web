/**
 * Etiquetas y copy para el cliente · lenguaje claro, sin términos técnicos.
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
  paymentInstructionsSent?: boolean;
  paymentMethod?: string;
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
        description: "Tu pedido ya fue entregado. Gracias por comprar en Radio Shalko.",
        tone: "paid",
      };
    }
    if (fs === "ready_for_pickup") {
      const base =
        opts?.pickupReadyMessage?.trim() || "Tu producto ya está listo para recoger.";
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
        label: "En preparación",
        description: "Estamos preparando tu producto. Te avisaremos cuando puedas recogerlo.",
        tone: "approved",
      };
    }
    return {
      label: "Pago confirmado",
      description: "Recibimos tu pago. Pronto comenzaremos a preparar tu pedido.",
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
    if (opts?.paymentMethod === "bank_transfer" && opts?.paymentInstructionsSent) {
      return {
        label: "Esperando pago",
        description: "Ya puedes realizar tu transferencia con los datos indicados abajo.",
        tone: "approved",
      };
    }
    return {
      label: "Solicitud aprobada",
      description:
        "Radio Shalko confirmará contigo cualquier detalle pendiente antes del pago.",
      tone: "approved",
    };
  }
  if (status === "pending" && paymentStatus === "unpaid") {
    return {
      label: "Solicitud recibida",
      description: "Estamos revisando tu solicitud. Te contactaremos por canales oficiales.",
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

export function customerPaymentSummary(
  status: string,
  paymentStatus: string,
  paymentMethod: string,
  paymentInstructionsSent: boolean,
): string {
  if (paymentStatus === "paid") return "Pago confirmado";
  if (status === "pending") {
    return "Aún no solicitamos el pago. Espera nuestra confirmación.";
  }
  if (status === "confirmed" && paymentMethod === "bank_transfer") {
    if (paymentInstructionsSent) {
      return "Realiza tu transferencia y envía tu comprobante por WhatsApp.";
    }
    return "Te compartiremos los datos bancarios cuando estén listos.";
  }
  if (status === "confirmed" && paymentMethod === "pay_in_store") {
    return "Podrás pagar en tienda cuando te indiquemos continuar.";
  }
  return "Radio Shalko confirmará contigo cualquier detalle pendiente.";
}

export function customerPickupSummary(
  branchSlug: string | null,
  branchLabel: string,
  fulfillmentStatus?: string,
): string {
  const store = branchDisplayName(branchSlug, branchLabel);
  if (fulfillmentStatus === "ready_for_pickup") {
    return `Tu producto se recogerá en ${store}. Ya puedes pasar por él.`;
  }
  if (fulfillmentStatus === "delivered") {
    return `Recogiste tu producto en ${store}.`;
  }
  if (fulfillmentStatus === "preparing") {
    return `Tu producto se recogerá en ${store}. Te avisaremos cuando esté listo.`;
  }
  return `Tu producto se recogerá en ${store}. No realizamos envíos a domicilio.`;
}

export function buildCustomerOrderWhatsAppMessage(orderNumber: string): string {
  return `Hola, quiero consultar el estado de mi solicitud ${orderNumber}.`;
}

export { branchDisplayName };
