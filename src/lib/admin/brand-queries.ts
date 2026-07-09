/**
 * Capa de datos admin · CAT-3 (marcas, solo lectura).
 *
 * Acceso a marcas desde el panel: incluye marcas ocultas (is_active=false) y el
 * conteo de productos asociados. Lecturas puras (no Server Actions); la
 * protección de rol vive en el layout/acciones que las invocan (requireAdmin).
 */
import { createClient } from "@/lib/supabase/server";
import {
  isOfficialBrandName,
  sortByOfficialBrandOrder,
} from "@/lib/navigation/catalog-taxonomy";

export type AdminBrand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
};

type RawAdminBrand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

/**
 * Todas las marcas (activas y ocultas) ordenadas por sort_order y luego nombre,
 * con el conteo de productos asociados a cada una.
 */
export async function listAdminBrands(): Promise<AdminBrand[]> {
  const supabase = await createClient();

  const [{ data: brands, error }, { data: prods }] = await Promise.all([
    supabase
      .from("brands")
      .select("id, name, slug, logo_url, description, is_active, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase.from("products").select("brand_id"),
  ]);

  if (error || !brands) return [];

  const counts = new Map<string, number>();
  for (const p of (prods ?? []) as { brand_id: string | null }[]) {
    if (!p.brand_id) continue;
    counts.set(p.brand_id, (counts.get(p.brand_id) ?? 0) + 1);
  }

  return sortByOfficialBrandOrder(
    (brands as RawAdminBrand[])
      .filter((b) => isOfficialBrandName(b.name))
      .map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        logoUrl: b.logo_url,
        description: b.description,
        isActive: b.is_active,
        sortOrder: b.sort_order,
        productCount: counts.get(b.id) ?? 0,
      })),
  );
}

/** Conteo de productos asociados a una marca (para guardas de borrado). */
export async function getBrandProductCount(brandId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", brandId);
  return count ?? 0;
}
