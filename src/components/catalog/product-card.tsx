"use client";

/**
 * ProductCard unificada (Fase 1 · C1).
 *
 * Único componente de tarjeta basado en CatalogProduct. Replica la estética
 * actual de las tarjetas del sitio mediante variantes; no rediseña nada.
 *
 *   - featured : galería con hover, botón "Cotizar" que se revela (home).
 *   - grid     : card grande con borde (vista LayoutGrid del catálogo).
 *   - compact  : card pequeña con borde (vista Grid2x2 del catálogo).
 *   - row      : fila horizontal (vista List del catálogo).
 *
 * Enlaza a /productos/[slug] (PDP llega en una fase posterior). Aún no se
 * conecta a la UI; al no montarse en ninguna página, el sitio no cambia.
 */
import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, GitCompare, Heart, Plus } from "lucide-react";
import { formatPrice } from "@/lib/catalog/format";
import { typography } from "@/lib/design/tokens";
import { siteShell } from "@/lib/design/site-shell";
import { isAvailable } from "@/lib/catalog/inventory";
import type { CatalogProduct } from "@/lib/catalog/types";
import { useFavorites } from "@/hooks/use-favorites";
import { useQuote } from "@/hooks/use-quote";
import { useCompare } from "@/hooks/use-compare";
import { cn } from "@/lib/utils";

export type ProductCardVariant = "featured" | "grid" | "row" | "compact";

type ProductCardProps = {
  product: CatalogProduct;
  variant?: ProductCardVariant;
  className?: string;
};

export function ProductCard({ product, variant = "grid", className }: ProductCardProps) {
  switch (variant) {
    case "featured":
      return <FeaturedVariant product={product} className={className} />;
    case "row":
      return <RowVariant product={product} className={className} />;
    case "compact":
      return <BoxVariant product={product} compact className={className} />;
    case "grid":
    default:
      return <BoxVariant product={product} compact={false} className={className} />;
  }
}

function useCardState(product: CatalogProduct) {
  const { has, toggle } = useFavorites();
  const { has: inQuote, toggle: toggleQuote } = useQuote();
  const { has: inCompare, add: addCompare, openDrawer } = useCompare();
  return {
    href: `/productos/${product.slug}`,
    brand: product.brand?.name ?? "",
    subcategory: product.subcategory?.name ?? "",
    available: isAvailable(product.inventory),
    isFav: has(product.id),
    toggleFav: () => toggle(product.id),
    isQuoted: inQuote(product.id),
    toggleQuote: () => toggleQuote(product.id),
    isCompared: inCompare(product.id),
    toggleCompare: () => {
      if (inCompare(product.id)) {
        openDrawer();
        return;
      }
      if (addCompare(product.id)) openDrawer();
    },
  };
}

/* ----------------------------------------------------------------- featured */

