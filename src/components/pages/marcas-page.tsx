"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { BRANDS } from "@/lib/products";
import { formatPrice } from "@/lib/catalog/format";
import type { CatalogProduct } from "@/lib/catalog/types";
import { ArrowUpRight } from "lucide-react";


export function MarcasPage({ products }: { products: CatalogProduct[] }) {
  const searchParams = useSearchParams();
  const search = { b: searchParams.get("b") ?? undefined };
  const targetRef = useRef<HTMLDivElement | null>(null);

  // Brands grouped with their products (only brands that have products)
  const brandSections = useMemo(() => {
    const map = new Map<string, CatalogProduct[]>();
    products.forEach((p) => {
      const brand = p.brand?.name;
      if (!brand) return;
      if (!map.has(brand)) map.set(brand, []);
      map.get(brand)!.push(p);
    });
    // BRANDS order first (only those with products), then any extra real brands.
    const ordered = [
      ...BRANDS.filter((b) => map.has(b)),
      ...Array.from(map.keys())
        .filter((b) => !BRANDS.includes(b))
        .sort(),
    ];
    return ordered.map((b) => ({ brand: b, products: map.get(b)! }));
  }, [products]);

  // Brands without products yet (for the "próximamente" strip)
  const upcomingBrands = useMemo(
    () => BRANDS.filter((b) => !brandSections.some((s) => s.brand === b)),
    [brandSections],
  );

  useEffect(() => {
    if (search.b) {
      const id = `brand-${search.b.toLowerCase().replace(/\s+/g, "-")}`;
      const el = document.getElementById(id);
      if (el) {
        setTimeout(
          () => el.scrollIntoView({ behavior: "smooth", block: "start" }),
          80,
        );
      }
    }
  }, [search.b]);

  return (
    <div className="pt-28 md:pt-32">
      
        {/* Hero */}
        <section id="marcas" className="mx-auto max-w-7xl px-5 md:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Marcas
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Las marcas que tocan los profesionales
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            Recorre cada fabricante y descubre los productos disponibles. Distribuidor autorizado con garantía de origen.
          </p>
        </section>


        {/* Quick brand index */}
        <section className="sticky top-16 z-30 mt-12 border-y border-border/60 bg-background/85 backdrop-blur-xl md:top-20">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 md:px-8">
            {brandSections.map((s) => (
              <a
                key={s.brand}
                href={`#brand-${s.brand.toLowerCase().replace(/\s+/g, "-")}`}
                className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-copper hover:text-copper"
              >
                {s.brand}
              </a>
            ))}
          </div>
        </section>

        {/* Brand sections */}
        <section ref={targetRef} className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="space-y-24 md:space-y-32">
            {brandSections.map(({ brand, products }, idx) => {
              const id = `brand-${brand.toLowerCase().replace(/\s+/g, "-")}`;
              const visible = products.slice(0, 4);
              return (
                <article
                  key={brand}
                  id={id}
                  className="scroll-mt-32 border-t border-border/60 pt-10 md:pt-14"
                >
                  {/* Brand header */}
                  <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        / {(idx + 1).toString().padStart(2, "0")} — Marca
                      </p>
                      <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">
                        {brand}
                      </h2>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {products.length} productos disponibles
                      </p>
                    </div>
                    <Link
                      href={`/productos?brand=${encodeURIComponent(brand)}`}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-copper hover:text-copper"
                    >
                      Ver todo {brand}
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </header>

                  {/* Products grid */}
                  <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {visible.map((p) => (
                      <Link
                        key={p.id}
                        href={`/productos/${p.slug}`}
                        className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-copper/50"
                      >
                        <div className="relative aspect-square overflow-hidden bg-muted">
                          {p.images[0] && (
                            <img
                              src={p.images[0].url}
                              alt={p.images[0].alt ?? p.name}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                            />
                          )}
                          {p.isNew && (
                            <span className="absolute left-3 top-3 rounded-full bg-copper px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-background">
                              Nuevo
                            </span>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            {p.subcategory?.name}
                          </p>
                          <h3 className="mt-1.5 line-clamp-2 font-display text-sm font-medium leading-snug">
                            {p.name}
                          </h3>
                          <p className="mt-3 font-display text-base font-semibold">
                            {formatPrice(p.price)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Upcoming brands */}
          {upcomingBrands.length > 0 && (
            <div className="mt-24 rounded-3xl border border-border bg-card p-7 md:mt-32 md:p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Próximamente
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold tracking-tight md:text-2xl">
                Más marcas en camino
              </h3>
              <ul className="mt-6 flex flex-wrap gap-2">
                {upcomingBrands.map((b) => (
                  <li
                    key={b}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
  );
}
