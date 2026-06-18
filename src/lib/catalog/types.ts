/**
 * Tipos de dominio del catálogo (capa estable para la UI).
 *
 * Desacoplan los componentes del shape crudo de Supabase: las queries
 * devuelven SIEMPRE estos tipos, nunca filas con joins anidados.
 * camelCase en el dominio; la traducción desde snake_case vive en mappers.ts.
 */

export type CatalogBranch = {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  isActive: boolean;
  sortOrder: number;
};

export type CatalogInventory = {
  branch: CatalogBranch;
  quantity: number;
};

export type CatalogBrand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
};

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
};

export type CatalogSubcategory = {
  id: string;
  name: string;
  slug: string;
  categoryId: string | null;
};

export type CatalogImage = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
};

export type CatalogSpec = {
  id: string;
  label: string;
  value: string;
  sortOrder: number;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  price: number;
  sku: string | null;
  isNew: boolean;
  isPublished: boolean;
  brand: CatalogBrand | null;
  category: CatalogCategory | null;
  subcategory: CatalogSubcategory | null;
  images: CatalogImage[];
  specs: CatalogSpec[];
  inventory: CatalogInventory[];
};

/** Categoría con sus subcategorías anidadas (para menús y filtros). */
export type CatalogCategoryTree = CatalogCategory & {
  subcategories: CatalogSubcategory[];
};
