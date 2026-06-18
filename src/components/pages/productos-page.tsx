"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  PRODUCTS,
  CATEGORY_TREE,
  formatPrice,
  type Category,
  type Subcategory,
  type Product,
} from "@/lib/products";
import { LayoutGrid, Grid2x2, List, Plus, ArrowUpRight, SlidersHorizontal, X, Heart } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { useQuote } from "@/hooks/use-quote";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
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

const ALL_CATEGORIES: Category[] = ["Instrumentos", "Accesorios", "Equipos de Audio"];
const ALL_SUBS = Object.values(CATEGORY_TREE).flat() as Subcategory[];

const PRICE_MIN = 0;
const PRICE_MAX = 30000;

export function ProductosPage() {
  const searchParams = useSearchParams();
  const search = {
    cat: searchParams.get("cat") ?? undefined,
    sub: searchParams.get("sub") ?? undefined,
    brand: searchParams.get("brand") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  };
  const [size, setSize] = useState<"lg" | "md" | "list">("md");
  const [sort, setSort] = useState<SortKey>("default");
  const [openCat, setOpenCat] = useState<Category | null>("Instrumentos");
  const [activeCats, setActiveCats] = useState<Set<Category>>(new Set());
  const [activeSubs, setActiveSubs] = useState<Set<Subcategory>>(new Set());
  const [activeBrands, setActiveBrands] = useState<Set<string>>(new Set());
  const [price, setPrice] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (search.cat && (ALL_CATEGORIES as string[]).includes(search.cat)) {
      setActiveCats(new Set([search.cat as Category]));
      setOpenCat(search.cat as Category);
    } else {
      setActiveCats(new Set());
    }
    if (search.sub && (ALL_SUBS as string[]).includes(search.sub)) {
      const sub = search.sub as Subcategory;
      setActiveSubs(new Set([sub]));
      const parent = (Object.keys(CATEGORY_TREE) as Category[]).find((c) =>
        CATEGORY_TREE[c].includes(sub),
      );
      if (parent) setOpenCat(parent);
    } else {
      setActiveSubs(new Set());
    }
    setActiveBrands(search.brand ? new Set([search.brand]) : new Set());
    setQuery(search.q ?? "");
  }, [search.cat, search.sub, search.brand, search.q]);

  const allBrands = useMemo(
    () => Array.from(new Set(PRODUCTS.map((p) => p.brand))).sort(),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = PRODUCTS.filter((p) => {
      if (activeCats.size && !activeCats.has(p.category)) return false;
      if (activeSubs.size && !activeSubs.has(p.subcategory)) return false;
      if (activeBrands.size && !activeBrands.has(p.brand)) return false;
      if (p.price < price[0] || p.price > price[1]) return false;
      if (q) {
        const hay = `${p.name} ${p.brand} ${p.subcategory}`.toLowerCase();
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
        const order = { Instrumentos: 0, Accesorios: 1, "Equipos de Audio": 2 } as const;
        list = [...list].sort((a, b) => {
          const c = order[a.category] - order[b.category];
          if (c !== 0) return c;
          return a.subcategory.localeCompare(b.subcategory);
        });
      }
    }
    return list;
  }, [activeCats, activeSubs, activeBrands, price, sort, query]);

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

  const gridClass =
    size === "lg"
      ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      : size === "md"
      ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      : "flex flex-col gap-3";

  return (
    <div className="pt-28 md:pt-32">
        {/* Header */}
        <section id="catalogo" className="mx-auto max-w-7xl px-5 md:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Catálogo
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Productos
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            {PRODUCTS.length}+ instrumentos seleccionados y equipo de audio profesional para todos los niveles.
          </p>
        </section>


        {/* Toolbar */}
        <section className="sticky top-16 z-30 mt-12 border-y border-border/60 bg-background/85 backdrop-blur-xl md:top-20">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3 md:px-8">
            <div className="flex items-center gap-2">
              {/* Filters trigger — always visible (sheet on mobile, button still useful on desktop) */}
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    aria-label="Filtros"
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-semibold uppercase tracking-wider hover:border-copper/60 hover:text-copper md:hidden"
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
                      toggle={toggle}
                      clearFilters={clearFilters}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              <div className="hidden items-center gap-1.5 rounded-full border border-border bg-card p-1 sm:flex">
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

            <p className="hidden text-sm text-muted-foreground lg:block">
              Mostrando <span className="font-semibold text-foreground">{filtered.length}</span> de {PRODUCTS.length} productos
            </p>

            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="h-9 w-[150px] rounded-full border-border bg-card text-xs sm:h-10 sm:w-[210px] sm:text-sm">
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

          {activeFilterChips.length > 0 && (
            <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-5 pb-3 md:px-8">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Filtrando:
              </span>
              {activeFilterChips.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1.5 rounded-full border border-copper/40 bg-copper/10 px-3 py-1 text-xs font-medium text-copper"
                >
                  {chip}
                </span>
              ))}
              <button onClick={clearFilters} className="ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" /> Limpiar
              </button>
            </div>
          )}
        </section>

        {/* Layout */}
        <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-24 pt-10 md:grid-cols-[260px_1fr] md:px-8 md:pb-32">
          {/* Sidebar filters (desktop) */}
          <aside className="hidden md:sticky md:top-40 md:block md:self-start md:max-h-[calc(100vh-11rem)] md:overflow-y-auto md:pr-2">
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
              toggle={toggle}
              clearFilters={clearFilters}
            />
          </aside>

          {/* Grid */}
          <div>

            {filtered.length === 0 ? (
              <div className="grid place-items-center rounded-2xl border border-dashed border-border py-24 text-center">
                <p className="text-muted-foreground">Sin resultados con esos filtros.</p>
                <button onClick={clearFilters} className="mt-4 text-sm text-copper hover:underline">
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className={gridClass}>
                {filtered.map((p) =>
                  size === "list" ? <RowCard key={p.id} p={p} /> : <Card key={p.id} p={p} compact={size === "md"} />,
                )}
              </div>
            )}
          </div>
        </section>
    </div>
  );
}

