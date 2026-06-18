"use server";

/**
 * Server Actions del catálogo (Fase 1 · C6).
 *
 * Permiten que componentes cliente resuelvan ids guardados en localStorage
 * (favoritos / cotización) a productos reales de Supabase, sin migrar el
 * almacenamiento a la base todavía.
 */
import { getProductsByIds } from "./queries";
import type { CatalogProduct } from "./types";

/** Resuelve una lista de ids (UUID) a CatalogProduct[], preservando el orden. */
export async function fetchProductsByIds(ids: string[]): Promise<CatalogProduct[]> {
  if (!ids.length) return [];
  return getProductsByIds(ids);
}
