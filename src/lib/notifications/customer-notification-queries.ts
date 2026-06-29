/**
 * Consultas de notificaciones del cliente · SALES-7.2.
 */
import { createClient } from "@/lib/supabase/server";

export type CustomerNotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  orderId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type CustomerNotificationSummary = {
  unreadCount: number;
  totalCount: number;
};

type RawNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  order_id: string | null;
  read_at: string | null;
  created_at: string;
};

function mapNotification(row: RawNotification): CustomerNotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    href: row.href,
    orderId: row.order_id,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function getCustomerNotificationSummary(): Promise<CustomerNotificationSummary | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [unread, total] = await Promise.all([
    supabase
      .from("customer_notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
    supabase
      .from("customer_notifications")
      .select("id", { count: "exact", head: true }),
  ]);

  return {
    unreadCount: unread.count ?? 0,
    totalCount: total.count ?? 0,
  };
}

export async function listCustomerNotifications(
  limit = 50,
): Promise<CustomerNotificationItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("customer_notifications")
    .select("id, type, title, message, href, order_id, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[listCustomerNotifications]", error.message);
    return [];
  }

  return ((data ?? []) as RawNotification[]).map(mapNotification);
}
