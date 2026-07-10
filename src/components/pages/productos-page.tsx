"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CatalogProduct } from "@/lib/catalog/types";
import {
  CATALOG_FAMILIES,
  catalogMultiFilterFromSearchParams,
  catalogMultiFilterToHref,
  catalogTypeKey,
  catalogVariantKey,
  clearCatalogMultiFilterFamilyBranch,
  clearCatalogMultiFilterTypeBranch,
  cloneCatalogMultiFilter,
  EMPTY_CATALOG_MULTI_FILTER,
  normalizeCatalogMultiFilter,
  productMatchesMultiCatalogFilter,
  type CatalogFamily,
  type CatalogMenuItem,
  type CatalogMultiFilterSelection,
} from "@/lib/navigation/catalog-taxonomy";
import { ProductCard } from "@/components/catalog/product-card";
import { SitePageHero } from "@/components/site/site-page-hero";
import { SiteClosingCta } from "@/components/site/site-closing-cta";
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

const PRICE_MIN = 0;
const PRICE_MAX = 30000;
const PRICE_STEP = 50;

function snapPrice(value: number) {
  const snapped = Math.round(value / PRICE_STEP) * PRICE_STEP;
  return Math.min(PRICE_MAX, Math.max(PRICE_MIN, snapped));
}

type ActiveFilterChip = {
  id: string;
  label: string;
  remove: () => void;
};

