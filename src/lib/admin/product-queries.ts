/**
 * Capa de datos admin · D1.1 (solo lectura).
 *
 * Acceso a productos desde el panel de administración. A diferencia de
 * `src/lib/catalog`, aquí SÍ se incluyen borradores (is_published=false):
 * la RLS `products_select_public` permite a un admin ver todos los productos,
 * y a un no-admin solo los publicados (defensa adicional).
 *
 * Son lecturas puras (no Server Actions). La protección de rol vive en el
 * layout/acciones que las invocan (`requireAdmin`).
 */
import { createClient } from "@/lib/supabase/server";
import {
  PRODUCT_SELECT,
  mapBranch,
  mapProduct,
  type RawBranch,
  type RawProduct,
} from "@/lib/catalog/mappers";
import type { CatalogBranch, CatalogProduct } from "@/lib/catalog/types";

export type AdminProductFilters = {
  /** Texto libre sobre el título del producto. */
  q?: string;
  /** Filtrar por estado de publicación; omitir = todos. */
  published?: boolean;
};

/**
 * Lista de productos para el panel admin (incluye borradores).
 * Ordenados por título ascendente.
 */
export async function listAdminProducts(
  filters: AdminProductFilters = {},
): Promise<CatalogProduct[]> {
  const supabase = await createClient();

  let query = supabase.from("products").select(PRODUCT_SELECT);

  if (typeof filters.published === "boolean") {
    query = query.eq("is_published", filters.published);
  }

  if (filters.q?.trim()) {
    query = query.ilike("title", `%${filters.q.trim()}%`);
  }

  const { data, error } = await query.order("title", { ascending: true });
  if (error || !data) return [];

  return (data as unknown as RawProduct[]).map(mapProduct);
}

// ─────────────────── PRO-1 · Listado profesional paginado ───────────────────

export type AdminProductSort =
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc"
  | "stock_asc"
  | "stock_desc"
  | "recent";

export type AdminProductListFilters = {
  q?: string;
  brandId?: string;
  categoryId?: string;
  subcategoryId?: string;
  /** true = publicados, false = ocultos, undefined = todos. */
  published?: boolean;
  /** "in" = con stock, "out" = sin stock, undefined = todos. */
  stock?: "in" | "out";
  sort?: AdminProductSort;
  page?: number;
  perPage?: number;
};

export type AdminProductListResult = {
  items: CatalogProduct[];
  total: number;
  page: number;
  perPage: number;
};

const PER_PAGE_OPTIONS = [25, 50, 100] as const;

function stockOf(p: CatalogProduct): number {
  return p.inventory.reduce((sum, i) => sum + i.quantity, 0);
}

/**
 * Listado admin con filtros, orden y paginación.
 *
 * Estrategia de escalabilidad: cuando el orden/filtro NO depende del stock
 * (que es agregado de product_inventory), se filtra, ordena y pagina en la base
 * de datos (camino rápido). Para stock con/sin y orden por stock se hace en
 * memoria sobre el conjunto ya filtrado por la base (suficiente para el volumen
 * actual; documentado como punto de evolución a vista/RPC si crece mucho).
 */
export async function listAdminProductsPaged(
  filters: AdminProductListFilters = {},
): Promise<AdminProductListResult> {
  const supabase = await createClient();

  const perPage = (PER_PAGE_OPTIONS as readonly number[]).includes(filters.perPage ?? 0)
    ? (filters.perPage as number)
    : 25;
  const page = Math.max(1, filters.page ?? 1);
  const sort = filters.sort ?? "name_asc";
  const inMemory =
    filters.stock === "in" || filters.stock === "out" || sort === "stock_asc" || sort === "stock_desc";

  // Búsqueda: título + SKU + nombre de marca (resolviendo ids de marca).
  const term = filters.q?.trim();
  const safeTerm = term ? term.replace(/[,()*%]/g, " ").trim() : "";
  let orStr: string | null = null;
  if (safeTerm) {
    const { data: bm } = await supabase.from("brands").select("id").ilike("name", `%${safeTerm}%`);
    const brandIds = (bm ?? []).map((b) => b.id as string);
    const parts = [`title.ilike.*${safeTerm}*`, `sku.ilike.*${safeTerm}*`];
    if (brandIds.length) parts.push(`brand_id.in.(${brandIds.join(",")})`);
    orStr = parts.join(",");
  }

  // Columna/dirección de orden a nivel DB (stock se reordena en memoria).
  let orderCol: "title" | "price" | "created_at" = "title";
  let orderAsc = true;
  if (sort === "name_desc") orderAsc = false;
  else if (sort === "price_asc") orderCol = "price";
  else if (sort === "price_desc") {
    orderCol = "price";
    orderAsc = false;
  } else if (sort === "recent") {
    orderCol = "created_at";
    orderAsc = false;
  }

  // Builder con filtros (mismo tipo encadenable, reasignable).
  let q = supabase.from("products").select(PRODUCT_SELECT, { count: "exact" });
  if (typeof filters.published === "boolean") q = q.eq("is_published", filters.published);
  if (filters.brandId) q = q.eq("brand_id", filters.brandId);
  if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
  if (filters.subcategoryId) q = q.eq("subcategory_id", filters.subcategoryId);
  if (orStr) q = q.or(orStr);

  if (!inMemory) {
    const from = (page - 1) * perPage;
    const { data, count, error } = await q
      .order(orderCol, { ascending: orderAsc })
      .range(from, from + perPage - 1);
    if (error || !data) return { items: [], total: 0, page, perPage };
    return {
      items: (data as unknown as RawProduct[]).map(mapProduct),
      total: count ?? 0,
      page,
      perPage,
    };
  }

  // Camino en memoria (filtro/orden por stock).
  const { data, error } = await q.order(orderCol, { ascending: orderAsc });
  if (error || !data) return { items: [], total: 0, page, perPage };

  let items = (data as unknown as RawProduct[]).map(mapProduct);
  if (filters.stock === "in") items = items.filter((p) => stockOf(p) > 0);
  if (filters.stock === "out") items = items.filter((p) => stockOf(p) <= 0);
  if (sort === "stock_asc") items.sort((a, b) => stockOf(a) - stockOf(b));
  if (sort === "stock_desc") items.sort((a, b) => stockOf(b) - stockOf(a));

  const total = items.length;
  const from = (page - 1) * perPage;
  return { items: items.slice(from, from + perPage), total, page, perPage };
}

/**
 * Un producto por id (UUID), sin filtrar por estado de publicación.
 * Pensado para precargar el formulario de edición. null si no existe.
 */
export async function getAdminProductById(
  id: string,
): Promise<CatalogProduct | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapProduct(data as unknown as RawProduct);
}

/**
 * Sucursales activas, ordenadas. Usadas para los campos de stock por sucursal
 * en el formulario de producto.
 */
export async function getBranches(): Promise<CatalogBranch[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("branches")
    .select("id, slug, name, display_name, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  return (data as RawBranch[])
    .map(mapBranch)
    .filter((b): b is CatalogBranch => b !== null);
}
