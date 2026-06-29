/**
 * Notificaciones internas del cliente · SALES-7.2.
 * Escritura vía service role; lectura vía RLS del usuario.
 */
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export const CUSTOMER_NOTIFICATION_TYPES = [
  "order_created",
  "order_approved",
  "payment_available",
  "payment_confirmed",
  "order_preparing",
  "order_ready_for_pickup",
  "order_delivered",
  "cart_reminder",
] as const;

export type CustomerNotificationType = (typeof CUSTOMER_NOTIFICATION_TYPES)[number];

export type CreateCustomerNotificationInput = {
  userId: string;
  type: CustomerNotificationType;
  title: string;
  message: string;
  href?: string | null;
  orderId?: string | null;
  metadata?: Record<string, unknown>;
  /** Si true, no crea otra no leída del mismo type (+ orderId si aplica). */
  skipIfUnreadDuplicate?: boolean;
};

export type OrderNotificationSource = {
  id: string;
  order_number: string;
  user_id: string | null;
};

function orderHref(orderId: string): string {
  return `/cuenta/pedidos/${orderId}`;
}

async function hasUnreadDuplicate(
  userId: string,
  type: CustomerNotificationType,
  orderId?: string | null,
): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    let query = supabase
      .from("customer_notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", type)
      .is("read_at", null)
      .limit(1);

    if (orderId) query = query.eq("order_id", orderId);

    const { data } = await query;
    return (data?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

function revalidateNotificationPaths(href?: string | null) {
  revalidatePath("/cuenta");
  revalidatePath("/cuenta/notificaciones");
  if (href?.startsWith("/cuenta/pedidos/")) {
    revalidatePath(href);
  }
}

/** Crea notificación. Nunca lanza al caller. */
export async function createCustomerNotification(
  input: CreateCustomerNotificationInput,
): Promise<{ created: boolean; reason?: string }> {
  const userId = input.userId?.trim();
  if (!userId) return { created: false, reason: "no_user" };

  try {
    if (input.skipIfUnreadDuplicate !== false) {
      const dup = await hasUnreadDuplicate(userId, input.type, input.orderId);
      if (dup) return { created: false, reason: "duplicate" };
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("customer_notifications").insert({
      user_id: userId,
      type: input.type,
      title: input.title,
      message: input.message,
      href: input.href ?? null,
      order_id: input.orderId ?? null,
      metadata: input.metadata ?? {},
    });

    if (error) {
      console.warn("[createCustomerNotification]", error.message);
      return { created: false, reason: "insert_error" };
    }

    revalidateNotificationPaths(input.href);
    return { created: true };
  } catch (err) {
    console.warn("[createCustomerNotification]", err);
    return { created: false, reason: "exception" };
  }
}

/** Fire-and-forget seguro. */
export function notifyCustomer(input: CreateCustomerNotificationInput): void {
  void createCustomerNotification(input);
}

export async function createOrderNotification(
  order: OrderNotificationSource,
  type: CustomerNotificationType,
  opts?: { title?: string; message?: string },
): Promise<void> {
  if (!order.user_id) return;

  const orderNumber = order.order_number;
  const href = orderHref(order.id);

  const defaults: Record<
    CustomerNotificationType,
    { title: string; message: string } | null
  > = {
    order_created: {
      title: "Solicitud recibida",
      message: `Recibimos tu solicitud ${orderNumber}. Radio Shalko revisará la disponibilidad de tus productos.`,
    },
    order_approved: {
      title: "Tu solicitud fue aprobada",
      message: `Tu solicitud ${orderNumber} fue aprobada. Pronto estará disponible el pago.`,
    },
    payment_available: {
      title: "Pago disponible",
      message: `Tu pedido ${orderNumber} ya tiene pago disponible.`,
    },
    payment_confirmed: {
      title: "Pago confirmado",
      message: `Recibimos el pago de tu pedido ${orderNumber}.`,
    },
    order_preparing: {
      title: "Estamos preparando tu pedido",
      message: `Tu pedido ${orderNumber} está en preparación.`,
    },
    order_ready_for_pickup: {
      title: "Tu pedido está listo para recoger",
      message: `Tu pedido ${orderNumber} está listo para recoger en tienda.`,
    },
    order_delivered: {
      title: "Pedido entregado",
      message: `Tu pedido ${orderNumber} fue marcado como entregado.`,
    },
    cart_reminder: null,
  };

  const preset = defaults[type];
  if (!preset && !opts?.title) return;

  await createCustomerNotification({
    userId: order.user_id,
    type,
    title: opts?.title ?? preset!.title,
    message: opts?.message ?? preset!.message,
    href,
    orderId: order.id,
    metadata: { order_number: orderNumber },
  });
}

export async function createCartReminderNotification(userId: string): Promise<boolean> {
  const result = await createCustomerNotification({
    userId,
    type: "cart_reminder",
    title: "Tienes productos esperando en tu carrito",
    message:
      "Tus productos siguen guardados. Vuelve a revisarlos antes de que cambie la disponibilidad.",
    href: "/carrito",
    skipIfUnreadDuplicate: false,
  });
  return result.created;
}

/** Evita spam: ¿ya hubo cart_reminder en las últimas 24h? */
export async function hasRecentCartReminder(userId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const since = new Date();
    since.setHours(since.getHours() - 24);

    const { count } = await supabase
      .from("customer_notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "cart_reminder")
      .gte("created_at", since.toISOString());

    return (count ?? 0) > 0;
  } catch {
    return true;
  }
}
