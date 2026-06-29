/**
 * Contadores operativos de pedidos · SALES-5 (admin only).
 * RLS: orders_select_admin.
 */
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/auth/is-admin";
import { requireAdmin } from "@/lib/auth/require-admin";

export type AdminOrderNotificationSummary = {
  pendingCount: number;
  approvedAwaitingPaymentCount: number;
  cancelledCount: number;
  recentTotal: number;
};

const RECENT_DAYS = 30;

function recentCutoffIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - RECENT_DAYS);
  return d.toISOString();
}

export async function getAdminOrderNotificationSummary(): Promise<AdminOrderNotificationSummary> {
  await requireAdmin();
  const supabase = await createClient();
  const recentFrom = recentCutoffIso();

  const [pending, approved, cancelled, recent] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("payment_status", "unpaid"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed")
      .eq("payment_status", "unpaid"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "cancelled"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", recentFrom),
  ]);

  return {
    pendingCount: pending.count ?? 0,
    approvedAwaitingPaymentCount: approved.count ?? 0,
    cancelledCount: cancelled.count ?? 0,
    recentTotal: recent.count ?? 0,
  };
}

/**
 * Indicador operativo para header del sitio (admin navegando fuera de /admin).
 * No redirige: devuelve false si no hay sesión admin.
 */
export async function getAdminHeaderOrderAttention(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const admin = await isAdminUser(supabase, user.id);
  if (!admin) return false;

  const [pending, approved] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("payment_status", "unpaid"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed")
      .eq("payment_status", "unpaid"),
  ]);

  return (pending.count ?? 0) > 0 || (approved.count ?? 0) > 0;
}
