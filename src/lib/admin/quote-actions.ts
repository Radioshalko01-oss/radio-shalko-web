"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { QUOTE_STATUSES } from "./quote-constants";

export type ActionResult = { ok: true } | { ok: false; error: string };

const statusSchema = z.enum(QUOTE_STATUSES);
const uuidSchema = z.string().uuid("Identificador inválido.");

/** Actualiza el estado de una cotización (admin). */
export async function updateQuoteStatus(
  quoteId: string,
  status: string,
): Promise<ActionResult> {
  await requireAdmin();

  if (!uuidSchema.safeParse(quoteId).success) {
    return { ok: false, error: "Identificador de cotización inválido." };
  }
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) {
    return { ok: false, error: "Estado inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update({ status: parsed.data })
    .eq("id", quoteId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/cotizaciones");
  return { ok: true };
}
