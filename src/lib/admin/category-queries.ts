/**
 * Capa de datos admin · CAT-4 (categorías y subcategorías, solo lectura).
 *
 * Incluye taxonomía oculta (is_active=false) y conteos de productos asociados.
 * Lecturas puras; la protección de rol vive en las acciones/layout que las usan.
 */
import { createClient } from "@/lib/supabase/server";
import { getOfficialCatalogTypeSubcategories } from "@/lib/navigation/catalog-taxonomy";
import { listAdminProducts } from "./product-queries";

/** Producto en forma ligera para el panel de categorías (detalle + asignación). */
export type CategorizableProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  isPublished: boolean;
  brandName: string | null;
  image: string | null;
  categoryId: string | null;
  categoryName: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
};

export type AdminSubcategory = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
  subcategories: AdminSubcategory[];
};

type RawCat = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

type RawSub = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
};

/**
 * Categorías (activas y ocultas) con sus subcategorías anidadas y el conteo de
 * productos asociados a cada nivel. Ordenado por sort_order y luego nombre.
 */
export async function listAdminCategories(): Promise<AdminCategory[]> {
  const supabase = await createClient();

  const [{ data: cats, error }, { data: subs }, { data: prods }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, description, is_active, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("subcategories")
      .select("id, category_id, name, slug, is_active, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase.from("products").select("category_id, subcategory_id"),
  ]);

  if (error || !cats) return [];

  const catCounts = new Map<string, number>();
  const subCounts = new Map<string, number>();
  for (const p of (prods ?? []) as { category_id: string | null; subcategory_id: string | null }[]) {
    if (p.category_id) catCounts.set(p.category_id, (catCounts.get(p.category_id) ?? 0) + 1);
    if (p.subcategory_id) subCounts.set(p.subcategory_id, (subCounts.get(p.subcategory_id) ?? 0) + 1);
  }

  const officialSubSlugs = new Set(getOfficialCatalogTypeSubcategories().map((s) => s.slug));

  const subsByCategory = new Map<string, AdminSubcategory[]>();
  for (const s of (subs ?? []) as RawSub[]) {
    if (!officialSubSlugs.has(s.slug)) continue;
    const list = subsByCategory.get(s.category_id) ?? [];
    list.push({
      id: s.id,
      categoryId: s.category_id,
      name: s.name,
      slug: s.slug,
      isActive: s.is_active,
      sortOrder: s.sort_order,
      productCount: subCounts.get(s.id) ?? 0,
    });
    subsByCategory.set(s.category_id, list);
  }

  return (cats as RawCat[]).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    isActive: c.is_active,
    sortOrder: c.sort_order,
    productCount: catCounts.get(c.id) ?? 0,
    subcategories: subsByCategory.get(c.id) ?? [],
  }));
}

/**
 * Lista ligera de TODOS los productos (incluye borradores) con su asignación de
 * categoría/subcategoría actual. Fuente única para el detalle por nodo y para el
 * modal de asignación (búsqueda). Reutiliza el mapeo probado de listAdminProducts.
 */
export async function listCategorizableProducts(): Promise<CategorizableProduct[]> {
  const products = await listAdminProducts();
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    isPublished: p.isPublished,
    brandName: p.brand?.name ?? null,
    image: p.images[0]?.url ?? null,
    categoryId: p.category?.id ?? null,
    categoryName: p.category?.name ?? null,
    subcategoryId: p.subcategory?.id ?? null,
    subcategoryName: p.subcategory?.name ?? null,
  }));
}

/** Productos asignados a una categoría (category_id). */
export async function getProductsByCategory(
  categoryId: string,
): Promise<CategorizableProduct[]> {
  const all = await listCategorizableProducts();
  return all.filter((p) => p.categoryId === categoryId);
}

/** Productos asignados a una subcategoría (subcategory_id). */
export async function getProductsBySubcategory(
  subcategoryId: string,
): Promise<CategorizableProduct[]> {
  const all = await listCategorizableProducts();
  return all.filter((p) => p.subcategoryId === subcategoryId);
}

/** Conteo de productos asociados directamente a una categoría. */
export async function getCategoryProductCount(categoryId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);
  return count ?? 0;
}

/** Conteo de productos asociados a una subcategoría. */
export async function getSubcategoryProductCount(subcategoryId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("subcategory_id", subcategoryId);
  return count ?? 0;
}