function FeaturedVariant({ product, className }: { product: CatalogProduct; className?: string }) {
  const { href, brand, available, isFav, toggleFav, isQuoted, toggleQuote } = useCardState(product);
  const images = product.images.map((i) => ({ url: i.url, alt: i.alt ?? product.name }));
  const hasGallery = images.length > 1;

  const [imageIndex, setImageIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [loadedIndices, setLoadedIndices] = useState<Set<number>>(() => new Set([0]));

  const ensureLoaded = useCallback((indexToLoad: number) => {
    setLoadedIndices((prev) => {
      if (prev.has(indexToLoad)) return prev;
      const next = new Set(prev);
      next.add(indexToLoad);
      return next;
    });
  }, []);

  const goPrev = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setImageIndex((i) => {
        const next = (i - 1 + images.length) % images.length;
        ensureLoaded(next);
        return next;
      });
    },
    [images.length, ensureLoaded],
  );

  const goNext = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setImageIndex((i) => {
        const next = (i + 1) % images.length;
        ensureLoaded(next);
        return next;
      });
    },
    [images.length, ensureLoaded],
  );

  const onEnter = () => {
    setHovered(true);
    if (hasGallery) {
      ensureLoaded(1);
      setImageIndex(1);
    }
  };
  const onLeave = () => {
    setHovered(false);
    setImageIndex(0);
  };

  return (
    <article
      className={cn("group/card flex flex-col", className)}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="relative aspect-[5/6] max-lg:overflow-hidden overflow-hidden rounded-2xl bg-muted/50">
        <Link href={href} className="absolute inset-0 z-0" aria-label={product.name}>
          {images.map((img, i) =>
            loadedIndices.has(i) ? (
              <img
                key={`${product.id}-${img.url}-${i}`}
                src={img.url}
                alt=""
                loading="lazy"
                decoding="async"
                className={cn(
                  "absolute inset-0 h-full w-full object-cover max-lg:transition-none lg:transition-all lg:duration-500 lg:ease-out",
                  i === imageIndex ? "opacity-100" : "max-lg:hidden opacity-0",
                  i === imageIndex && "max-lg:transform-none lg:group-hover/card:scale-[1.02]",
                )}
              />
            ) : null,
          )}
        </Link>

        {product.isNew && (
          <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-sm border border-border/50 bg-background px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground shadow-sm max-lg:backdrop-blur-none lg:bg-background/95 lg:backdrop-blur-sm">
            Nuevo
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFav();
          }}
          aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
          className={cn(
            "absolute right-2.5 top-2.5 z-20 grid h-9 w-9 place-items-center rounded-full border border-border/50 bg-background text-foreground/65 shadow-sm transition-all max-lg:backdrop-blur-none hover:border-border hover:text-foreground lg:bg-background/95 lg:backdrop-blur-sm",
            isFav && "border-foreground/25 text-foreground",
          )}
        >
          <Heart
            className={cn("h-4 w-4", isFav && "fill-foreground text-foreground")}
            strokeWidth={1.75}
          />
        </button>

        {hasGallery && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Imagen anterior"
              className="absolute left-2.5 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border/40 bg-background text-foreground/80 opacity-0 shadow-sm transition-opacity max-lg:backdrop-blur-none hover:border-border hover:bg-background hover:text-foreground md:grid md:group-hover/card:opacity-100 lg:bg-background/90 lg:backdrop-blur-sm"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.25} />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Imagen siguiente"
              className="absolute right-2.5 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border/40 bg-background text-foreground/80 opacity-0 shadow-sm transition-opacity max-lg:backdrop-blur-none hover:border-border hover:bg-background hover:text-foreground md:grid md:group-hover/card:opacity-100 lg:bg-background/90 lg:backdrop-blur-sm"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.25} />
            </button>
          </>
        )}

        {hasGallery && hovered && (
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

      <div className="grid max-lg:grid-rows-[1fr] max-lg:transition-none grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-focus-within/card:grid-rows-[1fr] lg:group-hover/card:grid-rows-[1fr]">
        <div className="min-h-0 overflow-hidden">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleQuote();
            }}
            aria-label={isQuoted ? "Quitar del carrito" : "Agregar al carrito"}
            className={cn(
              "mt-2.5 flex w-full items-center justify-center rounded-full border py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] shadow-sm transition-colors",
              isQuoted
                ? "border-foreground/30 bg-secondary text-foreground hover:border-foreground/40 hover:bg-secondary/90"
                : "border-foreground/15 bg-secondary/80 text-foreground/85 hover:border-foreground/30 hover:bg-secondary hover:text-foreground",
            )}
          >
            {isQuoted ? "En carrito" : "Agregar"}
          </button>
        </div>
      </div>

      <Link href={href} className="mt-3 block transition-colors hover:opacity-80">
        <p className={cn(siteShell.brandEyebrow, "text-muted-foreground")}>{brand}</p>
        <h3 className="mt-1 line-clamp-2 font-display text-[15px] font-medium leading-snug text-foreground md:text-base">
          {product.name}
        </h3>
        <p className={cn("mt-2", typography.priceInline, "text-foreground/90")}>
          {formatPrice(product.price)}
        </p>
        {!available && (
          <p className="mt-1 text-[11px] text-muted-foreground">Consultar disponibilidad</p>
        )}
      </Link>
    </article>
  );
}

/* ----------------------------------------------------------- grid / compact */

