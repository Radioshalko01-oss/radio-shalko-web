/**
 * Capa de datos admin · PRO-2 (inventario global, solo lectura).
 *
 * Reutiliza products + product_inventory + branches vía PRODUCT_SELECT/mapProduct.
 * El stock por sucursal y total son agregados de product_inventory, por lo que el
 * filtrado/orden por stock se resuelve en memoria sobre el conjunto ya filtrado en
 * la base (suficiente para el volumen actual; evolucionable a vista/RPC si crece).
 */
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_SELECT, mapProduct, type RawProduct } from "@/lib/catalog/mappers";
import { LOW_STOCK_THRESHOLD } from "./inventory-constants";

export { LOW_STOCK_THRESHOLD };

export type InventoryStockFilter = "in" | "out" | "low";

export type InventoryItem = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  isPublished: boolean;
  image: string | null;
  brandName: string | null;
  categoryName: string | null;
  subcategoryName: string | null;
  total: number;
  /** Cantidad por sucursal, indexada por branch.id. */
  byBranch: Record<string, number>;
};

export type InventoryFilters = {
  q?: string;
  categoryId?: string;
  subcategoryId?: string;
  brandId?: string;
  published?: boolean;
  stock?: InventoryStockFilter;
  /** Si se indica, el filtro de stock se evalúa sobre esta sucursal. */
  branchId?: string;
  /** "name" | "total" | "price" | "recent" | "b_<branchId>". */
  sort?: string;
  page?: number;
  perPage?: number;
};

export type InventoryResult = {
  items: InventoryItem[];
  total: number;
  page: number;
  perPage: number;
};

const PER_PAGE_OPTIONS = [25, 50, 100] as const;

export async function listInventory(filters: InventoryFilters = {}): Promise<InventoryResult> {
  const supabase = await createClient();

  const perPage = (PER_PAGE_OPTIONS as readonly number[]).includes(filters.perPage ?? 0)
    ? (filters.perPage as number)
    : 25;
  const page = Math.max(1, filters.page ?? 1);
  const sort = filters.sort ?? "name";

  // Búsqueda: título + SKU + nombre de marca.
  const term = filters.q?.trim();
  const safe = term ? term.replace(/[,()*%]/g, " ").trim() : "";
  let orStr: string | null = null;
  if (safe) {
    const { data: bm } = await supabase.from("brands").select("id").ilike("name", `%${safe}%`);
    const ids = (bm ?? []).map((b) => b.id as string);
    const parts = [`title.ilike.*${safe}*`, `sku.ilike.*${safe}*`];
    if (ids.length) parts.push(`brand_id.in.(${ids.join(",")})`);
    orStr = parts.join(",");
  }

  let q = supabase.from("products").select(PRODUCT_SELECT);
  if (typeof filters.published === "boolean") q = q.eq("is_published", filters.published);
  if (filters.brandId) q = q.eq("brand_id", filters.brandId);
  if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
  if (filters.subcategoryId) q = q.eq("subcategory_id", filters.subcategoryId);
  if (orStr) q = q.or(orStr);

  const baseOrderCol = sort === "recent" ? "created_at" : "title";
  const { data, error } = await q.order(baseOrderCol, { ascending: sort !== "recent" });
  if (error || !data) return { items: [], total: 0, page, perPage };

  let items: InventoryItem[] = (data as unknown as RawProduct[]).map(mapProduct).map((p) => {
    const byBranch: Record<string, number> = {};
    for (const inv of p.inventory) byBranch[inv.branch.id] = inv.quantity;
    const total = p.inventory.reduce((s, i) => s + i.quantity, 0);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      price: p.price,
      isPublished: p.isPublished,
      image: p.images[0]?.url ?? null,
      brandName: p.brand?.name ?? null,
      categoryName: p.category?.name ?? null,
      subcategoryName: p.subcategory?.name ?? null,
      total,
      byBranch,
    };
  });

  // Filtro de stock (en el ámbito de una sucursal si se indicó branchId).
  const scope = (it: InventoryItem) =>
    filters.branchId ? it.byBranch[filters.branchId] ?? 0 : it.total;
  if (filters.stock === "in") items = items.filter((it) => scope(it) > 0);
  else if (filters.stock === "out") items = items.filter((it) => scope(it) <= 0);
  else if (filters.stock === "low")
    items = items.filter((it) => {
      const v = scope(it);
      return v > 0 && v <= LOW_STOCK_THRESHOLD;
    });

  // Orden (recent conserva el orden de la base).
  if (sort === "name") items.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "total") items.sort((a, b) => a.total - b.total);
  else if (sort === "price") items.sort((a, b) => a.price - b.price);
  else if (sort.startsWith("b_")) {
    const bid = sort.slice(2);
    items.sort((a, b) => (a.byBranch[bid] ?? 0) - (b.byBranch[bid] ?? 0));
  }

  const total = items.length;
  const from = (page - 1) * perPage;
  return { items: items.slice(from, from + perPage), total, page, perPage };
}
