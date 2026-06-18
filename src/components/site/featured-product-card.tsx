"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { formatPrice, getProductImages, type Product } from "@/lib/products";
import { useFavorites } from "@/hooks/use-favorites";
import { useQuote } from "@/hooks/use-quote";
import { cn } from "@/lib/utils";

type FeaturedProductCardProps = {
  product: Product;
};

export function FeaturedProductCard({ product }: FeaturedProductCardProps) {
  const images = getProductImages(product);
  const hasGallery = images.length > 1;
  const { has, toggle } = useFavorites();
  const isFav = has(product.id);
  const { has: inQuote, toggle: toggleQuote } = useQuote();
  const isQuoted = inQuote(product.id);

  const [imageIndex, setImageIndex] = useState(0);
  const [hovered, setHovered] = useState(false);

  const productHref = `/productos?sub=${encodeURIComponent(product.subcategory)}`;

  const goPrev = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setImageIndex((i) => (i - 1 + images.length) % images.length);
    },
    [images.length],
  );

  const goNext = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setImageIndex((i) => (i + 1) % images.length);
    },
    [images.length],
  );

  const onCardEnter = () => {
    setHovered(true);
    if (hasGallery) setImageIndex(1);
  };

  const onCardLeave = () => {
    setHovered(false);
    setImageIndex(0);
  };

  return (
    <article
      className="group/card flex flex-col"
      onMouseEnter={onCardEnter}
      onMouseLeave={onCardLeave}
    >
      <div className="relative aspect-[5/6] overflow-hidden rounded-md bg-secondary/70">
        <Link href={productHref} className="absolute inset-0 z-0" aria-label={product.name}>
          {images.map((src, i) => (
            <img
              key={`${product.id}-${src}-${i}`}
              src={src}
              alt=""
              loading="lazy"
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-all duration-500 ease-out",
                i === imageIndex ? "opacity-100" : "opacity-0",
                i === imageIndex && "group-hover/card:scale-[1.02]",
              )}
            />
          ))}
        </Link>

        {product.isNew && (
          <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-sm border border-border/50 bg-background/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground shadow-sm backdrop-blur-sm">
            Nuevo
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle(product.id);
          }}
          aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
          className={cn(
            "absolute right-2.5 top-2.5 z-20 grid h-9 w-9 place-items-center rounded-full border border-border/50 bg-background/95 text-foreground/65 shadow-sm backdrop-blur-sm transition-all hover:border-border hover:text-foreground",
            isFav && "border-foreground/25 text-foreground",
          )}
        >
          <Heart
            className={cn("h-4 w-4", isFav && "fill-foreground text-foreground")}
            strokeWidth={1.75}
          />
        </button>

        {hasGallery && hovered && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Imagen anterior"
              className="absolute left-2.5 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-border/40 bg-background/90 text-foreground/80 shadow-sm backdrop-blur-sm transition-colors hover:border-border hover:bg-background hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.25} />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Imagen siguiente"
              className="absolute right-2.5 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-border/40 bg-background/90 text-foreground/80 shadow-sm backdrop-blur-sm transition-colors hover:border-border hover:bg-background hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.25} />
            </button>
          </>
        )}

        {hasGallery && hovered && images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i === imageIndex ? "w-4 bg-foreground/50" : "w-1 bg-foreground/20",
                )}
                aria-hidden
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-focus-within/card:grid-rows-[1fr] group-hover/card:grid-rows-[1fr]">
        <div className="min-h-0 overflow-hidden">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleQuote(product.id);
            }}
            aria-label={isQuoted ? "Quitar de cotización" : "Agregar a cotización"}
            className={cn(
              "mt-2.5 flex w-full items-center justify-center rounded-full border py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] shadow-sm transition-colors",
              isQuoted
                ? "border-foreground/30 bg-secondary text-foreground hover:border-foreground/40 hover:bg-secondary/90"
                : "border-foreground/15 bg-secondary/80 text-foreground/85 hover:border-foreground/30 hover:bg-secondary hover:text-foreground",
            )}
          >
            {isQuoted ? "En cotización" : "Cotizar"}
          </button>
        </div>
      </div>

      <Link href={productHref} className="mt-3 block transition-colors hover:opacity-80">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {product.brand}
        </p>
        <h3 className="mt-1 line-clamp-2 font-display text-[15px] font-medium leading-snug text-foreground md:text-base">
          {product.name}
        </h3>
        <p className="mt-2 text-sm font-semibold tracking-tight text-foreground/90">
          {formatPrice(product.price)}
        </p>
      </Link>
    </article>
  );
}