function buildFilterChips(
  filter: CatalogMultiFilterSelection,
  onUpdate: (next: CatalogMultiFilterSelection) => void,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  for (const familyCat of filter.families) {
    const meta = CATALOG_FAMILIES.find((f) => f.cat === familyCat);
    chips.push({
      id: `family:${familyCat}`,
      label: meta?.title ?? familyCat,
      remove: () => {
        const next = cloneCatalogMultiFilter(filter);
        next.families.delete(familyCat);
        onUpdate(next);
      },
    });
  }

  for (const typeKey of filter.types) {
    const sep = typeKey.indexOf("::");
    const typeLabel = sep === -1 ? typeKey : typeKey.slice(sep + 2);
    chips.push({
      id: `type:${typeKey}`,
      label: typeLabel,
      remove: () => {
        const next = cloneCatalogMultiFilter(filter);
        next.types.delete(typeKey);
        onUpdate(next);
      },
    });
  }

  for (const variantKey of filter.variants) {
    const parts = variantKey.split("::");
    const variantLabel = parts.length >= 3 ? parts.slice(2).join("::") : variantKey;
    chips.push({
      id: `variant:${variantKey}`,
      label: variantLabel,
      remove: () => {
        const next = cloneCatalogMultiFilter(filter);
        next.variants.delete(variantKey);
        onUpdate(next);
      },
    });
  }

  return chips;
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
}: {
  products: CatalogProduct[];
  /** @deprecated El sidebar usa CATALOG_FAMILIES; se conserva por compatibilidad de ruta. */
  activeCategoryNames?: string[];
  activeSubcategoryNames?: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = {
    cat: searchParams.get("cat") ?? undefined,
    sub: searchParams.get("sub") ?? undefined,
    brand: searchParams.get("brand") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    tipo: searchParams.get("tipo") ?? undefined,
    instrumento: searchParams.get("instrumento") ?? undefined,
    cats: searchParams.get("cats") ?? undefined,
    types: searchParams.get("types") ?? undefined,
    variants: searchParams.get("variants") ?? undefined,
  };

  const [size, setSize] = useState<"lg" | "md" | "list">("md");
  const [sort, setSort] = useState<SortKey>("default");
  const [catalogMultiFilter, setCatalogMultiFilter] =
    useState<CatalogMultiFilterSelection>(EMPTY_CATALOG_MULTI_FILTER);
  /** Acordeón visual (independiente de filtros activos). */
  const [accordionFamilies, setAccordionFamilies] = useState<Set<string>>(new Set());
  const [accordionTypes, setAccordionTypes] = useState<Set<string>>(new Set());
  const [activeBrands, setActiveBrands] = useState<Set<string>>(new Set());
  const [price, setPrice] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);
  const [query, setQuery] = useState("");

  const allBrands = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.brand?.name).filter((b): b is string => Boolean(b))),
      ).sort(),
    [products],
  );

  const applyCatalogMultiFilter = useCallback(
    (next: CatalogMultiFilterSelection) => {
      const url = new URL(catalogMultiFilterToHref(next), "http://local");
      const brand = searchParams.get("brand");
      const q = searchParams.get("q");
      if (brand) url.searchParams.set("brand", brand);
      if (q) url.searchParams.set("q", q);
      router.replace(`${url.pathname}${url.search}`, { scroll: false });
    },
    [router, searchParams],
  );

  const updateCatalogMultiFilter = useCallback(
    (next: CatalogMultiFilterSelection) => {
      const normalized = normalizeCatalogMultiFilter(next);
      setCatalogMultiFilter(normalized);
      applyCatalogMultiFilter(normalized);
    },
    [applyCatalogMultiFilter],
  );

  useEffect(() => {
    const fromUrl = catalogMultiFilterFromSearchParams(search);
    setCatalogMultiFilter(fromUrl);

    const openFamilies = new Set<string>();
    const openTypes = new Set<string>();

    for (const familyCat of fromUrl.families) openFamilies.add(familyCat);
    for (const typeKey of fromUrl.types) {
      const sep = typeKey.indexOf("::");
      if (sep !== -1) {
        openFamilies.add(typeKey.slice(0, sep));
        openTypes.add(typeKey);
      }
    }
    for (const variantKey of fromUrl.variants) {
      const parts = variantKey.split("::");
      if (parts.length >= 2) {
        openFamilies.add(parts[0]);
        openTypes.add(`${parts[0]}::${parts[1]}`);
      }
    }

    setAccordionFamilies(openFamilies);
    setAccordionTypes(openTypes);
    setActiveBrands(search.brand ? new Set([search.brand]) : new Set());
    setQuery(search.q ?? "");
  }, [
    search.cat,
    search.sub,
    search.brand,
    search.q,
    search.tipo,
    search.instrumento,
    search.cats,
    search.types,
    search.variants,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => {
      if (!productMatchesMultiCatalogFilter(p, catalogMultiFilter)) return false;
      const brand = p.brand?.name ?? "";
      if (activeBrands.size && !activeBrands.has(brand)) return false;
      if (p.price < price[0] || p.price > price[1]) return false;
      if (q) {
        const sub = p.subcategory?.name ?? "";
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
  }, [products, catalogMultiFilter, activeBrands, price, sort, query]);

  const toggle = <T,>(set: Set<T>, value: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    setter(next);
  };

  const toggleAccordionFamily = (familyCat: string) => {
    setAccordionFamilies((prev) => {
      const next = new Set(prev);
      next.has(familyCat) ? next.delete(familyCat) : next.add(familyCat);
      return next;
    });
  };

  const toggleAccordionType = (typeKeyValue: string) => {
    setAccordionTypes((prev) => {
      const next = new Set(prev);
      next.has(typeKeyValue) ? next.delete(typeKeyValue) : next.add(typeKeyValue);
      return next;
    });
  };

  const toggleFamilyFilter = (family: CatalogFamily) => {
    const next = cloneCatalogMultiFilter(catalogMultiFilter);
    if (next.families.has(family.cat)) {
      next.families.delete(family.cat);
    } else {
      next.families.add(family.cat);
      clearCatalogMultiFilterFamilyBranch(next, family.cat);
      setAccordionFamilies((prev) => new Set(prev).add(family.cat));
    }
    updateCatalogMultiFilter(next);
  };

  const toggleTypeFilter = (family: CatalogFamily, item: CatalogMenuItem) => {
    const tk = catalogTypeKey(family.cat, item.label);
    const next = cloneCatalogMultiFilter(catalogMultiFilter);
    if (next.types.has(tk)) {
      next.types.delete(tk);
    } else {
      next.types.add(tk);
      next.families.delete(family.cat);
      clearCatalogMultiFilterTypeBranch(next, tk);
      setAccordionFamilies((prev) => new Set(prev).add(family.cat));
      if (item.children?.length) {
        setAccordionTypes((prev) => new Set(prev).add(tk));
      }
    }
    updateCatalogMultiFilter(next);
  };

  const toggleVariantFilter = (
    family: CatalogFamily,
    item: CatalogMenuItem,
    child: CatalogMenuItem,
  ) => {
    const vk = catalogVariantKey(family.cat, item.label, child.label);
    const tk = catalogTypeKey(family.cat, item.label);
    const next = cloneCatalogMultiFilter(catalogMultiFilter);
    if (next.variants.has(vk)) {
      next.variants.delete(vk);
    } else {
      next.variants.add(vk);
      next.families.delete(family.cat);
      next.types.delete(tk);
      setAccordionFamilies((prev) => new Set(prev).add(family.cat));
      setAccordionTypes((prev) => new Set(prev).add(tk));
    }
    updateCatalogMultiFilter(next);
  };

  const clearFilters = () => {
    updateCatalogMultiFilter(EMPTY_CATALOG_MULTI_FILTER);
    setAccordionFamilies(new Set());
    setAccordionTypes(new Set());
    setActiveBrands(new Set());
    setPrice([PRICE_MIN, PRICE_MAX]);
    setQuery("");
    router.replace("/productos", { scroll: false });
  };

  const catalogFilterChips = useMemo(
    () => buildFilterChips(catalogMultiFilter, updateCatalogMultiFilter),
    [catalogMultiFilter, updateCatalogMultiFilter],
  );

  const activeFilterChips: string[] = [
    ...catalogFilterChips.map((c) => c.label),
    ...Array.from(activeBrands),
    ...(query ? [`"${query}"`] : []),
  ];

  const breadcrumbs = useMemo(() => {
    const brand = activeBrands.size === 1 ? Array.from(activeBrands)[0] : null;
    if (brand) return productosCatalogBreadcrumbs({ brand });
    const firstFamily = catalogMultiFilter.families.values().next().value as string | undefined;
    return productosCatalogBreadcrumbs({ category: firstFamily ?? null });
  }, [activeBrands, catalogMultiFilter.families]);

  const gridClass =
    size === "lg"
      ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      : size === "md"
      ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      : "flex flex-col gap-3";

  const filtersPanel = (
    <FiltersPanel
      accordionFamilies={accordionFamilies}
      accordionTypes={accordionTypes}
      catalogMultiFilter={catalogMultiFilter}
      catalogFilterChips={catalogFilterChips}
      activeBrands={activeBrands}
      setActiveBrands={setActiveBrands}
      price={price}
      setPrice={setPrice}
      allBrands={allBrands}
      toggle={toggle}
      toggleAccordionFamily={toggleAccordionFamily}
      toggleAccordionType={toggleAccordionType}
      toggleFamilyFilter={toggleFamilyFilter}
      toggleTypeFilter={toggleTypeFilter}
      toggleVariantFilter={toggleVariantFilter}
      clearFilters={clearFilters}
    />
  );

  return (
    <>
        <SitePageHero
          id="catalogo"
          breadcrumbs={breadcrumbs}
          title="Productos"
          description="Una colección pensada para músicos que buscan crear algo inolvidable."
        />

        <section className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-40 border-y border-border/60 bg-background/95 shadow-[0_8px_24px_-20px_rgba(0,0,0,0.25)] backdrop-blur-md md:top-20">
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
                    <div className="mt-6">{filtersPanel}</div>
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

        <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-8 pt-10 lg:grid-cols-[260px_1fr] lg:px-8 lg:pb-10">
          <aside className="hidden lg:sticky lg:top-40 lg:block lg:self-start lg:max-h-[calc(100dvh-11rem)] lg:overflow-y-auto lg:pb-8 lg:pr-4 [scrollbar-gutter:stable]">
            {filtersPanel}
          </aside>

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
  accordionFamilies: Set<string>;
  accordionTypes: Set<string>;
  catalogMultiFilter: CatalogMultiFilterSelection;
  catalogFilterChips: ActiveFilterChip[];
  activeBrands: Set<string>;
  setActiveBrands: (s: Set<string>) => void;
  price: [number, number];
  setPrice: (p: [number, number]) => void;
  allBrands: string[];
  toggle: <T,>(set: Set<T>, value: T, setter: (s: Set<T>) => void) => void;
  toggleAccordionFamily: (familyCat: string) => void;
  toggleAccordionType: (typeKeyValue: string) => void;
  toggleFamilyFilter: (family: CatalogFamily) => void;
  toggleTypeFilter: (family: CatalogFamily, item: CatalogMenuItem) => void;
  toggleVariantFilter: (family: CatalogFamily, item: CatalogMenuItem, child: CatalogMenuItem) => void;
  clearFilters: () => void;
};

function FiltersPanel({
  accordionFamilies,
  accordionTypes,
  catalogMultiFilter,
  catalogFilterChips,
  activeBrands,
  setActiveBrands,
  price,
  setPrice,
  allBrands,
  toggle,
  toggleAccordionFamily,
  toggleAccordionType,
  toggleFamilyFilter,
  toggleTypeFilter,
  toggleVariantFilter,
  clearFilters,
}: FiltersPanelProps) {
  return (
    <div className="pb-2">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Filtros</h2>
        <button onClick={clearFilters} className="text-xs text-copper hover:underline">Limpiar</button>
      </div>

      {catalogFilterChips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {catalogFilterChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={chip.remove}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-foreground/80 transition-colors hover:border-copper/50 hover:text-foreground"
            >
              {chip.label}
              <span className="text-muted-foreground" aria-hidden="true">
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-5">
        <p className="font-display text-base font-medium">Tipos de productos</p>
        <ul className="mt-3 space-y-1.5">
          {CATALOG_FAMILIES.map((family) => {
            const familyActive = catalogMultiFilter.families.has(family.cat);
            const familyOpen = accordionFamilies.has(family.cat);
            return (
              <li key={family.cat}>
                <div className="flex items-center gap-1 rounded-md px-1 py-0.5">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-1 text-sm text-foreground/80 hover:text-foreground">
                    <Checkbox
                      checked={familyActive}
                      onCheckedChange={() => toggleFamilyFilter(family)}
                    />
                    <span className={familyActive ? "font-semibold text-foreground" : ""}>
                      {family.title}
                    </span>
                  </label>
                  <button
                    type="button"
                    aria-label={`${familyOpen ? "Cerrar" : "Abrir"} ${family.title}`}
                    onClick={() => toggleAccordionFamily(family.cat)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                  >
                    <Plus
                      className={`h-3.5 w-3.5 transition-transform ${familyOpen ? "rotate-45" : ""}`}
                    />
                  </button>
                </div>

                {familyOpen && (
                  <ul className="mt-1 space-y-1 border-l border-border pl-3">
                    {family.items.map((item) => {
                      const tk = catalogTypeKey(family.cat, item.label);
                      const typeActive = catalogMultiFilter.types.has(tk);
                      const typeOpen = accordionTypes.has(tk);
                      const hasChildren = Boolean(item.children?.length);

                      return (
                        <li key={item.label}>
                          <div className="flex items-center gap-1 rounded-md px-1 py-0.5">
                            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-1 text-[13px] text-muted-foreground hover:text-foreground">
                              <Checkbox
                                checked={typeActive}
                                onCheckedChange={() => toggleTypeFilter(family, item)}
                              />
                              <span className={typeActive ? "font-semibold text-foreground" : ""}>
                                {item.label}
                              </span>
                            </label>
                            {hasChildren && (
                              <button
                                type="button"
                                aria-label={`${typeOpen ? "Cerrar" : "Abrir"} ${item.label}`}
                                onClick={() => toggleAccordionType(tk)}
                                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                              >
                                <Plus
                                  className={`h-3 w-3 transition-transform ${typeOpen ? "rotate-45" : ""}`}
                                />
                              </button>
                            )}
                          </div>

                          {hasChildren && typeOpen && (
                            <ul className="mt-1 space-y-0.5 border-l border-border/60 pl-3">
                              {item.children!.map((child) => {
                                const vk = catalogVariantKey(family.cat, item.label, child.label);
                                const variantActive = catalogMultiFilter.variants.has(vk);
                                return (
                                  <li key={child.label}>
                                    <label className="flex cursor-pointer items-center gap-2 py-1 text-[12px] text-muted-foreground hover:text-foreground">
                                      <Checkbox
                                        checked={variantActive}
                                        onCheckedChange={() =>
                                          toggleVariantFilter(family, item, child)
                                        }
                                      />
                                      <span className={variantActive ? "font-medium text-foreground" : ""}>
                                        {child.label}
                                      </span>
                                    </label>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
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
