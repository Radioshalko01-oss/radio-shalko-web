"use client";

import Link from "next/link";
import { useEffect } from "react";
import { X } from "lucide-react";
import { formatPrice } from "@/lib/catalog/format";
import { getProductDetailSections } from "@/lib/catalog/product-detail-sections";
import { isAvailable } from "@/lib/catalog/inventory";
import type { CatalogProduct } from "@/lib/catalog/types";
import { useCompare } from "@/hooks/use-compare";
import { COMPARE_MAX } from "@/components/providers/compare-provider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const PANEL_SHEET_WIDTH = "w-[88vw] max-w-sm";
const PANEL_SHEET_CLOSE =
  "[&>button]:right-5 [&>button]:top-5 [&>button]:grid [&>button]:h-9 [&>button]:w-9 [&>button]:place-items-center [&>button]:rounded-full [&>button]:border [&>button]:border-border/70 [&>button]:bg-background [&>button]:opacity-100 [&>button]:shadow-none [&>button]:transition-colors [&>button]:hover:bg-muted [&>button]:focus:ring-0";

export function CompareUi() {
  const {
    ids,
    products,
    loading,
    count,
    remove,
    clear,
    drawerOpen,
    modalOpen,
    closeDrawer,
    closeModal,
    openDrawer,
    openModal,
  } = useCompare();

  useEffect(() => {
    if (count === 0) {
      closeDrawer();
      closeModal();
    }
  }, [count, closeDrawer, closeModal]);

  const canCompare = count === COMPARE_MAX;

  return (
    <>
      {count > 0 && !drawerOpen && !modalOpen && (
        <div className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-5 z-40 md:right-8">
          <div className="flex items-center gap-2 rounded-full border border-border bg-foreground px-2 py-2 pl-4 text-background shadow-[0_16px_40px_-16px_rgba(0,0,0,0.45)]">
            <span className="text-sm font-medium tabular-nums">
              Comparar {count}/{COMPARE_MAX}
            </span>
            <button
              type="button"
              onClick={openDrawer}
              className="rounded-full bg-background px-4 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-background/90"
            >
              Ver selección
            </button>
          </div>
        </div>
      )}

      <Sheet open={drawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
        <SheetContent
          side="right"
          className={cn(
            "flex h-full flex-col gap-0 overflow-hidden border-l border-border/80 bg-background p-0",
            PANEL_SHEET_WIDTH,
            PANEL_SHEET_CLOSE,
          )}
        >
          <div className="shrink-0 border-b border-border/80 px-5 pb-5 pt-6 pr-14">
            <SheetHeader className="space-y-1.5 text-left">
              <SheetTitle className="font-display text-[1.35rem] font-semibold tracking-tight">
                Comparar productos
              </SheetTitle>
              <p className="text-[13px] leading-snug text-muted-foreground">
                Selecciona {COMPARE_MAX} productos para comparar.
              </p>
            </SheetHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3">
            {loading && products.length === 0 ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin productos.</p>
            ) : (
              <ul className="space-y-3">
                {products.map((product) => (
                  <CompareDrawerItem
                    key={product.id}
                    product={product}
                    onRemove={() => remove(product.id)}
                  />
                ))}
              </ul>
            )}

            {count < COMPARE_MAX && (
              <Link
                href="/productos"
                onClick={closeDrawer}
                className="mt-4 flex h-9 items-center justify-center rounded-lg border border-dashed border-border/80 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
              >
                + Agregar producto
              </Link>
            )}
          </div>

          <div className="shrink-0 border-t border-border/80 bg-background px-5 py-5">
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={clear}
                disabled={count === 0}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-muted/50 disabled:opacity-40"
              >
                Borrar selección
              </button>
              <button
                type="button"
                onClick={() => {
                  closeDrawer();
                  openModal();
                }}
                disabled={!canCompare}
                className={cn(
                  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-medium transition-opacity",
                  canCompare
                    ? "bg-foreground text-background hover:opacity-90"
                    : "cursor-not-allowed bg-muted text-muted-foreground opacity-70",
                )}
              >
                Comparar {count}/{COMPARE_MAX}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {modalOpen && (
        <CompareModal products={products} onClose={closeModal} ids={ids} />
      )}
    </>
  );
}

function CompareDrawerItem({
  product,
  onRemove,
}: {
  product: CatalogProduct;
  onRemove: () => void;
}) {
  const image = product.images[0]?.url;

  return (
    <li className="flex gap-2.5 rounded-lg border border-border/60 bg-[#fafafa] p-2.5">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border/50 bg-white">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-contain p-1" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            {product.brand && (
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {product.brand.name}
              </p>
            )}
            <Link
              href={`/productos/${product.slug}`}
              className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground hover:underline"
            >
              {product.name}
            </Link>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 text-[10px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Quitar
          </button>
        </div>
        <p className="mt-0.5 text-[13px] font-semibold tabular-nums">{formatPrice(product.price)}</p>
      </div>
    </li>
  );
}

function CompareModal({
  products,
  onClose,
  ids,
}: {
  products: CatalogProduct[];
  onClose: () => void;
  ids: string[];
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const ordered = ids
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as CatalogProduct[];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Cerrar comparación"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-modal-title"
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4 md:px-6">
          <h2 id="compare-modal-title" className="text-lg font-semibold tracking-tight">
            Comparación
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 md:px-6">
          <div className="grid gap-5 md:grid-cols-2">
            {ordered.map((product) => (
              <CompareProductColumn key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareProductColumn({ product }: { product: CatalogProduct }) {
  const available = isAvailable(product.inventory);
  const sections = getProductDetailSections(product);
  const image = product.images[0]?.url;

  return (
    <article className="rounded-xl border border-border/70 bg-white p-4 md:p-5">
      <div className="mx-auto flex w-full items-center justify-center py-2 md:py-4">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="max-h-[200px] w-full object-contain object-center md:max-h-[340px] lg:max-h-[400px]"
          />
        ) : null}
      </div>

      <div className="mt-4">
        {product.brand && (
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.brand.name}</p>
        )}
        <Link
          href={`/productos/${product.slug}`}
          className="mt-1 block text-base font-medium leading-snug text-foreground hover:underline"
        >
          {product.name}
        </Link>
        <p className="mt-2 text-xl font-semibold tabular-nums">{formatPrice(product.price)}</p>
        <p className={cn("mt-1 text-xs font-medium", available ? "text-emerald-600" : "text-amber-600")}>
          {available ? "Disponible" : "Consultar disponibilidad"}
        </p>
      </div>

      <CompareSection title="Descripción" lines={sections.description ? [sections.description] : []} />
      <CompareSection title="Especificaciones" lines={sections.specifications} />
      <CompareSection title="Características" lines={sections.features} />
      <CompareSection title="Incluye" lines={sections.includes} />
    </article>
  );
}

function CompareSection({ title, lines }: { title: string; lines: string[] }) {
  if (!lines.length) return null;

  return (
    <div className="mt-5 border-t border-border/60 pt-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/70">
        {title}
      </h3>
      <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-foreground/80">
        {lines.map((line, i) => (
          <li key={`${title}-${i}`} className="flex gap-2">
            <span className="text-muted-foreground">·</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
