"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type NotificationActionResult = { ok: true } | { ok: false; error: string };

export async function markNotificationAsRead(
  notificationId: string,
): Promise<NotificationActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Debes iniciar sesión." };

  const { error } = await supabase
    .from("customer_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/cuenta");
  revalidatePath("/cuenta/notificaciones");
  return { ok: true };
}

export async function markAllNotificationsAsRead(): Promise<NotificationActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Debes iniciar sesión." };

  const { error } = await supabase
    .from("customer_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/cuenta");
  revalidatePath("/cuenta/notificaciones");
  return { ok: true };
}
