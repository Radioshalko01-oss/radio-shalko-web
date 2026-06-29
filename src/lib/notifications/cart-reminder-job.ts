/**
 * Job de recordatorios de carrito · SALES-7.2.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createCartReminderNotification,
  hasRecentCartReminder,
} from "@/lib/notifications/customer-notifications";
import { notifyCustomerCartReminderEmail } from "@/lib/notifications/customer-email-events";

/** Horas sin actividad en carrito antes de considerar abandono. */
const CART_STALE_HOURS = 2;

/** No recordar si el usuario creó pedido recientemente. */
const RECENT_ORDER_HOURS = 24;

export type CartReminderJobResult = {
  scanned: number;
  created: number;
  skipped: number;
  errors: number;
};

export async function runCartReminderJob(): Promise<CartReminderJobResult> {
  const supabase = createAdminClient();
  const staleBefore = new Date();
  staleBefore.setHours(staleBefore.getHours() - CART_STALE_HOURS);

  const recentOrderBefore = new Date();
  recentOrderBefore.setHours(recentOrderBefore.getHours() - RECENT_ORDER_HOURS);

  const { data: drafts, error } = await supabase
    .from("quotes")
    .select("id, user_id, updated_at, quote_items ( id )")
    .eq("status", "draft")
    .lt("updated_at", staleBefore.toISOString());

  if (error) {
    console.error("[cart-reminder-job]", error.message);
    return { scanned: 0, created: 0, skipped: 0, errors: 1 };
  }

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const draft of drafts ?? []) {
    const itemCount = (draft.quote_items as Array<{ id: string }> | null)?.length ?? 0;
    if (itemCount === 0) {
      skipped++;
      continue;
    }

    const userId = draft.user_id;

    const { count: recentOrders } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", recentOrderBefore.toISOString());

    if ((recentOrders ?? 0) > 0) {
      skipped++;
      continue;
    }

    if (await hasRecentCartReminder(userId)) {
      skipped++;
      continue;
    }

    try {
      const ok = await createCartReminderNotification(userId);
      if (ok) {
        created++;
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        const email = authUser?.user?.email;
        const name =
          authUser?.user?.user_metadata?.full_name ??
          authUser?.user?.email?.split("@")[0] ??
          "Cliente";
        if (email) {
          void notifyCustomerCartReminderEmail({
            customerEmail: email,
            customerName: name,
            itemCount,
          });
        }
      } else skipped++;
    } catch {
      errors++;
    }
  }

  return {
    scanned: drafts?.length ?? 0,
    created,
    skipped,
    errors,
  };
}
