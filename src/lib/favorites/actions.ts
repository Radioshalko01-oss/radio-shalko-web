"use server";

/**
 * Server Actions de favoritos · Fase 3 (persistencia real).
 *
 * Reglas:
 *   - Usan el cliente server con sesión (@/lib/supabase/server).
 *   - La RLS de public.favorites (favorites_*_own) garantiza que cada usuario
 *     solo lee/escribe sus propias filas (auth.uid() = user_id).
 *   - Sin sesión → operaciones no-op (los invitados usan localStorage).
 *   - Evita duplicados vía PK (user_id, product_id) + upsert ignoreDuplicates.
 */
import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sanitizeIds(ids: string[]): string[] {
  return Array.from(new Set(ids.filter((id) => UUID_RE.test(id))));
}

/** Lista los ids de productos favoritos del usuario (vacío si no hay sesión). */
export async function getFavoriteIds(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data ?? []).map((r) => r.product_id);
}

/** Agrega un favorito (idempotente). */
export async function addFavorite(
  productId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!UUID_RE.test(productId)) {
    return { ok: false, error: "Identificador de producto inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no encontrada." };

  const { error } = await supabase
    .from("favorites")
    .upsert(
      { user_id: user.id, product_id: productId },
      { onConflict: "user_id,product_id", ignoreDuplicates: true },
    );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Quita un favorito. */
export async function removeFavorite(
  productId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!UUID_RE.test(productId)) {
    return { ok: false, error: "Identificador de producto inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no encontrada." };

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Fusiona favoritos locales (localStorage) → Supabase al iniciar sesión y
 * devuelve la lista final de ids. Solo inserta ids que correspondan a
 * productos existentes (evita errores de FK). Idempotente.
 */
export async function syncFavorites(localIds: string[]): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const ids = sanitizeIds(localIds);
  if (ids.length) {
    // Solo ids de productos reales (la PK + FK evitan duplicados/huérfanos).
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .in("id", ids);
    const validIds = (existing ?? []).map((r) => r.id);

    if (validIds.length) {
      await supabase.from("favorites").upsert(
        validIds.map((product_id) => ({ user_id: user.id, product_id })),
        { onConflict: "user_id,product_id", ignoreDuplicates: true },
      );
    }
  }

  return getFavoriteIds();
}