type FiltersPanelProps = {
  openCat: Category | null;
  setOpenCat: (c: Category | null) => void;
  activeCats: Set<Category>;
  setActiveCats: (s: Set<Category>) => void;
  activeSubs: Set<Subcategory>;
  setActiveSubs: (s: Set<Subcategory>) => void;
  activeBrands: Set<string>;
  setActiveBrands: (s: Set<string>) => void;
  price: [number, number];
  setPrice: (p: [number, number]) => void;
  allBrands: string[];
  toggle: <T,>(set: Set<T>, value: T, setter: (s: Set<T>) => void) => void;
  clearFilters: () => void;
};

function FiltersPanel({
  openCat, setOpenCat, activeCats, setActiveCats,
  activeSubs, setActiveSubs, activeBrands, setActiveBrands,
  price, setPrice, allBrands, toggle, clearFilters,
}: FiltersPanelProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Filtros</h2>
        <button onClick={clearFilters} className="text-xs text-copper hover:underline">Limpiar</button>
      </div>

      <div className="mt-5">
        <p className="font-display text-base font-medium">Tipos de productos</p>
        <ul className="mt-3 space-y-1.5">
          {ALL_CATEGORIES.map((cat) => (
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
                  {CATEGORY_TREE[cat].map((sub) => (
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

      <div className="mt-7 border-t border-border pt-6">
        <p className="font-display text-base font-medium">Precio</p>
        <div className="mt-4 px-1">
          <Slider
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={500}
            value={price}
            onValueChange={(v) => setPrice([v[0], v[1]] as [number, number])}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-[12px] text-muted-foreground">
          <span>{formatPrice(price[0])}</span>
          <span>{formatPrice(price[1])}</span>
        </div>
      </div>
    </div>
  );
}

function Card({ p, compact }: { p: Product; compact: boolean }) {
  const { has, toggle } = useFavorites();
  const isFav = has(p.id);
  const { has: inQuote, toggle: toggleQuote } = useQuote();
  const isQuoted = inQuote(p.id);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-copper/40 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.25)]">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={p.image}
          alt={p.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {p.isNew && (
          <span className="absolute left-3 top-3 rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-background">
            Nuevo
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); toggle(p.id); }}
          aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-foreground hover:text-background"
        >
          <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
        </button>
      </div>
      <div className={`flex flex-1 flex-col ${compact ? "p-3" : "p-5"}`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-copper">
          {p.brand}
        </p>
        <h3 className={`mt-1 font-display font-medium leading-tight text-foreground line-clamp-2 ${compact ? "text-sm" : "text-base"}`}>
          {p.name}
        </h3>
        <div className="mt-auto pt-3">
          <p className={`font-display font-semibold ${compact ? "text-base" : "text-lg"}`}>
            {formatPrice(p.price)}
          </p>
          <button
            type="button"
            onClick={() => toggleQuote(p.id)}
            aria-label={isQuoted ? "Quitar de cotización" : "Agregar a cotización"}
            className={cn(
              "mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors",
              isQuoted
                ? "bg-secondary text-foreground ring-1 ring-foreground/20 hover:bg-secondary/80"
                : "bg-foreground text-background hover:bg-copper hover:text-copper-foreground",
            )}
          >
            <Plus className="h-3 w-3" /> {isQuoted ? "En cotización" : "Cotizar"}
          </button>
        </div>
      </div>
    </article>
  );
}

function RowCard({ p }: { p: Product }) {
  const { has, toggle } = useFavorites();
  const isFav = has(p.id);
  const { has: inQuote, toggle: toggleQuote } = useQuote();
  const isQuoted = inQuote(p.id);
  return (
    <article className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-copper/40 md:p-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted md:h-24 md:w-24">
        <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-copper">{p.brand}</p>
        <h3 className="truncate font-display text-base font-medium md:text-lg">{p.name}</h3>
        <p className="text-xs text-muted-foreground">{p.subcategory}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <p className="font-display text-base font-semibold md:text-lg">{formatPrice(p.price)}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggle(p.id)}
            aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
            className="grid h-8 w-8 place-items-center rounded-full border border-border text-foreground/80 hover:border-foreground hover:text-foreground"
          >
            <Heart className={`h-3.5 w-3.5 ${isFav ? "fill-current" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => toggleQuote(p.id)}
            aria-label={isQuoted ? "Quitar de cotización" : "Agregar a cotización"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors",
              isQuoted
                ? "bg-secondary text-foreground ring-1 ring-foreground/20"
                : "bg-foreground text-background hover:bg-copper hover:text-copper-foreground",
            )}
          >
            <Plus className="h-3 w-3" /> {isQuoted ? "Añadido" : "Cotizar"}
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </article>
  );
}
