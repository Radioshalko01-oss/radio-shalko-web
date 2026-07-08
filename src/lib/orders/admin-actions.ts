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
import { notifyCustomerPickupReady } from "@/lib/notifications/customer-pickup-email";
import { notifyCustomer } from "@/lib/notifications/customer-notifications";
import { logAdminAudit } from "@/lib/admin/audit-log";

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

  void logAdminAudit({
    actorId: user.id,
    action: "order.availability_review_submitted",
    entity: "order",
    entityId: orderId,
    metadata: {
      order_id: orderId,
      order_number: order.order_number,
      previous_status: order.status,
      new_status: newStatus,
      payment_status: "unpaid",
      availability_decision: decision,
      pickup_available_date: dateResult.date,
      reviewed_at: reviewedAt,
    },
  });

  if (!isUnavailable && order.user_id) {
    notifyCustomer({
      userId: order.user_id,
      type: "order_approved",
      title: "Tu solicitud fue aprobada",
      message: `Tu solicitud ${order.order_number} fue aprobada. Te compartiremos las instrucciones de pago oficiales.`,
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

const MANUAL_PAYMENT_METHODS = ["bank_transfer", "pay_in_store"] as const;
const MANUAL_STORE_LOCATIONS = ["chalco", "amecameca"] as const;

const manualPaymentSchema = z
  .object({
    orderId: uuidSchema,
    paymentMethod: z.enum(MANUAL_PAYMENT_METHODS),
    storeLocation: z.enum(MANUAL_STORE_LOCATIONS).optional(),
    paymentReference: z.string().trim().optional(),
    adminNote: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === "pay_in_store" && !data.storeLocation) {
      ctx.addIssue({
        code: "custom",
        message: "Selecciona la tienda donde se realizó el pago presencial.",
        path: ["storeLocation"],
      });
    }
  });

function manualPaymentHistoryNote(
  methodLabel: string,
  paymentReference?: string,
  adminNote?: string,
): string {
  let note = `Pago validado manualmente por admin. Método: ${methodLabel}`;
  if (paymentReference?.trim()) {
    note += `. Referencia: ${paymentReference.trim()}`;
  }
  if (adminNote?.trim()) {
    note += `. Nota: ${adminNote.trim()}`;
  }
  return note;
}

function manualPaymentMethodLabel(
  paymentMethod: (typeof MANUAL_PAYMENT_METHODS)[number],
  storeLocation?: (typeof MANUAL_STORE_LOCATIONS)[number],
): string {
  if (paymentMethod === "bank_transfer") return "Transferencia bancaria";
  if (storeLocation === "chalco") return "Pago presencial Chalco";
  if (storeLocation === "amecameca") return "Pago presencial Amecameca";
  return "Pago presencial en tienda";
}

/**
 * Registra pago manual validado por admin (transferencia o tienda) · C.1.
 */
export async function registerManualPaymentForOrder(input: {
  orderId: string;
  paymentMethod: string;
  storeLocation?: string;
  paymentReference?: string;
  adminNote?: string;
}): Promise<ActionResult> {
  const user = await requireAdmin();

  const parsed = manualPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { orderId, paymentMethod, storeLocation, paymentReference, adminNote } = parsed.data;
  const supabase = await createClient();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, order_number, user_id, status, payment_status")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchError) return { ok: false, error: fetchError.message };
  if (!order) return { ok: false, error: "Pedido no encontrado." };

  if (order.status === "cancelled") {
    return { ok: false, error: "No se puede validar pago en un pedido cancelado." };
  }
  if (order.payment_status === "paid") {
    return { ok: false, error: "Este pedido ya tiene el pago registrado." };
  }
  if (order.status !== "confirmed") {
    return {
      ok: false,
      error: "Solo pedidos aprobados pueden registrar pago manual.",
    };
  }

  const methodLabel = manualPaymentMethodLabel(paymentMethod, storeLocation);
  const paidAt = new Date().toISOString();
  const historyNote = manualPaymentHistoryNote(methodLabel, paymentReference, adminNote);

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      payment_method: paymentMethod,
      stripe_paid_at: paidAt,
    })
    .eq("id", orderId)
    .eq("payment_status", "unpaid")
    .eq("status", "confirmed");

  if (updateError) return { ok: false, error: updateError.message };

  const { error: historyError } = await supabase.from("order_status_history").insert({
    order_id: orderId,
    actor_id: user.id,
    from_status: order.status,
    to_status: order.status,
    note: historyNote,
  });

  if (historyError) {
    console.error("[registerManualPaymentForOrder] history insert:", historyError.message);
  }

  void logAdminAudit({
    actorId: user.id,
    action: "order.manual_payment_registered",
    entity: "order",
    entityId: orderId,
    metadata: {
      order_id: orderId,
      order_number: order.order_number,
      payment_method: paymentMethod,
      store_location: storeLocation ?? null,
      payment_reference: paymentReference?.trim() || null,
    },
  });

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

  revalidateOrderPaths(orderId);
  return { ok: true };
}

export type CreateStripeCheckoutResult =
  | { ok: true; url: string; reused: boolean }
  | { ok: false; error: string };

/**
 * Genera (o reutiliza) Stripe Checkout Session para pedido aprobado · SALES-6.
 * C.1: deshabilitado — los pagos manuales reemplazan la generación de enlaces Stripe.
 */
export async function createStripeCheckoutForOrder(
  orderId: string,
): Promise<CreateStripeCheckoutResult> {
  await requireAdmin();
  void orderId;

  return {
    ok: false,
    error:
      "Los pagos con tarjeta no están disponibles. Usa transferencia bancaria o pago presencial en tienda.",
  };
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
