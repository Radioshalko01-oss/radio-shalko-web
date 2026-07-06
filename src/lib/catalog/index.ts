/**
 * Capa de dominio del catálogo (Fase 1 · B4).
 *
 * Punto único de importación para fases posteriores:
 *   import { getProductBySlug, formatPrice, type CatalogProduct } from "@/lib/catalog";
 *
 * NOTA: las queries usan el cliente server de Supabase (cookies), por lo que
 * solo deben llamarse desde Server Components / Server Actions / route handlers.
 */
export * from "./types";
export * from "./format";
export * from "./inventory";
export {
  getCatalogProducts,
  getHeaderCatalogProducts,
  getHomeFeaturedProducts,
  getProductBySlug,
  getProductsByIds,
  getRelatedProducts,
  getCategoriesTree,
  getBrands,
  type CatalogFilters,
  type HomeFeaturedProducts,
} from "./queries";
