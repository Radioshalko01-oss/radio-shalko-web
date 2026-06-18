import type {
  CatalogBranch,
  CatalogBrand,
  CatalogCategory,
  CatalogImage,
  CatalogInventory,
  CatalogProduct,
  CatalogSpec,
  CatalogSubcategory,
} from "./types";

/**
 * Select reutilizable para traer un producto con todos sus joins.
 * Usado por todas las queries de producto en queries.ts.
 */
export const PRODUCT_SELECT = `
  id,
  slug,
  title,
  subtitle,
  description,
  price,
  sku,
  is_new,
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

// --- Shapes crudos que devuelve Supabase con el select de arriba ---

export type RawBrand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
} | null;

export type RawCategory = {
  id: string;
  name: string;
  slug: string;
} | null;

export type RawSubcategory = {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
} | null;

export type RawImage = {
  id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
};

export type RawSpec = {
  id: string;
  label: string;
  value: string;
  sort_order: number;
};

export type RawBranch = {
  id: string;
  slug: string;
  name: string;
  display_name: string;
  is_active: boolean;
  sort_order: number;
} | null;

export type RawInventory = {
  quantity: number;
  branch: RawBranch;
};

export type RawProduct = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  price: number;
  sku: string | null;
  is_new: boolean;
  is_published: boolean;
  brand: RawBrand;
  category: RawCategory;
  subcategory: RawSubcategory;
  images: RawImage[] | null;
  specs: RawSpec[] | null;
  inventory: RawInventory[] | null;
};

// --- Normalizadores por entidad ---

export function mapBrand(row: RawBrand): CatalogBrand | null {
  if (!row) return null;
  return { id: row.id, name: row.name, slug: row.slug, logoUrl: row.logo_url };
}

export function mapCategory(row: RawCategory): CatalogCategory | null {
  if (!row) return null;
  return { id: row.id, name: row.name, slug: row.slug };
}

export function mapSubcategory(row: RawSubcategory): CatalogSubcategory | null {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    categoryId: row.category_id,
  };
}

export function mapBranch(row: RawBranch): CatalogBranch | null {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    displayName: row.display_name,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

/** Imágenes ordenadas por sort_order; sin imágenes alternas inventadas. */
export function normalizeImages(rows: RawImage[] | null): CatalogImage[] {
  if (!rows?.length) return [];
  return [...rows]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => ({
      id: r.id,
      url: r.url,
      alt: r.alt_text,
      sortOrder: r.sort_order,
    }));
}

export function normalizeSpecs(rows: RawSpec[] | null): CatalogSpec[] {
  if (!rows?.length) return [];
  return [...rows]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => ({
      id: r.id,
      label: r.label,
      value: r.value,
      sortOrder: r.sort_order,
    }));
}

/**
 * Inventario por sucursal: descarta filas sin branch, ordena por el
 * sort_order de la sucursal. No filtra inactivas aquí (lo deciden las
 * queries/helpers según el caso de uso).
 */
export function normalizeInventory(rows: RawInventory[] | null): CatalogInventory[] {
  if (!rows?.length) return [];
  return rows
    .map((r) => {
      const branch = mapBranch(r.branch);
      if (!branch) return null;
      return { branch, quantity: r.quantity ?? 0 } satisfies CatalogInventory;
    })
    .filter((x): x is CatalogInventory => x !== null)
    .sort((a, b) => a.branch.sortOrder - b.branch.sortOrder);
}

/** Fila Supabase (producto + joins) → CatalogProduct de dominio. */
export function mapProduct(row: RawProduct): CatalogProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.title,
    subtitle: row.subtitle,
    description: row.description,
    price: row.price,
    sku: row.sku,
    isNew: row.is_new,
    isPublished: row.is_published,
    brand: mapBrand(row.brand),
    category: mapCategory(row.category),
    subcategory: mapSubcategory(row.subcategory),
    images: normalizeImages(row.images),
    specs: normalizeSpecs(row.specs),
    inventory: normalizeInventory(row.inventory),
  };
}