function BoxVariant({
  product,
  compact,
  className,
}: {
  product: CatalogProduct;
  compact: boolean;
  className?: string;
}) {
  const {
    href,
    brand,
    available,
    isFav,
    toggleFav,
    isQuoted,
    toggleQuote,
    isCompared,
    toggleCompare,
  } = useCardState(product);
  const mainImage = product.images[0];

  return (
    <article
      className={cn(
        "group relative flex flex-col max-lg:overflow-visible rounded-2xl border border-border bg-card max-lg:transition-none lg:transition-all lg:hover:-translate-y-0.5 lg:hover:border-copper/40 lg:hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.25)]",
        className,
      )}
    >
      <Link
        href={href}
        className={cn(
          "relative block overflow-hidden bg-muted",
          compact ? "aspect-[11/10]" : "aspect-square",
        )}
      >
        {mainImage && (
          <img
            src={mainImage.url}
            alt={mainImage.alt ?? product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover max-lg:transition-none lg:transition-transform lg:duration-700 lg:group-hover:scale-105"
          />
        )}
        {product.isNew && (
          <span className="absolute right-14 top-3 rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-background">
            Nuevo
          </span>
        )}
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleCompare();
        }}
        aria-label={isCompared ? "Ver comparación" : "Agregar a comparación"}
        aria-pressed={isCompared}
        className={cn(
          "absolute left-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-background shadow-sm max-lg:shadow-none lg:backdrop-blur",
          isCompared
            ? "bg-foreground text-background"
            : "bg-background text-foreground hover:bg-foreground hover:text-background",
        )}
      >
        <GitCompare className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleFav();
        }}
        aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
        className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-background text-foreground max-lg:shadow-none lg:bg-background/90 lg:shadow-sm lg:backdrop-blur lg:transition-colors lg:hover:bg-foreground lg:hover:text-background"
      >
        <Heart className={cn("h-4 w-4", isFav && "fill-current")} />
      </button>
      <div className={cn("flex flex-1 flex-col", compact ? "p-3" : "p-5")}>
        <p className={siteShell.brandEyebrow}>{brand}</p>
        <Link href={href}>
          <h3
            className={cn(
              "mt-1 line-clamp-2 font-display font-medium leading-tight text-foreground transition-colors hover:text-copper",
              compact ? "text-sm" : "text-base",
            )}
          >
            {product.name}
          </h3>
        </Link>
        <div className="mt-auto pt-3">
          <p className={cn(typography.priceInline, compact ? "text-base" : "text-lg")}>
            {formatPrice(product.price)}
          </p>
          {!available && (
            <p className="mt-1 text-[11px] text-muted-foreground">Consultar disponibilidad</p>
          )}
          <button
            type="button"
            onClick={toggleQuote}
            aria-label={isQuoted ? "Quitar del carrito" : "Agregar al carrito"}
            className={cn(
              "mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 text-[11px] font-semibold uppercase tracking-wider transition-colors",
              compact ? "py-2.5" : "py-2",
              isQuoted
                ? "bg-secondary text-foreground border border-foreground/20 hover:bg-secondary/80"
                : "bg-foreground text-background hover:bg-copper hover:text-copper-foreground",
            )}
          >
            <Plus className="h-3 w-3" /> {isQuoted ? "En carrito" : "Agregar"}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ---------------------------------------------------------------------- row */

function RowVariant({ product, className }: { product: CatalogProduct; className?: string }) {
  const { href, brand, subcategory, available, isFav, toggleFav, isQuoted, toggleQuote } =
    useCardState(product);
  const mainImage = product.images[0];

  return (
    <article
      className={cn(
        "group flex w-full min-w-0 max-w-full items-center gap-3 max-lg:overflow-visible rounded-2xl border border-border bg-card p-3 max-lg:transition-none md:gap-4 md:p-4 lg:transition-colors lg:hover:border-copper/40",
        className,
      )}
    >
      <Link
        href={href}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted md:h-24 md:w-24"
        aria-label={product.name}
      >
        {mainImage && (
          <img
            src={mainImage.url}
            alt={mainImage.alt ?? product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <p className={siteShell.brandEyebrow}>{brand}</p>
        <Link href={href}>
          <h3 className="truncate font-display text-base font-medium transition-colors hover:text-copper md:text-lg">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground">
          {subcategory}
          {!available && (
            <span className="ml-2 text-muted-foreground/70">· Consultar disponibilidad</span>
          )}
        </p>
      </div>
      <div className="flex min-w-0 shrink flex-col items-end gap-1.5 max-md:max-w-[42%] md:gap-2">
        <p className={cn(typography.priceInline, "text-sm md:text-lg")}>
          {formatPrice(product.price)}
        </p>
        <div className="flex items-center gap-1.5 md:gap-2">
          <button
            onClick={toggleFav}
            aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-foreground/80 hover:border-foreground hover:text-foreground"
          >
            <Heart className={cn("h-3.5 w-3.5", isFav && "fill-current")} />
          </button>
          <button
            type="button"
            onClick={toggleQuote}
            aria-label={isQuoted ? "Quitar del carrito" : "Agregar al carrito"}
            className={cn(
              "inline-flex max-w-full items-center gap-1 rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors md:gap-1.5 md:px-4 md:text-[11px]",
              isQuoted
                ? "bg-secondary text-foreground border border-foreground/20"
                : "bg-foreground text-background hover:bg-copper hover:text-copper-foreground",
            )}
          >
            <Plus className="h-3 w-3 shrink-0" />{" "}
            <span className="truncate">{isQuoted ? "En carrito" : "Agregar"}</span>
            <ArrowUpRight className="hidden h-3 w-3 shrink-0 min-[380px]:inline" />
          </button>
        </div>
      </div>
    </article>
  );
}
