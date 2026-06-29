"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  AVAILABILITY_DECISIONS,
  type ActionResult,
  type AvailabilityDecision,
} from "@/lib/orders/types";
import { isValidYmd, mexicoTodayYmd, mexicoTomorrowYmd } from "@/lib/orders/dates";
import { branchDisplayName } from "@/lib/orders/status-labels";
import {
  createCheckoutSessionForOrder,
  validateOrderForStripeCheckout,
} from "@/lib/stripe/checkout";
import { isStripeConfigured } from "@/lib/stripe/client";
import { notifyCustomerPaymentLink } from "@/lib/notifications/customer-payment-email";
import { notifyCustomerPickupReady } from "@/lib/notifications/customer-pickup-email";
import { notifyCustomer } from "@/lib/notifications/customer-notifications";

const uuidSchema = z.string().uuid("Identificador de pedido inválido.");

const reviewSchema = z.object({
  orderId: uuidSchema,
  decision: z.enum(AVAILABILITY_DECISIONS),
  pickupAvailableDate: z.string().optional(),
  customerMessage: z.string().trim().min(1, "El mensaje para el cliente es obligatorio."),
  adminInternalNote: z.string().trim().optional(),
});

function resolvePickupDate(
  decision: AvailabilityDecision,
  customDate?: string,
): { ok: true; date: string | null } | { ok: false; error: string } {
  if (decision === "available_today") {
    return { ok: true, date: mexicoTodayYmd() };
  }
  if (decision === "available_tomorrow") {
    return { ok: true, date: mexicoTomorrowYmd() };
  }
  if (decision === "available_custom") {
    if (!customDate || !isValidYmd(customDate)) {
      return { ok: false, error: "Selecciona una fecha válida para continuar con el pedido." };
    }
    return { ok: true, date: customDate };
  }
  return { ok: true, date: null };
}

function historyNote(decision: AvailabilityDecision, internalNote?: string): string {
  const labels: Record<AvailabilityDecision, string> = {
    available_today: "Disponibilidad confirmada · hoy",
    available_tomorrow: "Disponibilidad confirmada · mañana",
    available_custom: "Disponibilidad confirmada · fecha personalizada",
    unavailable: "Marcado como no disponible",
  };
  const base = labels[decision];
  if (internalNote?.trim()) return `${base}. Nota interna: ${internalNote.trim()}`;
  return base;
}

/**
 * Registra la decisión de disponibilidad de un pedido pendiente (admin only).
 * Aprobación → status confirmed. No disponible → status cancelled.
 */
export async function submitOrderAvailabilityReview(input: {
  orderId: string;
  decision: string;
  pickupAvailableDate?: string;
  customerMessage: string;
  adminInternalNote?: string;
}): Promise<ActionResult> {
  const user = await requireAdmin();

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { orderId, decision, pickupAvailableDate, customerMessage, adminInternalNote } =
    parsed.data;

  const dateResult = resolvePickupDate(decision, pickupAvailableDate);
  if (!dateResult.ok) return dateResult;

  const supabase = await createClient();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, order_number, user_id, status, payment_status")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchError) return { ok: false, error: fetchError.message };
  if (!order) return { ok: false, error: "Pedido no encontrado." };

  if (order.status !== "pending") {
    return {
      ok: false,
      error: "Este pedido ya fue revisado y no puede modificarse desde aquí.",
    };
  }

  if (order.payment_status !== "unpaid") {
    return { ok: false, error: "Solo se pueden revisar solicitudes sin pago registrado." };
  }

  const isUnavailable = decision === "unavailable";
  const newStatus = isUnavailable ? "cancelled" : "confirmed";
  const newFulfillment = isUnavailable ? "cancelled" : "unfulfilled";
  const reviewedAt = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: newStatus,
      fulfillment_status: newFulfillment,
      payment_status: "unpaid",
      availability_decision: decision,
      pickup_available_date: dateResult.date,
      customer_message: customerMessage,
      admin_internal_note: adminInternalNote?.trim() || null,
      reviewed_at: reviewedAt,
      reviewed_by: user.id,
    })
    .eq("id", orderId)
    .eq("status", "pending");

  if (updateError) return { ok: false, error: updateError.message };

  const { error: historyError } = await supabase.from("order_status_history").insert({
    order_id: orderId,
    actor_id: user.id,
    from_status: "pending",
    to_status: newStatus,
    note: historyNote(decision, adminInternalNote),
  });

  if (historyError) {
    console.error("[submitOrderAvailabilityReview] history insert:", historyError.message);
  }

  if (!isUnavailable && order.user_id) {
    notifyCustomer({
      userId: order.user_id,
      type: "order_approved",
      title: "Tu solicitud fue aprobada",
      message: `Tu solicitud ${order.order_number} fue aprobada. Pronto estará disponible el pago.`,
      href: `/cuenta/pedidos/${orderId}`,
      orderId,
      metadata: { order_number: order.order_number },
    });
  }

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin", "layout");
  revalidatePath("/admin");
  revalidatePath("/cuenta");
  revalidatePath("/cuenta/pedidos");
  revalidatePath(`/cuenta/pedidos/${orderId}`);
  revalidatePath("/cuenta/notificaciones");
  return { ok: true };
}

