"use client";

/**
 * Cotización · Fase 4.
 *
 * El estado real vive en <QuoteProvider> (única fuente de verdad). Este hook
 * solo expone el contexto, conservando la API previa
 * ({ ids, has, toggle, remove, count }) para no tocar a los consumidores.
 *
 * - Invitado  → localStorage.
 * - Con sesión → Supabase (quotes/quote_items) con sync localStorage → Supabase.
 */
import { useQuoteContext } from "@/components/providers/quote-provider";

export function useQuote() {
  return useQuoteContext();
}
