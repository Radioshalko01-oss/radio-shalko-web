import type { SupabaseClient } from "@supabase/supabase-js";

/** Select sin columnas de detalle extendido (compatibilidad pre-migración). */
export const PRODUCT_SELECT_BASE = `
  id,
  slug,
  title,
  subtitle,
  description,
  price,
  sku,
  is_new,
  is_featured,
  is_published,
  brand:brands ( id, name, slug, logo_url ),
  category:categories ( id, name, slug ),
  subcategory:subcategories ( id, name, slug, category_id ),
  images:product_images ( id, url, alt_text, sort_order ),
  specs:product_specs ( id, label, value, sort_order ),
  inventory:product_inventory (
    quantity,
    branch:branches ( id, slug, name, display_name, is_active, sort_order )
  )
` as const;

/** Select con specifications, features e includes (post-migración). */
export const PRODUCT_SELECT_EXTENDED = `
  id,
  slug,
  title,
  subtitle,
  description,
  specifications,
  features,
  includes,
  price,
  sku,
  is_new,
  is_featured,
  is_published,
  catalog_variant,
  brand:brands ( id, name, slug, logo_url ),
  category:categories ( id, name, slug ),
  subcategory:subcategories ( id, name, slug, category_id ),
  images:product_images ( id, url, alt_text, sort_order ),
  specs:product_specs ( id, label, value, sort_order ),
  inventory:product_inventory (
    quantity,
    branch:branches ( id, slug, name, display_name, is_active, sort_order )
  )
` as const;

/** Select estático completo (incluye detalle de producto). */
export const PRODUCT_SELECT = PRODUCT_SELECT_EXTENDED;

type DetailColumnsState = "unknown" | "available" | "missing";

let detailColumnsState: DetailColumnsState = "unknown";

export async function resolveProductSelect(
  supabase: SupabaseClient,
): Promise<string> {
  if (detailColumnsState === "available") return PRODUCT_SELECT_EXTENDED;

  const { error } = await supabase.from("products").select("specifications").limit(1);
  if (error?.code === "42703") {
    detailColumnsState = "missing";
    return PRODUCT_SELECT_BASE;
  }

  detailColumnsState = "available";
  return PRODUCT_SELECT_EXTENDED;
}

export async function hasProductDetailColumns(
  supabase: SupabaseClient,
): Promise<boolean> {
  await resolveProductSelect(supabase);
  return detailColumnsState === "available";
}

type CatalogVariantColumnState = "unknown" | "available" | "missing";

let catalogVariantColumnState: CatalogVariantColumnState = "unknown";

export async function hasCatalogVariantColumn(
  supabase: SupabaseClient,
): Promise<boolean> {
  if (catalogVariantColumnState === "available") return true;
  if (catalogVariantColumnState === "missing") return false;

  const { error } = await supabase.from("products").select("catalog_variant").limit(1);
  if (error?.code === "42703") {
    catalogVariantColumnState = "missing";
    return false;
  }

  catalogVariantColumnState = "available";
  return true;
}

export function productCatalogVariantWriteField(
  catalogVariant: string | null | undefined,
  includeColumn: boolean,
) {
  if (!includeColumn) return {};
  return { catalog_variant: catalogVariant ?? null };
}

export function productDetailWriteFields(
  input: {
    specifications?: string | null;
    features?: string | null;
    includes?: string | null;
  },
  includeDetailColumns: boolean,
) {
  if (!includeDetailColumns) return {};
  return {
    specifications: input.specifications ?? null,
    features: input.features ?? null,
    includes: input.includes ?? null,
  };
}

type FeaturedColumnState = "unknown" | "available" | "missing";

let featuredColumnState: FeaturedColumnState = "unknown";

export async function hasFeaturedColumn(supabase: SupabaseClient): Promise<boolean> {
  if (featuredColumnState === "available") return true;
  if (featuredColumnState === "missing") return false;

  const { error } = await supabase.from("products").select("is_featured").limit(1);
  if (error?.code === "42703") {
    featuredColumnState = "missing";
    return false;
  }

  featuredColumnState = "available";
  return true;
}

export function productFeaturedWriteField(isFeatured: boolean | undefined, includeColumn: boolean) {
  if (!includeColumn) return {};
  return { is_featured: isFeatured ?? false };
}