export type CreateStripeCheckoutResult =
  | { ok: true; url: string; reused: boolean }
  | { ok: false; error: string };

/**
 * Genera (o reutiliza) Stripe Checkout Session para pedido aprobado · SALES-6.
 */
export async function createStripeCheckoutForOrder(
  orderId: string,
): Promise<CreateStripeCheckoutResult> {
  const user = await requireAdmin();

  if (!isStripeConfigured()) {
    return {
      ok: false,
      error:
        "Stripe no está configurado. Agrega STRIPE_SECRET_KEY en las variables de entorno.",
    };
  }

  const supabase = await createClient();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      user_id,
      customer_email,
      customer_name,
      status,
      payment_status,
      fulfillment_status,
      total,
      shipping_cost,
      customer_message,
      stripe_payment_url,
      stripe_checkout_session_id,
      branches ( slug, display_name, name ),
      order_items (
        product_title, quantity, unit_price
      )
    `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (fetchError) return { ok: false, error: fetchError.message };
  if (!order) return { ok: false, error: "Pedido no encontrado." };

  const row = order as unknown as {
    id: string;
    order_number: string;
    user_id: string | null;
    customer_email: string;
    customer_name: string;
    status: string;
    payment_status: string;
    fulfillment_status: string;
    total: number;
    shipping_cost: number;
    customer_message: string | null;
    stripe_payment_url: string | null;
    stripe_checkout_session_id: string | null;
    branches: { slug: string; display_name: string; name: string } | null;
    order_items: Array<{
      product_title: string;
      quantity: number;
      unit_price: number;
    }> | null;
  };

  if (row.stripe_payment_url && row.payment_status === "unpaid") {
    return { ok: true, url: row.stripe_payment_url, reused: true };
  }

  const lineItems = (row.order_items ?? []).map((item) => ({
    productTitle: item.product_title,
    quantity: item.quantity,
    unitPrice: item.unit_price,
  }));

  const validation = validateOrderForStripeCheckout({
    status: row.status,
    payment_status: row.payment_status,
    fulfillment_status: row.fulfillment_status,
    total: row.total,
    customer_email: row.customer_email,
    stripe_payment_url: row.stripe_payment_url,
    order_items: lineItems,
  });

  if (!validation.ok) return validation;

  try {
    const { sessionId, url } = await createCheckoutSessionForOrder({
      id: row.id,
      orderNumber: row.order_number,
      userId: row.user_id,
      customerEmail: row.customer_email,
      shippingCost: row.shipping_cost,
      total: row.total,
      items: lineItems,
    });

    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        stripe_checkout_session_id: sessionId,
        stripe_payment_url: url,
        stripe_payment_created_at: now,
        payment_requested_at: now,
        payment_requested_by: user.id,
        payment_provider: "stripe",
      })
      .eq("id", orderId);

    if (updateError) return { ok: false, error: updateError.message };

    const branchLabel = branchDisplayName(
      row.branches?.slug ?? null,
      row.branches?.display_name ?? row.branches?.name,
    );

    void notifyCustomerPaymentLink({
      orderNumber: row.order_number,
      customerEmail: row.customer_email,
      customerName: row.customer_name,
      branchLabel,
      total: row.total,
      customerMessage: row.customer_message,
      paymentUrl: url,
    });

    if (row.user_id) {
      notifyCustomer({
        userId: row.user_id,
        type: "payment_available",
        title: "Pago disponible",
        message: `Tu pedido ${row.order_number} ya tiene pago disponible.`,
        href: `/cuenta/pedidos/${row.id}`,
        orderId: row.id,
        metadata: { order_number: row.order_number },
      });
    }

    revalidatePath("/admin/pedidos");
    revalidatePath(`/admin/pedidos/${orderId}`);
    revalidatePath("/cuenta");
    revalidatePath("/cuenta/pedidos");
    revalidatePath(`/cuenta/pedidos/${orderId}`);
    revalidatePath("/cuenta/notificaciones");

    return { ok: true, url, reused: false };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo crear la sesión de pago.";
    console.error("[createStripeCheckoutForOrder]", message);
    return { ok: false, error: message };
  }
}

const readyForPickupSchema = z.object({
  orderId: uuidSchema,
  message: z.string().trim().min(1, "El mensaje para el cliente es obligatorio."),
  estimate: z.string().trim().optional(),
});

function revalidateOrderPaths(orderId: string) {
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin", "layout");
  revalidatePath("/admin");
  revalidatePath("/cuenta");
  revalidatePath("/cuenta/pedidos");
  revalidatePath(`/cuenta/pedidos/${orderId}`);
  revalidatePath("/cuenta/notificaciones");
}

async function insertFulfillmentHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  actorId: string,
  note: string,
) {
  const { error } = await supabase.from("order_status_history").insert({
    order_id: orderId,
    actor_id: actorId,
    from_status: null,
    to_status: "confirmed",
    note,
  });
  if (error) console.error("[fulfillment history]", error.message);
}

/** Marca pedido pagado como en preparación · SALES-7 */
export async function markOrderPreparing(orderId: string): Promise<ActionResult> {
  const user = await requireAdmin();
  const supabase = await createClient();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, order_number, user_id, payment_status, fulfillment_status")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchError) return { ok: false, error: fetchError.message };
  if (!order) return { ok: false, error: "Pedido no encontrado." };
  if (order.payment_status !== "paid") {
    return { ok: false, error: "Solo pedidos pagados pueden entrar en preparación." };
  }
  if (order.fulfillment_status !== "unfulfilled") {
    return {
      ok: false,
      error: "Este pedido ya avanzó en preparación o entrega.",
    };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      fulfillment_status: "preparing",
      prepared_at: now,
      fulfillment_updated_by: user.id,
    })
    .eq("id", orderId)
    .eq("fulfillment_status", "unfulfilled");

  if (updateError) return { ok: false, error: updateError.message };

  await insertFulfillmentHistory(
    supabase,
    orderId,
    user.id,
    "Preparación iniciada",
  );

  if (order.user_id) {
    notifyCustomer({
      userId: order.user_id,
      type: "order_preparing",
      title: "Estamos preparando tu pedido",
      message: `Tu pedido ${order.order_number} está en preparación.`,
      href: `/cuenta/pedidos/${orderId}`,
      orderId,
      metadata: { order_number: order.order_number },
    });
  }

  revalidateOrderPaths(orderId);
  return { ok: true };
}

/** Marca pedido listo para recoger · SALES-7 */
export async function markOrderReadyForPickup(input: {
  orderId: string;
  message: string;
  estimate?: string;
}): Promise<ActionResult> {
  const user = await requireAdmin();
  const parsed = readyForPickupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { orderId, message, estimate } = parsed.data;
  const supabase = await createClient();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      user_id,
      customer_email,
      customer_name,
      payment_status,
      fulfillment_status,
      total,
      branches ( slug, display_name, name ),
      order_items ( product_title, quantity )
    `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (fetchError) return { ok: false, error: fetchError.message };
  if (!order) return { ok: false, error: "Pedido no encontrado." };

  const row = order as unknown as {
    user_id: string | null;
    payment_status: string;
    fulfillment_status: string;
    order_number: string;
    customer_email: string;
    customer_name: string;
    total: number;
    branches: { slug: string; display_name: string; name: string } | null;
    order_items: Array<{ product_title: string; quantity: number }> | null;
  };

  if (row.payment_status !== "paid") {
    return { ok: false, error: "Solo pedidos pagados pueden marcarse listos." };
  }
  if (row.fulfillment_status !== "preparing" && row.fulfillment_status !== "unfulfilled") {
    return {
      ok: false,
      error: "Este pedido no puede marcarse listo desde su estado actual.",
    };
  }

  const now = new Date().toISOString();
  const updatePayload = {
    fulfillment_status: "ready_for_pickup" as const,
    ready_for_pickup_at: now,
    pickup_ready_message: message,
    pickup_ready_estimate: estimate?.trim() || null,
    fulfillment_updated_by: user.id,
    ...(row.fulfillment_status === "unfulfilled" ? { prepared_at: now } : {}),
  };

  const { error: updateError } = await supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", orderId)
    .in("fulfillment_status", ["unfulfilled", "preparing"]);

  if (updateError) return { ok: false, error: updateError.message };

  await insertFulfillmentHistory(
    supabase,
    orderId,
    user.id,
    `Listo para recoger${estimate?.trim() ? ` · ${estimate.trim()}` : ""}`,
  );

  const branchLabel = branchDisplayName(
    row.branches?.slug ?? null,
    row.branches?.display_name ?? row.branches?.name,
  );

  void notifyCustomerPickupReady({
    orderId,
    orderNumber: row.order_number,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    branchLabel,
    total: row.total,
    pickupMessage: message,
    pickupEstimate: estimate?.trim() || null,
    items: (row.order_items ?? []).map((i) => ({
      title: i.product_title,
      quantity: i.quantity,
    })),
  });

  if (row.user_id) {
    notifyCustomer({
      userId: row.user_id,
      type: "order_ready_for_pickup",
      title: "Tu pedido está listo para recoger",
      message: message.trim(),
      href: `/cuenta/pedidos/${orderId}`,
      orderId,
      metadata: {
        order_number: row.order_number,
        estimate: estimate?.trim() || null,
      },
    });
  }

  revalidateOrderPaths(orderId);
  return { ok: true };
}

