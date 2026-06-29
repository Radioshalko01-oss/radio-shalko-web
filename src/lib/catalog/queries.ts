import { createClient } from "@/lib/supabase/server";
import {
  PRODUCT_SELECT,
  mapProduct,
  mapBrand,
  mapCategory,
  mapSubcategory,
  type RawProduct,
  type RawBrand,
  type RawCategory,
  type RawSubcategory,
} from "./mappers";
import type {
  CatalogBrand,
  CatalogCategoryTree,
  CatalogProduct,
} from "./types";

export type CatalogFilters = {
  categorySlug?: string;
  subcategorySlug?: string;
  brandSlug?: string;
  q?: string;
  /** Incluir borradores (solo contextos admin; RLS también lo restringe). */
  includeUnpublished?: boolean;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Resuelve un slug de taxonomía a su id; null si no existe. */
async function resolveId(
  supabase: SupabaseServerClient,
  table: "categories" | "subcategories" | "brands",
  slug: string,
): Promise<string | null> {
  const { data } = await supabase
    .from(table)
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Lista de productos del catálogo. Por defecto solo publicados.
 * Filtros opcionales por categoría, subcategoría, marca (por slug) y texto.
 */
export async function getCatalogProducts(
  filters: CatalogFilters = {},
): Promise<CatalogProduct[]> {
  const supabase = await createClient();

  let query = supabase.from("products").select(PRODUCT_SELECT);

  if (!filters.includeUnpublished) {
    query = query.eq("is_published", true);
  }

  if (filters.categorySlug) {
    const id = await resolveId(supabase, "categories", filters.categorySlug);
    if (!id) return [];
    query = query.eq("category_id", id);
  }

  if (filters.subcategorySlug) {
    const id = await resolveId(supabase, "subcategories", filters.subcategorySlug);
    if (!id) return [];
    query = query.eq("subcategory_id", id);
  }

  if (filters.brandSlug) {
    const id = await resolveId(supabase, "brands", filters.brandSlug);
    if (!id) return [];
    query = query.eq("brand_id", id);
  }

  if (filters.q?.trim()) {
    query = query.ilike("title", `%${filters.q.trim()}%`);
  }

  const { data, error } = await query.order("title", { ascending: true });
  if (error || !data) return [];

  return (data as unknown as RawProduct[]).map(mapProduct);
}

/** Un producto por slug (solo publicado). null si no existe o es borrador. */
export async function getProductBySlug(
  slug: string,
): Promise<CatalogProduct | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return null;
  return mapProduct(data as unknown as RawProduct);
}

/**
 * Productos por lista de ids (publicados), preservando el orden recibido.
 * Pensado para favoritos y cotización.
 */
export async function getProductsByIds(
  ids: string[],
): Promise<CatalogProduct[]> {
  if (!ids.length) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", ids)
    .eq("is_published", true);

  if (error || !data) return [];

  const products = (data as unknown as RawProduct[]).map(mapProduct);
  const byId = new Map(products.map((p) => [p.id, p]));
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is CatalogProduct => p !== undefined);
}

/**
 * Productos relacionados. Prioriza vínculos manuales en related_products;
 * si no hay, cae a misma subcategoría (o marca) excluyendo el propio.
 */
export async function getRelatedProducts(
  productId: string,
  options: { limit?: number } = {},
): Promise<CatalogProduct[]> {
  const limit = options.limit ?? 4;
  const supabase = await createClient();

  // 1) Vínculos manuales.
  const { data: links } = await supabase
    .from("related_products")
    .select("related_product_id")
    .eq("product_id", productId);

  const relatedIds = (links ?? []).map((r) => r.related_product_id);
  if (relatedIds.length) {
    const products = await getProductsByIds(relatedIds);
    return products.slice(0, limit);
  }

  // 2) Fallback algorítmico: misma subcategoría, si no por marca.
  const { data: base } = await supabase
    .from("products")
    .select("subcategory_id, brand_id")
    .eq("id", productId)
    .maybeSingle();

  if (!base) return [];

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_published", true)
    .neq("id", productId);

  if (base.subcategory_id) {
    query = query.eq("subcategory_id", base.subcategory_id);
  } else if (base.brand_id) {
    query = query.eq("brand_id", base.brand_id);
  } else {
    return [];
  }

  const { data, error } = await query.limit(limit);
  if (error || !data) return [];

  return (data as unknown as RawProduct[]).map(mapProduct);
}

/** Árbol de categorías con subcategorías anidadas (menús/filtros). */
export async function getCategoriesTree(): Promise<CatalogCategoryTree[]> {
  const supabase = await createClient();

  const [{ data: cats }, { data: subs }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("sort_order"),
    supabase
      .from("subcategories")
      .select("id, name, slug, category_id")
      .order("sort_order"),
  ]);

  if (!cats) return [];

  const subsByCategory = new Map<string, RawSubcategory[]>();
  for (const s of (subs ?? []) as RawSubcategory[]) {
    if (!s?.category_id) continue;
    const list = subsByCategory.get(s.category_id) ?? [];
    list.push(s);
    subsByCategory.set(s.category_id, list);
  }

  return (cats as RawCategory[])
    .map((c) => {
      const category = mapCategory(c);
      if (!category) return null;
      const subcategories = (subsByCategory.get(category.id) ?? [])
        .map(mapSubcategory)
        .filter((x): x is NonNullable<ReturnType<typeof mapSubcategory>> => x !== null);
      return { ...category, subcategories } satisfies CatalogCategoryTree;
    })
    .filter((x): x is CatalogCategoryTree => x !== null);
}

/**
 * Nombres de taxonomía activa (categorías y subcategorías con is_active=true).
 * Se usa para filtrar las superficies públicas (menú/filtros) que derivan la
 * taxonomía de los productos, sin alterar el listado de productos en sí.
 */
export async function getActiveTaxonomyNames(): Promise<{
  categoryNames: string[];
  subcategoryNames: string[];
}> {
  const supabase = await createClient();

  const [{ data: cats }, { data: subs }] = await Promise.all([
    supabase.from("categories").select("name").eq("is_active", true),
    supabase.from("subcategories").select("name").eq("is_active", true),
  ]);

  return {
    categoryNames: ((cats ?? []) as { name: string }[]).map((c) => c.name),
    subcategoryNames: ((subs ?? []) as { name: string }[]).map((s) => s.name),
  };
}

/**
 * Marcas ordenadas. Por defecto devuelve todas (admin/formulario de producto).
 * Pasa `{ activeOnly: true }` en superficies públicas para excluir ocultas.
 */
export async function getBrands(
  opts: { activeOnly?: boolean } = {},
): Promise<CatalogBrand[]> {
  const supabase = await createClient();

  let query = supabase
    .from("brands")
    .select("id, name, slug, logo_url")
    .order("sort_order")
    .order("name");

  if (opts.activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;

  if (error || !data) return [];

  return (data as RawBrand[])
    .map(mapBrand)
    .filter((b): b is CatalogBrand => b !== null);
}
