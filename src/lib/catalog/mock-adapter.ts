/**
 * Adaptador TEMPORAL mock → CatalogProduct (Fase 1 · C2).
 *
 * Permite que las superficies públicas usen <ProductCard> mientras la UI sigue
 * leyendo de lib/products.ts. Se elimina cuando la UI consuma Supabase (C6).
 *
 * Cliente-safe: solo usa datos del mock + slugify (sin Supabase, sin server).
 *
 * - id = id del mock  → favoritos/cotización siguen usando las mismas claves.
 * - slug = slugify("{marca} {nombre}")  → mismo criterio que el import (B5).
 * - inventory = []  → isAvailable() = false  → "Consultar disponibilidad".
 *   (El mock no tiene stock real; no se inventa.)
 */
import { getProductImages, type Product } from "@/lib/products";
import { slugify } from "./format";
import type { CatalogProduct } from "./types";

const CATEGORY_SLUG: Record<string, string> = {
  Instrumentos: "instrumentos",
  Accesorios: "accesorios",
  "Equipos de Audio": "equipos-de-audio",
};

export function mockToCatalogProduct(p: Product): CatalogProduct {
  const brandSlug = slugify(p.brand);
  const categorySlug = CATEGORY_SLUG[p.category] ?? slugify(p.category);
  const subSlug = slugify(p.subcategory);

  return {
    id: p.id,
    slug: slugify(`${p.brand} ${p.name}`),
    name: p.name,
    subtitle: null,
    description: null,
    price: p.price,
    sku: p.id,
    isNew: Boolean(p.isNew),
    isPublished: true,
    brand: { id: brandSlug, name: p.brand, slug: brandSlug, logoUrl: null },
    category: { id: categorySlug, name: p.category, slug: categorySlug },
    subcategory: { id: subSlug, name: p.subcategory, slug: subSlug, categoryId: categorySlug },
    images: getProductImages(p).map((url, i) => ({
      id: `${p.id}-img-${i}`,
      url,
      alt: p.name,
      sortOrder: i,
    })),
    specs: [],
    inventory: [],
  };
}
