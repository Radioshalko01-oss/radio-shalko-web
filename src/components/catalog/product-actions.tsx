"use client";

import Link from "next/link";
import { Check, Heart, MessageCircle, Phone, ShoppingBag } from "lucide-react";
import { useQuote } from "@/hooks/use-quote";
import { useFavorites } from "@/hooks/use-favorites";
import { SITE_CONTACT, telHref } from "@/lib/site-contact";
import { buildProductWhatsAppHref } from "@/lib/whatsapp/product-message";
import type { CatalogProduct } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

/**
 * Acciones de la PDP (Fase 1 · C3) — modelo híbrido (catálogo + cotización +
 * asesoría + compra en tienda/remota). Sin carrito ni checkout.
 *
 * - Solicitar cotización: agrega/quita el producto de la lista de cotización
 *   (localStorage, misma clave que el resto del sitio).
 * - WhatsApp: mensaje prellenado con el producto (utilidad dedicada en C4).
 * - Llamar: teléfono oficial de tienda.
 */
export function ProductActions({ product }: { product: CatalogProduct }) {
  const { has, toggle } = useQuote();
  const { has: hasFav, toggle: toggleFav } = useFavorites();
  const inQuote = has(product.id);
  const isFav = hasFav(product.id);

  const whatsappUrl = buildProductWhatsAppHref(
    {
      name: product.name,
      brand: product.brand?.name ?? null,
      sku: product.sku,
      price: product.price,
      slug: product.slug,
    },
    { intent: "consulta" },
  );

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => toggle(product.id)}
        className={cn(
          "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold uppercase tracking-wider transition-colors",
          inQuote
            ? "bg-secondary text-foreground ring-1 ring-foreground/20 hover:bg-secondary/80"
            : "bg-copper text-copper-foreground hover:bg-copper/90",
        )}
      >
        {inQuote ? (
          <>
            <Check className="h-4 w-4" /> En carrito
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4" /> Agregar al carrito
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => toggleFav(product.id)}
        aria-pressed={isFav}
        className={cn(
          "inline-flex h-12 items-center justify-center gap-2 rounded-full border text-sm font-semibold transition-colors",
          isFav
            ? "border-foreground/30 bg-secondary text-foreground hover:bg-secondary/80"
            : "border-border bg-card text-foreground hover:border-foreground",
        )}
      >
        <Heart className={cn("h-4 w-4", isFav && "fill-current")} />
        {isFav ? "Guardado en favoritos" : "Guardar en favoritos"}
      </button>

      <div className="grid grid-cols-2 gap-3">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-card text-sm font-semibold transition-colors hover:border-foreground"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
        <a
          href={telHref(SITE_CONTACT.phone.e164)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-card text-sm font-semibold transition-colors hover:border-foreground"
        >
          <Phone className="h-4 w-4" /> Llamar
        </a>
      </div>

      {inQuote && (
        <Link
          href="/carrito"
          className="text-center text-sm font-medium text-copper hover:underline"
        >
          Ver mi carrito
        </Link>
      )}
    </div>
  );
}
