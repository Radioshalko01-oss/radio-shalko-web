"use client";

/**
 * Favoritos · Fase 3.
 *
 * El estado real vive en <FavoritesProvider> (única fuente de verdad). Este
 * hook solo expone el contexto, conservando la API previa
 * ({ ids, has, toggle, remove, count }) para no tocar a los consumidores.
 *
 * - Invitado  → localStorage.
 * - Con sesión → Supabase (persistente) con sync localStorage → Supabase.
 */
import { useFavoritesContext } from "@/components/providers/favorites-provider";

export function useFavorites() {
  return useFavoritesContext();
}
