"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/catalog/format";
import type { CatalogProduct } from "@/lib/catalog/types";
import { ProductCard } from "@/components/catalog/product-card";
import { SitePageHero } from "@/components/site/site-page-hero";
import { SiteClosingCta } from "@/components/site/site-closing-cta";
import { cn } from "@/lib/utils";
import { whatsappHref, SITE_CONTACT } from "@/lib/site-contact";
import { productosCatalogBreadcrumbs } from "@/lib/site/breadcrumbs";
import { siteShell } from "@/lib/design/site-shell";
import { LayoutGrid, Grid2x2, List, Plus, SlidersHorizontal } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortKey =
  | "default"
  | "price-asc"
  | "price-desc"
  | "az"
  | "za"
  | "new";

/** Orden preferido de categorías; las no listadas van al final. */
const CATEGORY_ORDER = ["Instrumentos", "Accesorios", "Equipos de Audio"];

const PRICE_MIN = 0;
const PRICE_MAX = 30000;
const PRICE_STEP = 50;

function snapPrice(value: number) {
  const snapped = Math.round(value / PRICE_STEP) * PRICE_STEP;
  return Math.min(PRICE_MAX, Math.max(PRICE_MIN, snapped));
}

function PriceRangeFields({
  price,
  setPrice,
}: {
  price: [number, number];
  setPrice: (value: [number, number]) => void;
}) {
  const [minText, setMinText] = useState(String(price[0]));
  const [maxText, setMaxText] = useState(String(price[1]));

  useEffect(() => {
    setMinText(String(price[0]));
    setMaxText(String(price[1]));
  }, [price[0], price[1]]);

  const commitMin = () => {
    const parsed = Number(minText);
    if (minText.trim() === "" || Number.isNaN(parsed)) {
      setMinText(String(price[0]));
      return;
    }
    const next = snapPrice(parsed);
    setPrice([Math.min(next, price[1]), price[1]]);
  };

  const commitMax = () => {
    const parsed = Number(maxText);
    if (maxText.trim() === "" || Number.isNaN(parsed)) {
      setMaxText(String(price[1]));
      return;
    }
    const next = snapPrice(parsed);
    setPrice([price[0], Math.max(next, price[0])]);
  };

  return (
    <div className="mt-4 flex items-center gap-2">
      <label className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[12px] text-muted-foreground">
          $
        </span>
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={minText}
          onChange={(e) => setMinText(e.target.value.replace(/[^\d]/g, ""))}
          onBlur={commitMin}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="h-9 pl-7 pr-2 text-[13px] tabular-nums"
          aria-label="Precio mínimo"
        />
      </label>
      <span className="shrink-0 text-[12px] text-muted-foreground">a</span>
      <label className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[12px] text-muted-foreground">
          $
        </span>
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={maxText}
          onChange={(e) => setMaxText(e.target.value.replace(/[^\d]/g, ""))}
          onBlur={commitMax}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="h-9 pl-7 pr-2 text-[13px] tabular-nums"
          aria-label="Precio máximo"
        />
      </label>
    </div>
  );
}

