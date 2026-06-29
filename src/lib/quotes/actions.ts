"use server";

/**
 * Server Actions de cotizaciones · Fase 4 / 4.1 (carrito inteligente).
 *
 * Modelo: cada usuario tiene UNA cotización activa (status='draft'). Sus
 * productos viven en quote_items con quantity (>= 1).
 *
 * Reglas:
 *   - Cliente server con sesión (@/lib/supabase/server); nunca service role.
 *   - RLS quotes_*_own / quote_items_*_own garantiza aislamiento por usuario.
 *   - Sin sesión → no-op (los invitados usan localStorage).
 *   - Sin duplicados: se verifica antes de insertar y se deduplica al leer.
 */
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type QuoteItemDTO = { productId: string; quantity: number };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Normaliza una cantidad a entero >= 1. */
function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  const n = Math.floor(value);
  return n < 1 ? 1 : n;
}

function sanitizeItems(items: QuoteItemDTO[]): QuoteItemDTO[] {
  const map = new Map<string, number>();
  for (const it of items) {
    if (!it || !UUID_RE.test(it.productId)) continue;
    map.set(it.productId, clampQuantity(it.quantity));
  }
  return Array.from(map, ([productId, quantity]) => ({ productId, quantity }));
}

/** Devuelve el id del draft activo SIN crearlo (null si no existe). */
async function getDraftQuoteId(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("quotes")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "draft")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

/** Devuelve el draft activo, creándolo si no existe. */
async function getOrCreateDraftQuoteId(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<string | null> {
  const existing = await getDraftQuoteId(supabase, userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("quotes")
    .insert({ user_id: userId, status: "draft" })
    .select("id")
    .single();

  if (error) return null;
  return data?.id ?? null;
}

/** Líneas de la cotización activa (vacío si no hay sesión). */
export async function getQuoteItems(): Promise<QuoteItemDTO[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const draftId = await getDraftQuoteId(supabase, user.id);
  if (!draftId) return [];

  const { data, error } = await supabase
    .from("quote_items")
    .select("product_id, quantity")
    .eq("quote_id", draftId)
    .order("created_at", { ascending: true });

  if (error) return [];

  // Deduplica por producto (toma la primera aparición).
  const seen = new Set<string>();
  const items: QuoteItemDTO[] = [];
  for (const r of data ?? []) {
    if (seen.has(r.product_id)) continue;
    seen.add(r.product_id);
    items.push({ productId: r.product_id, quantity: clampQuantity(r.quantity) });
  }
  return items;
}

/** Agrega un producto a la cotización activa con cantidad 1 (idempotente). */
export async function addQuoteItem(
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

  const draftId = await getOrCreateDraftQuoteId(supabase, user.id);
  if (!draftId) return { ok: false, error: "No se pudo guardar el carrito." };

  const { data: already } = await supabase
    .from("quote_items")
    .select("id")
    .eq("quote_id", draftId)
    .eq("product_id", productId)
    .limit(1)
    .maybeSingle();
  if (already) return { ok: true };

  const { error } = await supabase
    .from("quote_items")
    .insert({ quote_id: draftId, product_id: productId, quantity: 1 });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Fija la cantidad de un producto (entero >= 1). Lo crea si no existe. */
export async function setQuoteItemQuantity(
  productId: string,
  quantity: number,
): Promise<{ ok: boolean; error?: string }> {
  if (!UUID_RE.test(productId)) {
    return { ok: false, error: "Identificador de producto inválido." };
  }
  const q = clampQuantity(quantity);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no encontrada." };

  const draftId = await getOrCreateDraftQuoteId(supabase, user.id);
  if (!draftId) return { ok: false, error: "No se pudo guardar el carrito." };

  const { data: existing } = await supabase
    .from("quote_items")
    .select("id")
    .eq("quote_id", draftId)
    .eq("product_id", productId)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("quote_items")
      .update({ quantity: q })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  const { error } = await supabase
    .from("quote_items")
    .insert({ quote_id: draftId, product_id: productId, quantity: q });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Quita un producto de la cotización activa (todas sus líneas). */
export async function removeQuoteItem(
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

  const draftId = await getDraftQuoteId(supabase, user.id);
  if (!draftId) return { ok: true };

  const { error } = await supabase
    .from("quote_items")
    .delete()
    .eq("quote_id", draftId)
    .eq("product_id", productId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Fusiona la cotización local (localStorage) → Supabase al iniciar sesión.
 * Solo inserta product_ids que existan y que aún no estén en el draft,
 * conservando su cantidad. Devuelve la lista final. Idempotente.
 */
export async function syncQuote(
  localItems: QuoteItemDTO[],
): Promise<QuoteItemDTO[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const items = sanitizeItems(localItems);
  if (!items.length) return getQuoteItems();

  const draftId = await getOrCreateDraftQuoteId(supabase, user.id);
  if (!draftId) return [];

  const ids = items.map((i) => i.productId);
  const { data: existingProducts } = await supabase
    .from("products")
    .select("id")
    .in("id", ids);
  const validIds = new Set((existingProducts ?? []).map((r) => r.id));
  if (!validIds.size) return getQuoteItems();

  const { data: currentItems } = await supabase
    .from("quote_items")
    .select("product_id")
    .eq("quote_id", draftId);
  const present = new Set((currentItems ?? []).map((r) => r.product_id));

  const toInsert = items.filter(
    (i) => validIds.has(i.productId) && !present.has(i.productId),
  );

  if (toInsert.length) {
    await supabase.from("quote_items").insert(
      toInsert.map((i) => ({
        quote_id: draftId,
        product_id: i.productId,
        quantity: i.quantity,
      })),
    );
  }

  return getQuoteItems();
}

/** Vacía el carrito activo (draft quote_items). No-op sin sesión. */
export async function clearQuoteCart(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: true };

  const draftId = await getDraftQuoteId(supabase, user.id);
  if (!draftId) return { ok: true };

  const { error } = await supabase.from("quote_items").delete().eq("quote_id", draftId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
