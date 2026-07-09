import type Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyCustomer } from "@/lib/notifications/customer-notifications";
import { notifyCustomerPaymentConfirmedEmail } from "@/lib/notifications/customer-email-events";
import { pesosToStripeAmount } from "@/lib/stripe/checkout";

export type WebhookProcessResult =
  | { ok: true; alreadyPaid?: boolean }
  | { ok: false; error: string; status: number };

/**
 * Procesa checkout.session.completed de forma idempotente.
 * Usa service_role — solo desde route handler verificado.
 */
export async function processCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<WebhookProcessResult> {
  const orderId = session.metadata?.order_id?.trim();
  if (!orderId) {
    return { ok: false, error: "Missing order_id metadata", status: 400 };
  }

  const supabase = createAdminClient();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select(
      "id, order_number, user_id, customer_email, customer_name, status, payment_status, total, stripe_checkout_session_id, stripe_paid_at",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (fetchError) {
    console.error("[stripe webhook] fetch order:", fetchError.message);
    return { ok: false, error: "Database error", status: 500 };
  }

  if (!order) {
    return { ok: false, error: "Order not found", status: 404 };
  }

  if (order.stripe_checkout_session_id && order.stripe_checkout_session_id !== session.id) {
    console.warn(
      "[stripe webhook] session mismatch",
      orderId,
      order.stripe_checkout_session_id,
      session.id,
    );
    return { ok: false, error: "Session mismatch", status: 400 };
  }

  if (order.payment_status === "paid") {
    return { ok: true, alreadyPaid: true };
  }

  if (order.status === "cancelled") {
    return { ok: false, error: "Order cancelled", status: 400 };
  }

  const expectedAmountCents = pesosToStripeAmount(order.total);
  const paidAmountCents = session.amount_total;

  if (paidAmountCents === null || paidAmountCents !== expectedAmountCents) {
    console.error("[stripe webhook] amount mismatch", {
      orderId,
      orderNumber: order.order_number,
      expectedAmountCents,
      paidAmountCents,
      sessionId: session.id,
    });

    const { error: failUpdateError } = await supabase
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("id", orderId)
      .eq("payment_status", "unpaid");

    if (failUpdateError) {
      console.error("[stripe webhook] failed to mark payment failed:", failUpdateError.message);
    }

    const { error: historyError } = await supabase.from("order_status_history").insert({
      order_id: orderId,
      actor_id: null,
      from_status: order.status,
      to_status: order.status,
      note: `Pago Stripe rechazado: monto no coincide (esperado ${expectedAmountCents} centavos, recibido ${paidAmountCents ?? "null"})`,
    });

    if (historyError) {
      console.error("[stripe webhook] history insert (amount mismatch):", historyError.message);
    }

    return { ok: false, error: "Amount mismatch", status: 400 };
  }

  const paidAt = new Date().toISOString();
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      stripe_payment_intent_id: paymentIntentId,
      stripe_paid_at: paidAt,
      stripe_checkout_session_id: session.id,
    })
    .eq("id", orderId)
    .eq("payment_status", "unpaid");

  if (updateError) {
    console.error("[stripe webhook] update order:", updateError.message);
    return { ok: false, error: "Update failed", status: 500 };
  }

  const { error: historyError } = await supabase.from("order_status_history").insert({
    order_id: orderId,
    actor_id: null,
    from_status: order.status,
    to_status: order.status,
    note: "Pago confirmado vía Stripe (unpaid → paid)",
  });

  if (historyError) {
    console.error("[stripe webhook] history insert:", historyError.message);
  }

  if (order.user_id) {
    notifyCustomer({
      userId: order.user_id,
      type: "payment_confirmed",
      title: "Pago confirmado",
      message: `Recibimos el pago de tu pedido ${order.order_number}.`,
      href: `/cuenta/pedidos/${orderId}`,
      orderId,
      metadata: { order_number: order.order_number },
    });
  }

  if (order.customer_email && order.customer_name) {
    void notifyCustomerPaymentConfirmedEmail({
      orderNumber: order.order_number,
      customerEmail: order.customer_email,
      customerName: order.customer_name,
      orderId,
    });
  }

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin", "layout");
  revalidatePath("/cuenta");
  revalidatePath("/cuenta/pedidos");
  revalidatePath(`/cuenta/pedidos/${orderId}`);
  revalidatePath("/cuenta/notificaciones");

  return { ok: true };
}
