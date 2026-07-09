import type Stripe from "stripe";
import { getStripeClient, siteBaseUrl } from "@/lib/stripe/client";

export type StripeCheckoutLineItem = {
  productTitle: string;
  quantity: number;
  unitPrice: number;
};

export type StripeCheckoutOrder = {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerEmail: string;
  shippingCost: number;
  total: number;
  items: StripeCheckoutLineItem[];
};

export type StripeCheckoutValidation =
  | { ok: true }
  | { ok: false; error: string };

/** Precios en BD están en pesos MXN enteros; Stripe usa centavos. */
export function pesosToStripeAmount(pesos: number): number {
  return Math.round(pesos * 100);
}

export function validateOrderForStripeCheckout(order: {
  status: string;
  payment_status: string;
  fulfillment_status: string;
  total: number;
  customer_email: string;
  stripe_payment_url: string | null;
  order_items: StripeCheckoutLineItem[] | null;
}): StripeCheckoutValidation {
  if (order.status === "cancelled") {
    return { ok: false, error: "No se puede generar pago para un pedido no disponible." };
  }
  if (order.status !== "confirmed") {
    return {
      ok: false,
      error: "Solo pedidos aprobados pueden generar enlace de pago.",
    };
  }
  if (order.payment_status === "paid") {
    return { ok: false, error: "Este pedido ya está pagado." };
  }
  if (order.payment_status !== "unpaid") {
    return { ok: false, error: "El estado de pago no permite generar enlace." };
  }
  if (order.fulfillment_status === "cancelled") {
    return { ok: false, error: "Este pedido no puede continuar con pago." };
  }
  if (order.total <= 0) {
    return { ok: false, error: "El total del pedido debe ser mayor a cero." };
  }
  const items = order.order_items ?? [];
  if (items.length === 0) {
    return { ok: false, error: "El pedido no tiene productos." };
  }
  if (!order.customer_email?.trim()) {
    return { ok: false, error: "El pedido no tiene correo de cliente." };
  }
  return { ok: true };
}

function buildLineItems(order: StripeCheckoutOrder): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map(
    (item) => ({
      price_data: {
        currency: "mxn",
        product_data: {
          name: item.productTitle.slice(0, 250),
        },
        unit_amount: pesosToStripeAmount(item.unitPrice),
      },
      quantity: item.quantity,
    }),
  );

  if (order.shippingCost > 0) {
    lineItems.push({
      price_data: {
        currency: "mxn",
        product_data: { name: "Envío" },
        unit_amount: pesosToStripeAmount(order.shippingCost),
      },
      quantity: 1,
    });
  }

  return lineItems;
}

export async function createCheckoutSessionForOrder(
  order: StripeCheckoutOrder,
  options?: { returnBaseUrl?: string },
): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripeClient();
  const base = (options?.returnBaseUrl ?? siteBaseUrl()).replace(/\/+$/, "");
  const metadata = {
    order_id: order.id,
    order_number: order.orderNumber,
    user_id: order.userId ?? "",
  };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    currency: "mxn",
    customer_email: order.customerEmail.trim(),
    line_items: buildLineItems(order),
    metadata,
    payment_intent_data: { metadata },
    success_url: `${base}/cuenta/pedidos/${order.id}?paid=success`,
    cancel_url: `${base}/cuenta/pedidos/${order.id}?paid=cancelled`,
  });

  if (!session.url) {
    throw new Error("Stripe no devolvió URL de checkout.");
  }

  return { sessionId: session.id, url: session.url };
}
