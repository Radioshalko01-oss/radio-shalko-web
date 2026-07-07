"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog/types";
import { ProductCard } from "@/components/catalog/product-card";
import { siteShell } from "@/lib/design/site-shell";

type TabId = "novedades" | "destacados";

const TABS: { id: TabId; label: string }[] = [
  { id: "novedades", label: "Novedades" },
  { id: "destacados", label: "Destacados" },
];

type FeaturedProductsProps = {
  novedades: CatalogProduct[];
  destacados: CatalogProduct[];
};

export function FeaturedProducts({ novedades, destacados }: FeaturedProductsProps) {
  const [active, setActive] = useState<TabId>("novedades");
  const items = active === "novedades" ? novedades : destacados;

  return (
    <section className="border-b border-border pt-10 pb-6 md:pt-16 md:pb-10">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="relative flex -translate-y-3 items-end justify-center gap-6 md:-translate-y-4">
          <div className="text-center">
            <p className={siteShell.eyebrow}>Colecciones</p>
            <div role="tablist" className="relative mt-4 flex translate-y-1 items-baseline justify-center gap-6 md:mt-4.5 md:translate-y-1.5">
              {TABS.map((t) => {
                const isActive = active === t.id;
                return (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActive(t.id)}
                    className={`relative font-display text-2xl font-semibold tracking-tight transition-colors md:text-3xl ${
                      isActive ? "text-foreground" : "text-foreground/35 hover:text-foreground/60"
                    }`}
                  >
                    {t.label}
                    {isActive && (
                      <span className="absolute -bottom-2 left-0 right-0 mx-auto h-0.5 w-8 bg-copper" aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <Link
            href="/productos"
            className="absolute right-0 top-0 hidden -translate-y-2.5 items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline md:inline-flex md:-translate-y-3"
          >
            Ver todo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 md:mt-10 md:grid-cols-4 md:gap-x-6 md:gap-y-8">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} variant="featured" />
          ))}
        </div>

        <div className="mt-10 flex justify-center md:hidden">
          <Link
            href="/productos"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Ver todo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