/** Marca pedido como entregado · SALES-7 */
export async function markOrderDelivered(orderId: string): Promise<ActionResult> {
  const user = await requireAdmin();
  const supabase = await createClient();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, order_number, user_id, payment_status, fulfillment_status")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchError) return { ok: false, error: fetchError.message };
  if (!order) return { ok: false, error: "Pedido no encontrado." };
  if (order.payment_status !== "paid") {
    return { ok: false, error: "Solo pedidos pagados pueden marcarse entregados." };
  }
  if (order.fulfillment_status !== "ready_for_pickup") {
    return {
      ok: false,
      error: "El pedido debe estar listo para recoger antes de marcarlo entregado.",
    };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      fulfillment_status: "delivered",
      delivered_at: now,
      fulfillment_updated_by: user.id,
    })
    .eq("id", orderId)
    .eq("fulfillment_status", "ready_for_pickup");

  if (updateError) return { ok: false, error: updateError.message };

  await insertFulfillmentHistory(supabase, orderId, user.id, "Pedido entregado");

  if (order.user_id) {
    notifyCustomer({
      userId: order.user_id,
      type: "order_delivered",
      title: "Pedido entregado",
      message: `Tu pedido ${order.order_number} fue marcado como entregado.`,
      href: `/cuenta/pedidos/${orderId}`,
      orderId,
      metadata: { order_number: order.order_number },
    });
  }

  revalidateOrderPaths(orderId);
  return { ok: true };
}