export function ProductosPage({
  products,
  activeCategoryNames,
  activeSubcategoryNames,
}: {
  products: CatalogProduct[];
  /** Nombres de categorías/subcategorías activas para filtrar opciones. */
  activeCategoryNames?: string[];
  activeSubcategoryNames?: string[];
}) {
  const searchParams = useSearchParams();
  const search = {
    cat: searchParams.get("cat") ?? undefined,
    sub: searchParams.get("sub") ?? undefined,
    brand: searchParams.get("brand") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  };
  const [size, setSize] = useState<"lg" | "md" | "list">("md");
  const [sort, setSort] = useState<SortKey>("default");
  const [openCat, setOpenCat] = useState<string | null>("Instrumentos");
  const [activeCats, setActiveCats] = useState<Set<string>>(new Set());
  const [activeSubs, setActiveSubs] = useState<Set<string>>(new Set());
  const [activeBrands, setActiveBrands] = useState<Set<string>>(new Set());
  const [price, setPrice] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);
  const [query, setQuery] = useState("");

  // Taxonomía derivada de los productos reales (categoría → subcategorías).
  // Si se proveen nombres activos, solo se ofrecen como filtro los activos
  // (las categorías/subcategorías ocultas no aparecen como opción).
  const { categoryTree, allCategories, allSubs } = useMemo(() => {
    const catActive = activeCategoryNames ? new Set(activeCategoryNames) : null;
    const subActive = activeSubcategoryNames ? new Set(activeSubcategoryNames) : null;
    const tree: Record<string, string[]> = {};
    for (const p of products) {
      const cat = p.category?.name;
      const sub = p.subcategory?.name;
      if (!cat || (catActive && !catActive.has(cat))) continue;
      if (!tree[cat]) tree[cat] = [];
      if (sub && (!subActive || subActive.has(sub)) && !tree[cat].includes(sub)) {
        tree[cat].push(sub);
      }
    }
    const cats = Object.keys(tree).sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    return { categoryTree: tree, allCategories: cats, allSubs: Object.values(tree).flat() };
  }, [products, activeCategoryNames, activeSubcategoryNames]);

  const allBrands = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.brand?.name).filter((b): b is string => Boolean(b))),
      ).sort(),
    [products],
  );

  useEffect(() => {
    if (search.cat && allCategories.includes(search.cat)) {
      setActiveCats(new Set([search.cat]));
      setOpenCat(search.cat);
    } else {
      setActiveCats(new Set());
    }
    if (search.sub && allSubs.includes(search.sub)) {
      setActiveSubs(new Set([search.sub]));
      const parent = allCategories.find((c) => categoryTree[c]?.includes(search.sub!));
      if (parent) setOpenCat(parent);
    } else {
      setActiveSubs(new Set());
    }
    setActiveBrands(search.brand ? new Set([search.brand]) : new Set());
    setQuery(search.q ?? "");
  }, [search.cat, search.sub, search.brand, search.q, allCategories, allSubs, categoryTree]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => {
      const cat = p.category?.name ?? "";
      const sub = p.subcategory?.name ?? "";
      const brand = p.brand?.name ?? "";
      if (activeCats.size && !activeCats.has(cat)) return false;
      if (activeSubs.size && !activeSubs.has(sub)) return false;
      if (activeBrands.size && !activeBrands.has(brand)) return false;
      if (p.price < price[0] || p.price > price[1]) return false;
      if (q) {
        const hay = `${p.name} ${brand} ${sub}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    switch (sort) {
      case "price-asc": list = [...list].sort((a, b) => a.price - b.price); break;
      case "price-desc": list = [...list].sort((a, b) => b.price - a.price); break;
      case "az": list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break;
      case "za": list = [...list].sort((a, b) => b.name.localeCompare(a.name)); break;
      case "new": list = [...list].sort((a, b) => Number(b.isNew) - Number(a.isNew)); break;
      default: {
        const order: Record<string, number> = { Instrumentos: 0, Accesorios: 1, "Equipos de Audio": 2 };
        list = [...list].sort((a, b) => {
          const c = (order[a.category?.name ?? ""] ?? 99) - (order[b.category?.name ?? ""] ?? 99);
          if (c !== 0) return c;
          return (a.subcategory?.name ?? "").localeCompare(b.subcategory?.name ?? "");
        });
      }
    }
    return list;
  }, [products, activeCats, activeSubs, activeBrands, price, sort, query]);

  const toggle = <T,>(set: Set<T>, value: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    setter(next);
  };

  const clearFilters = () => {
    setActiveCats(new Set());
    setActiveSubs(new Set());
    setActiveBrands(new Set());
    setPrice([PRICE_MIN, PRICE_MAX]);
    setQuery("");
  };

  const activeFilterChips: string[] = [
    ...Array.from(activeCats),
    ...Array.from(activeSubs),
    ...Array.from(activeBrands),
    ...(query ? [`"${query}"`] : []),
  ];

  const breadcrumbs = useMemo(() => {
    const brand = activeBrands.size === 1 ? Array.from(activeBrands)[0] : null;
    if (brand) {
      return productosCatalogBreadcrumbs({ brand });
    }

    const cat = activeCats.size === 1 ? Array.from(activeCats)[0] : null;
    const sub = activeSubs.size === 1 ? Array.from(activeSubs)[0] : null;
    const topCategory =
      cat ??
      (sub ? allCategories.find((c) => categoryTree[c]?.includes(sub)) ?? null : null);

    return productosCatalogBreadcrumbs({ category: topCategory });
  }, [activeCats, activeSubs, activeBrands, allCategories, categoryTree]);

  const gridClass =
    size === "lg"
      ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      : size === "md"
      ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      : "flex flex-col gap-3";

  return (
    <>
        {/* Header — fondo oscuro bajo el nav fijo */}
        <SitePageHero
          id="catalogo"
          breadcrumbs={breadcrumbs}
          title="Productos"
          description="Una colección pensada para músicos que buscan crear algo inolvidable."
        />


        {/* Toolbar */}
        <section className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-40 border-y border-border/60 bg-background max-lg:shadow-none md:top-20 lg:bg-background/95 lg:shadow-[0_8px_24px_-20px_rgba(0,0,0,0.25)] lg:backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div className="grid gap-2 py-2.5 max-md:grid-cols-1 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-3 md:py-3">
              <div className="flex min-w-0 items-center justify-between gap-2 max-md:gap-1.5">
                <div className="flex min-w-0 items-center gap-1.5">
                <Sheet>
                  <SheetTrigger asChild>
                    <button
                      aria-label="Filtros"
                      className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-semibold uppercase tracking-wider hover:border-copper/60 hover:text-copper lg:hidden"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Filtros
                      {activeFilterChips.length > 0 && (
                        <span className="grid h-4 min-w-4 place-items-center rounded-full bg-copper px-1 text-[10px] font-semibold text-copper-foreground">
                          {activeFilterChips.length}
                        </span>
                      )}
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto bg-background">
                    <SheetHeader className="text-left">
                      <SheetTitle className="font-display text-lg font-semibold tracking-tight">Filtros</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FiltersPanel
                        openCat={openCat}
                        setOpenCat={setOpenCat}
                        activeCats={activeCats}
                        setActiveCats={setActiveCats}
                        activeSubs={activeSubs}
                        setActiveSubs={setActiveSubs}
                        activeBrands={activeBrands}
                        setActiveBrands={setActiveBrands}
                        price={price}
                        setPrice={setPrice}
                        allBrands={allBrands}
                        allCategories={allCategories}
                        categoryTree={categoryTree}
                        toggle={toggle}
                        clearFilters={clearFilters}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
                  {[
                    { k: "lg", I: LayoutGrid },
                    { k: "md", I: Grid2x2 },
                    { k: "list", I: List },
                  ].map(({ k, I }) => (
                    <button
                      key={k}
                      onClick={() => setSize(k as typeof size)}
                      aria-label={`Vista ${k}`}
                      className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${
                        size === k
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <I className="h-4 w-4" />
                    </button>
                  ))}
                </div>

                </div>

                <p className="shrink-0 text-xs text-muted-foreground md:hidden">
                  {filtered.length} productos
                </p>
              </div>

              <p className="hidden text-center text-xs text-muted-foreground sm:text-sm md:block">
                <span className="sm:hidden">{filtered.length} productos</span>
                <span className="hidden sm:inline">
                  Mostrando <span className="font-semibold text-foreground">{filtered.length}</span> de {products.length} productos
                </span>
              </p>

              <div className="max-md:w-full max-md:justify-self-stretch md:justify-self-end">
                <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                  <SelectTrigger className="h-9 w-full rounded-full border-border bg-card text-xs sm:h-10 sm:text-sm md:w-[150px] max-md:max-w-none sm:w-[210px]">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Por categorías</SelectItem>
                    <SelectItem value="price-asc">Precio: menor a mayor</SelectItem>
                    <SelectItem value="price-desc">Precio: mayor a menor</SelectItem>
                    <SelectItem value="az">Alfabéticamente A-Z</SelectItem>
                    <SelectItem value="za">Alfabéticamente Z-A</SelectItem>
                    <SelectItem value="new">Nuevos productos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Layout */}
        <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-8 pt-10 lg:grid-cols-[260px_1fr] lg:px-8 lg:pb-10">
          {/* Sidebar filters (desktop) */}
          <aside className="hidden lg:sticky lg:top-40 lg:block lg:self-start lg:max-h-[calc(100dvh-11rem)] lg:overflow-y-auto lg:pb-8 lg:pr-4 [scrollbar-gutter:stable]">
            <FiltersPanel
              openCat={openCat}
              setOpenCat={setOpenCat}
              activeCats={activeCats}
              setActiveCats={setActiveCats}
              activeSubs={activeSubs}
              setActiveSubs={setActiveSubs}
              activeBrands={activeBrands}
              setActiveBrands={setActiveBrands}
              price={price}
              setPrice={setPrice}
              allBrands={allBrands}
              allCategories={allCategories}
              categoryTree={categoryTree}
              toggle={toggle}
              clearFilters={clearFilters}
            />
          </aside>

          {/* Grid */}
          <div className="min-w-0 w-full max-w-full">

            {filtered.length === 0 ? (
              <div className={siteShell.emptyState}>
                <p className="font-display text-lg font-medium text-foreground">Sin resultados</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Prueba ajustando filtros o términos de búsqueda.
                </p>
                <button onClick={clearFilters} className="mt-4 text-sm font-medium text-copper hover:underline">
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className={gridClass}>
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    variant={size === "list" ? "row" : size === "md" ? "compact" : "grid"}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <SiteClosingCta
          className="mt-0 pt-0 pb-14 md:pt-1 md:pb-20"
          eyebrow="¿No encuentras lo que buscas?"
          title="Te lo conseguimos"
          description="Nuestro catálogo crece cada semana y también hacemos pedidos especiales. Dinos qué instrumento, marca o modelo necesitas y lo localizamos por ti."
          primary={{
            label: "Pedir por WhatsApp",
            href: whatsappHref(SITE_CONTACT.whatsapp.e164, "Hola, busco un producto que no encontré en el catálogo:"),
            external: true,
          }}
          secondary={{ label: "Explorar marcas", href: "/marcas" }}
        />
    </>
  );
}

type FiltersPanelProps = {
  openCat: string | null;
  setOpenCat: (c: string | null) => void;
  activeCats: Set<string>;
  setActiveCats: (s: Set<string>) => void;
  activeSubs: Set<string>;
  setActiveSubs: (s: Set<string>) => void;
  activeBrands: Set<string>;
  setActiveBrands: (s: Set<string>) => void;
  price: [number, number];
  setPrice: (p: [number, number]) => void;
  allBrands: string[];
  allCategories: string[];
  categoryTree: Record<string, string[]>;
  toggle: <T,>(set: Set<T>, value: T, setter: (s: Set<T>) => void) => void;
  clearFilters: () => void;
};

function FiltersPanel({
  openCat, setOpenCat, activeCats, setActiveCats,
  activeSubs, setActiveSubs, activeBrands, setActiveBrands,
  price, setPrice, allBrands, allCategories, categoryTree, toggle, clearFilters,
}: FiltersPanelProps) {
  return (
    <div className="pb-2">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Filtros</h2>
        <button onClick={clearFilters} className="text-xs text-copper hover:underline">Limpiar</button>
      </div>

      <div className="mt-5">
        <p className="font-display text-base font-medium">Tipos de productos</p>
        <ul className="mt-3 space-y-1.5">
          {allCategories.map((cat) => (
            <li key={cat}>
              <button
                onClick={() => {
                  setOpenCat(openCat === cat ? null : cat);
                  toggle(activeCats, cat, setActiveCats);
                }}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                  activeCats.has(cat)
                    ? "bg-foreground/5 font-semibold text-foreground"
                    : "text-foreground/80 hover:bg-foreground/5"
                }`}
              >
                <span>{cat}</span>
                <Plus className={`h-3.5 w-3.5 transition-transform ${openCat === cat ? "rotate-45" : ""}`} />
              </button>
              {openCat === cat && (
                <ul className="mt-1 space-y-1 border-l border-border pl-3">
                  {(categoryTree[cat] ?? []).map((sub) => (
                    <li key={sub}>
                      <label className="flex cursor-pointer items-center gap-2 py-1 text-[13px] text-muted-foreground hover:text-foreground">
                        <Checkbox
                          checked={activeSubs.has(sub)}
                          onCheckedChange={() => toggle(activeSubs, sub, setActiveSubs)}
                        />
                        {sub}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-7 border-t border-border pt-6">
        <p className="font-display text-base font-medium">Marca</p>
        <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto pr-1">
          {allBrands.map((b) => (
            <li key={b}>
              <label className="flex cursor-pointer items-center gap-2 py-1 text-[13px] text-foreground/80 hover:text-foreground">
                <Checkbox
                  checked={activeBrands.has(b)}
                  onCheckedChange={() => toggle(activeBrands, b, setActiveBrands)}
                />
                {b}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-7 border-t border-border pb-10 pt-6">
        <p className="font-display text-base font-medium">Precio</p>
        <div className="mt-4 px-1 py-2 touch-pan-x" onPointerDown={(e) => e.stopPropagation()}>
          <Slider
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            minStepsBetweenThumbs={0}
            value={price}
            onValueChange={(v) =>
              setPrice([snapPrice(v[0]), snapPrice(v[1])] as [number, number])
            }
            className="max-md:py-2"
          />
        </div>
        <PriceRangeFields price={price} setPrice={setPrice} />
      </div>
    </div>
  );
}
