"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, GitCompare, Heart, ShoppingCart } from "lucide-react";
import { useQuote } from "@/hooks/use-quote";
import { useFavorites } from "@/hooks/use-favorites";
import { useCompare } from "@/hooks/use-compare";
import { COMPARE_MAX } from "@/components/providers/compare-provider";
import type { CatalogProduct } from "@/lib/catalog/types";
import { QuantityStepper } from "@/components/catalog/quantity-stepper";
import { cn } from "@/lib/utils";

export function ProductActions({ product }: { product: CatalogProduct }) {
  const { has, getQuantity, setQuantity } = useQuote();
  const { has: hasFav, toggle: toggleFav } = useFavorites();
  const { startCompare, has: inCompare, count: compareCount, openDrawer } = useCompare();
  const inQuote = has(product.id);
  const isFav = hasFav(product.id);
  const [localQty, setLocalQty] = useState(1);
  const quantity = inQuote ? getQuantity(product.id) || 1 : localQty;

  const browseHref = `/productos${product.subcategory ? `?sub=${encodeURIComponent(product.subcategory.name)}` : ""}`;

  const handleCompare = () => {
    if (inCompare(product.id)) {
      openDrawer();
      return;
    }
    if (compareCount >= COMPARE_MAX) return;
    startCompare(product.id);
  };

  const handleAddToCart = () => {
    setQuantity(product.id, quantity);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <QuantityStepper
          value={quantity}
          onChange={(next) => {
            if (inQuote) setQuantity(product.id, next);
            else setLocalQty(next);
          }}
          className="shrink-0 bg-white"
        />
        <button
          type="button"
          onClick={handleAddToCart}
          className={cn(
            "inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors",
            inQuote
              ? "bg-foreground/90 text-background hover:bg-foreground"
              : "bg-foreground text-background hover:bg-foreground/90",
          )}
        >
          {inQuote ? (
            <>
              <Check className="h-4 w-4" />
              Actualizar carrito
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              Agregar al carrito
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => toggleFav(product.id)}
          aria-pressed={isFav}
          aria-label={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
          className={cn(
            "inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl border bg-white px-4 text-[13px] font-medium transition-colors",
            isFav
              ? "border-foreground/25 text-foreground"
              : "border-border text-foreground/80 hover:border-foreground/30 hover:text-foreground",
          )}
        >
          <Heart className={cn("h-4 w-4 shrink-0", isFav && "fill-current")} />
          <span className="hidden sm:inline">Favoritos</span>
        </button>
      </div>

      <button
        type="button"
        onClick={handleCompare}
        disabled={!inCompare(product.id) && compareCount >= COMPARE_MAX}
        className={cn(
          "inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border px-4 text-center text-[13px] font-medium transition-colors",
          inCompare(product.id)
            ? "border-foreground/25 bg-foreground/5 text-foreground"
            : "border-border bg-white text-foreground/80 hover:border-foreground/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <GitCompare className="h-3.5 w-3.5 shrink-0" />
        {inCompare(product.id) ? "Ver selección para comparar" : "Comparar con otro producto"}
      </button>

      {!inCompare(product.id) && compareCount > 0 && compareCount < COMPARE_MAX && (
        <Link
          href={browseHref}
          className="text-center text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          Explora más productos de {product.subcategory?.name ?? "esta categoría"} para completar la comparación
        </Link>
      )}

      {inQuote && (
        <Link
          href="/carrito"
          className="text-center text-sm font-medium text-foreground/70 hover:text-foreground hover:underline"
        >
          Ver mi carrito
        </Link>
      )}
    </div>
  );
}
