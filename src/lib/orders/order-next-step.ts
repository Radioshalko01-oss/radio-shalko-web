import type { AdminOrderDetail } from "@/lib/orders/admin-queries";

export type OrderNextStepKind =
  | "review_availability"
  | "confirm_price"
  | "define_warranty"
  | "confirm_payment_method"
  | "send_transfer_instructions"
  | "validate_payment"
  | "prepare_order"
  | "ready_for_pickup"
  | "mark_delivered"
  | "completed"
  | "cancelled";

export type OrderNextStep = {
  kind: OrderNextStepKind;
  title: string;
  description: string;
  anchor: string;
};

export function resolveOrderNextStep(order: AdminOrderDetail): OrderNextStep {
  if (order.status === "cancelled" || order.fulfillmentStatus === "cancelled") {
    return {
      kind: "cancelled",
      title: "Solicitud cerrada",
      description: "No requiere más acciones.",
      anchor: "order-progress",
    };
  }

  if (order.status === "pending" && order.paymentStatus === "unpaid") {
    return {
      kind: "review_availability",
      title: "Revisar disponibilidad",
      description: "Confirma productos y disponibilidad con el cliente.",
      anchor: "order-review",
    };
  }

  if (order.status === "confirmed" && order.paymentStatus === "unpaid") {
    if (!order.confirmedFinalPriceAt) {
      return {
        kind: "confirm_price",
        title: "Confirmar precio final",
        description: "Registra el monto acordado y aceptado por el cliente.",
        anchor: "order-price",
      };
    }
    if (!order.warrantyLabel) {
      return {
        kind: "define_warranty",
        title: "Definir garantía",
        description: "Indica la garantía aplicable a este pedido.",
        anchor: "order-warranty",
      };
    }
    if (
      order.paymentMethod === "bank_transfer" &&
      !order.paymentMethodConfirmed
    ) {
      return {
        kind: "send_transfer_instructions",
        title: "Enviar instrucciones de transferencia",
        description: "Comparte los datos bancarios y marca como enviado.",
        anchor: "order-payment-method",
      };
    }
    if (!order.paymentMethodConfirmed) {
      return {
        kind: "confirm_payment_method",
        title: "Confirmar forma de pago",
        description: "Confirma pago presencial en la sucursal indicada.",
        anchor: "order-payment-method",
      };
    }
    return {
      kind: "validate_payment",
      title: "Validar pago",
      description: "Registra la transferencia o el pago presencial recibido.",
      anchor: "order-validate-payment",
    };
  }

  if (order.paymentStatus === "paid" && order.fulfillmentStatus === "unfulfilled") {
    return {
      kind: "prepare_order",
      title: "Preparar pedido",
      description: "Inicia la preparación del producto.",
      anchor: "order-fulfillment",
    };
  }

  if (order.fulfillmentStatus === "preparing") {
    return {
      kind: "ready_for_pickup",
      title: "Marcar listo para recoger",
      description: "Avisa al cliente que puede pasar por su producto.",
      anchor: "order-fulfillment",
    };
  }

  if (order.fulfillmentStatus === "ready_for_pickup") {
    return {
      kind: "mark_delivered",
      title: "Marcar entregado",
      description: "Confirma la entrega cuando el cliente recoja.",
      anchor: "order-fulfillment",
    };
  }

  return {
    kind: "completed",
    title: "Pedido completado",
    description: "No hay acciones pendientes.",
    anchor: "order-progress",
  };
}
