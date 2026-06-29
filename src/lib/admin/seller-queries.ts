/**
 * Capa de datos · CART-2 (modo vendedor / tablet).
 *
 * Productos publicados con stock agregado para el POS en tienda.
 * Solo admin (requireAdmin); lecturas vía cliente server + RLS.
 */
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_SELECT, mapProduct, type RawProduct } from "@/lib/catalog/mappers";
import { requireAdmin } from "@/lib/auth/require-admin";

export type SellerProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  image: string | null;
  brandId: string | null;
  brandName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  totalStock: number;
  /** Cantidad por branch.id (product_inventory). */
  byBranch: Record<string, number>;
};

/** Todos los productos publicados con stock total (filtrado en cliente en el POS). */
export async function listSellerProducts(): Promise<SellerProduct[]> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_published", true)
    .order("title", { ascending: true });

  if (error || !data) return [];

  return (data as unknown as RawProduct[]).map(mapProduct).map((p) => {
    const byBranch: Record<string, number> = {};
    for (const inv of p.inventory) {
      byBranch[inv.branch.id] = inv.quantity;
    }
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      price: p.price,
      image: p.images[0]?.url ?? null,
      brandId: p.brand?.id ?? null,
      brandName: p.brand?.name ?? null,
      categoryId: p.category?.id ?? null,
      categoryName: p.category?.name ?? null,
      totalStock: p.inventory.reduce((sum, inv) => sum + inv.quantity, 0),
      byBranch,
    };
  });
}
