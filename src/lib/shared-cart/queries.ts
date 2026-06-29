/**
 * Carritos compartidos · lectura pública por token.
 */
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_SELECT, mapProduct, type RawProduct } from "@/lib/catalog/mappers";
import type { CatalogProduct } from "@/lib/catalog/types";

export type SharedCartItemView = {
  productId: string;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
  product: CatalogProduct | null;
};

export type SharedCartView = {
  token: string;
  saleLabel: string | null;
  branchName: string | null;
  createdAt: string;
  expiresAt: string;
  items: SharedCartItemView[];
};

/** Carrito compartido vigente por token; null si no existe o expiró. */
export async function getSharedCartByToken(
  token: string,
): Promise<SharedCartView | null> {
  const trimmed = token.trim();
  if (!trimmed || trimmed.length > 128) return null;

  const supabase = await createClient();

  const { data: cart, error } = await supabase
    .from("shared_carts")
    .select("id, token, sale_label, branch_name, created_at, expires_at")
    .eq("token", trimmed)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !cart) return null;

  const { data: rows, error: itemsError } = await supabase
    .from("shared_cart_items")
    .select("product_id, quantity, unit_price, sort_order")
    .eq("shared_cart_id", cart.id)
    .order("sort_order", { ascending: true });

  if (itemsError || !rows?.length) {
    return {
      token: cart.token,
      saleLabel: cart.sale_label,
      branchName: cart.branch_name,
      createdAt: cart.created_at,
      expiresAt: cart.expires_at,
      items: [],
    };
  }

  const productIds = rows.map((r) => r.product_id);
  const { data: products } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", productIds)
    .eq("is_published", true);

  const productMap = new Map(
    (products as unknown as RawProduct[] | null)?.map((raw) => {
      const p = mapProduct(raw);
      return [p.id, p] as const;
    }) ?? [],
  );

  const items: SharedCartItemView[] = rows.map((row) => ({
    productId: row.product_id,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    sortOrder: row.sort_order,
    product: productMap.get(row.product_id) ?? null,
  }));

  return {
    token: cart.token,
    saleLabel: cart.sale_label,
    branchName: cart.branch_name,
    createdAt: cart.created_at,
    expiresAt: cart.expires_at,
    items: items.filter((i) => i.product !== null),
  };
}
