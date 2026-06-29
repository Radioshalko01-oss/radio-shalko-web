"use server";

/**
 * Server Actions · carritos compartidos (CART-5).
 * Creación solo admin; lectura pública vía queries + RLS.
 */
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { formatSaleLabel } from "@/lib/admin/seller-session";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SHARE_TTL_DAYS = 7;

export type CreateSharedCartLine = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export type CreateSharedCartInput = {
  lines: CreateSharedCartLine[];
  saleNumber?: number;
  branchLabel?: string | null;
};

export type CreateSharedCartResult =
  | { ok: true; token: string; url: string; expiresAt: string }
  | { ok: false; error: string };

function resolveSiteUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, "");
  return "https://radioshalko.com";
}

function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  const n = Math.floor(value);
  return n < 1 ? 1 : n;
}

/** Crea un carrito compartible desde el POS (solo admin). */
export async function createSharedCart(
  input: CreateSharedCartInput,
): Promise<CreateSharedCartResult> {
  const admin = await getAdminUser();
  if (!admin) {
    return { ok: false, error: "No autorizado." };
  }

  const lines = input.lines
    .filter(
      (l) =>
        l &&
        UUID_RE.test(l.productId) &&
        clampQuantity(l.quantity) >= 1 &&
        Number.isFinite(l.unitPrice) &&
        l.unitPrice >= 0,
    )
    .map((l) => ({
      productId: l.productId,
      quantity: clampQuantity(l.quantity),
      unitPrice: Math.round(l.unitPrice),
    }));

  if (!lines.length) {
    return { ok: false, error: "El carrito está vacío." };
  }

  const supabase = await createClient();

  const ids = [...new Set(lines.map((l) => l.productId))];
  const { data: published } = await supabase
    .from("products")
    .select("id")
    .in("id", ids)
    .eq("is_published", true);

  const validIds = new Set((published ?? []).map((p) => p.id));
  const validLines = lines.filter((l) => validIds.has(l.productId));

  if (!validLines.length) {
    return { ok: false, error: "No hay productos publicados para compartir." };
  }

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(
    Date.now() + SHARE_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const saleLabel =
    input.saleNumber != null ? formatSaleLabel(input.saleNumber) : null;

  const { data: cart, error: cartError } = await supabase
    .from("shared_carts")
    .insert({
      token,
      created_by: admin.id,
      sale_label: saleLabel,
      branch_name: input.branchLabel?.trim() || null,
      expires_at: expiresAt,
    })
    .select("id, token")
    .single();

  if (cartError || !cart) {
    return { ok: false, error: cartError?.message ?? "No se pudo crear el enlace." };
  }

  const { error: itemsError } = await supabase.from("shared_cart_items").insert(
    validLines.map((line, index) => ({
      shared_cart_id: cart.id,
      product_id: line.productId,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      sort_order: index,
    })),
  );

  if (itemsError) {
    return { ok: false, error: itemsError.message };
  }

  const url = `${resolveSiteUrl()}/carrito/s/${cart.token}`;

  revalidatePath(`/carrito/s/${cart.token}`);

  return { ok: true, token: cart.token, url, expiresAt };
}
