"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  CATALOG_FAMILIES,
  FEATURED_BRAND_CANDIDATES,
  type CatalogFamily,
  type CatalogMenuItem,
} from "@/lib/navigation/catalog-taxonomy";
import { cn } from "@/lib/utils";

/* ── Espaciado simétrico compartido (Productos + Marcas) ─────────── */

const MEGA_GUTTER_VARS = "[--mega-gutter:clamp(2rem,5vw,5rem)]";
const megaMenuShell = "mx-auto w-full max-w-7xl py-7 lg:py-8";
const megaGutterGrid = cn(
  MEGA_GUTTER_VARS,
  "px-[var(--mega-gutter)] gap-x-[var(--mega-gutter)]",
);

/* ── Shared ─────────────────────────────────────────────────────── */

function CatalogLinkList({
  items,
  isActiveItem,
  onItem,
  activeLabel,
  onHover,
}: {
  items: CatalogMenuItem[];
  isActiveItem: (item: CatalogMenuItem) => boolean;
  onItem: (item: CatalogMenuItem) => void;
  activeLabel?: string | null;
  onHover?: (label: string | null) => void;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const hasChildren = Boolean(item.children?.length);
        const isActive = activeLabel === item.label;
        const isLive = isActiveItem(item);
        return (
          <li
            key={item.label}
            onMouseEnter={() => {
              if (hasChildren && onHover) onHover(item.label);
            }}
          >
            <button
              type="button"
              onClick={() => onItem(item)}
              onMouseEnter={() => {
                if (hasChildren && onHover) onHover(item.label);
              }}
              className={cn(
                "block w-full py-1 text-left text-[13.5px] leading-snug transition-colors duration-150",
                isActive
                  ? "font-medium text-copper"
                  : isLive
                    ? "text-foreground/85 hover:text-copper"
                    : "text-muted-foreground/55 hover:text-muted-foreground/75",
              )}
            >
              {item.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function CatalogContextPanel({
  item,
  isActiveItem,
  onItem,
  onViewAll,
}: {
  item: CatalogMenuItem;
  isActiveItem: (item: CatalogMenuItem) => boolean;
  onItem: (item: CatalogMenuItem) => void;
  onViewAll: (item: CatalogMenuItem) => void;
}) {
  const children = item.children ?? [];
  if (children.length === 0) return null;

  return (
    <>
      <p className="mb-3 text-[13px] font-semibold text-foreground">{item.label}</p>
      <CatalogLinkList items={children} isActiveItem={isActiveItem} onItem={onItem} />
      <button
        type="button"
        onClick={() => onViewAll(item)}
        className="mt-4 inline-flex items-center gap-1 text-[11.5px] font-medium text-muted-foreground transition-[gap,color] hover:gap-1.5 hover:text-copper"
      >
        Ver todos
        <ArrowUpRight className="h-3 w-3" />
      </button>
    </>
  );
}

/* ── Productos megamenú — grid 3×2 como mock Canva ──────────────── */

function CatalogFamilyColumn({
  family,
  isActiveItem,
  onCategory,
  onItem,
  className,
  enableFlyout = true,
}: {
  family: CatalogFamily;
  isActiveItem: (item: CatalogMenuItem) => boolean;
  onCategory: (cat: string) => void;
  onItem: (item: CatalogMenuItem) => void;
  className?: string;
  enableFlyout?: boolean;
}) {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const activeItem = family.items.find((i) => i.label === activeLabel);
  const showFlyout =
    enableFlyout && Boolean(activeItem?.children?.length);

  return (
    <article
      className={cn("min-w-0 w-full", className)}
      onMouseLeave={() => setActiveLabel(null)}
    >
      <button
        type="button"
        onClick={() => onCategory(family.cat)}
        className="mb-4 block w-full text-left lg:mb-5"
      >
        <span className="text-[13px] font-bold uppercase tracking-[0.04em] text-foreground">
          {family.title}
        </span>
      </button>

      <div className="grid grid-cols-2 gap-x-5 lg:gap-x-7 xl:gap-x-8">
        <div className="min-w-0">
          <CatalogLinkList
            items={family.items}
            isActiveItem={isActiveItem}
            onItem={onItem}
            activeLabel={activeLabel}
            onHover={enableFlyout ? setActiveLabel : undefined}
          />
        </div>
        <div
          className={cn(
            "min-w-0 border-l pl-5 lg:pl-6",
            showFlyout ? "border-border/20" : "border-transparent",
          )}
        >
          {showFlyout && activeItem ? (
            <CatalogContextPanel
              item={activeItem}
              isActiveItem={isActiveItem}
              onItem={onItem}
              onViewAll={onItem}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}

export type ProductsMegaMenuProps = {
  families?: CatalogFamily[];
  isActiveItem: (item: CatalogMenuItem) => boolean;
  onCategory: (cat: string) => void;
  onItem: (item: CatalogMenuItem) => void;
};

export function ProductsMegaMenu({
  families = CATALOG_FAMILIES,
  isActiveItem,
  onCategory,
  onItem,
}: ProductsMegaMenuProps) {
  const [inst, acc, audio] = families;

  return (
    <div className={megaMenuShell}>
      <div className={cn("grid w-full grid-cols-3 items-start", megaGutterGrid)}>
        {inst && (
          <CatalogFamilyColumn
            family={inst}
            isActiveItem={isActiveItem}
            onCategory={onCategory}
            onItem={onItem}
            enableFlyout
          />
        )}
        {acc && (
          <CatalogFamilyColumn
            family={acc}
            isActiveItem={isActiveItem}
            onCategory={onCategory}
            onItem={onItem}
            enableFlyout
          />
        )}
        {audio && (
          <CatalogFamilyColumn
            family={audio}
            isActiveItem={isActiveItem}
            onCategory={onCategory}
            onItem={onItem}
            enableFlyout
          />
        )}
      </div>
    </div>
  );
}

/* ── MARCAS ──────────────────────────────────────────────────────── */

type BrandsMegaMenuProps = {
  brandColumns: Array<{ label: string; items: string[] }>;
  sortedBrands: string[];
  onBrand: (brand: string) => void;
  onViewAll: () => void;
};

function BrandFeaturedStrip({
  brands,
  onBrand,
  onViewAll,
  className,
}: {
  brands: string[];
  onBrand: (brand: string) => void;
  onViewAll: () => void;
  className?: string;
}) {
  if (brands.length === 0) return null;
  return (
    <section className={cn("mb-6 lg:mb-7", className)}>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 lg:gap-x-6">
        <p className="shrink-0 text-[13px] font-bold uppercase tracking-[0.04em] text-foreground">
          Destacadas
        </p>
        <div className="flex min-w-0 flex-wrap justify-center gap-2">
          {brands.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => onBrand(b)}
              className="rounded-md border border-border/35 bg-background px-3 py-1.5 text-[12.5px] font-medium text-foreground/85 transition-colors duration-150 hover:border-copper/35 hover:bg-copper/5 hover:text-copper"
            >
              {b}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-muted-foreground transition-[gap,color] duration-200 hover:gap-1.5 hover:text-copper"
        >
          Ver todas
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}

function BrandAlphaGrid({
  columns,
  onBrand,
  className,
}: {
  columns: Array<{ label: string; items: string[] }>;
  onBrand: (brand: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid w-full grid-cols-5 items-start", megaGutterGrid, className)}>
      {columns.map((col) => (
        <div key={col.label} className="min-w-0 text-center">
          <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.04em] text-foreground">
            {col.label.replace("Marcas ", "")}
          </p>
          <ul className="space-y-0.5">
            {col.items.length > 0 ? (
              col.items.map((b) => (
                <li key={b}>
                  <button
                    type="button"
                    onClick={() => onBrand(b)}
                    className="block w-full py-1 text-center text-[13.5px] leading-snug text-foreground/80 transition-colors duration-150 hover:text-copper"
                  >
                    {b}
                  </button>
                </li>
              ))
            ) : (
              <li className="py-1 text-[13px] text-muted-foreground/30">—</li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function BrandsMegaMenu({
  brandColumns,
  sortedBrands,
  onBrand,
  onViewAll,
}: BrandsMegaMenuProps) {
  const featured = FEATURED_BRAND_CANDIDATES.filter((b) =>
    sortedBrands.includes(b),
  ).slice(0, 9);

  return (
    <div className={megaMenuShell}>
      <BrandFeaturedStrip
        brands={featured}
        onBrand={onBrand}
        onViewAll={onViewAll}
        className={cn(MEGA_GUTTER_VARS, "px-[var(--mega-gutter)]")}
      />

      <BrandAlphaGrid columns={brandColumns} onBrand={onBrand} />
    </div>
  );
}

/* ── Mobile helpers ──────────────────────────────────────────────── */

export function MobileCatalogFamily({
  family,
  isActiveItem,
  onCategory,
  onItem,
}: {
  family: CatalogFamily;
  isActiveItem: (item: CatalogMenuItem) => boolean;
  onCategory: (cat: string) => void;
  onItem: (item: CatalogMenuItem) => void;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/50 p-3.5">
      <button
        type="button"
        onClick={() => onCategory(family.cat)}
        className="group flex w-full items-center justify-between text-left"
      >
        <span className="font-display text-sm font-semibold tracking-tight text-foreground">
          {family.title}
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 text-copper/70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>
      <ul className="mt-3 space-y-2">
        {family.items.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              onClick={() => onItem(item)}
              className={cn(
                "text-left text-[12px] transition-colors",
                isActiveItem(item)
                  ? "font-medium text-foreground/85"
                  : "text-muted-foreground/60",
              )}
            >
              {item.label}
            </button>
            {item.children && item.children.length > 0 && (
              <ul className="mt-1.5 space-y-1 border-l border-border/30 pl-3">
                {item.children.map((child) => (
                  <li key={`${item.label}-${child.label}`}>
                    <button
                      type="button"
                      onClick={() => onItem(child)}
                      className={cn(
                        "text-left text-[11px] transition-colors",
                        isActiveItem(child)
                          ? "text-foreground/80"
                          : "text-muted-foreground/55",
                      )}
                    >
                      {child.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
