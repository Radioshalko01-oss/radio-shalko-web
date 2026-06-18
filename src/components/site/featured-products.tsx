"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PRODUCTS, type Product } from "@/lib/products";
import { FeaturedProductCard } from "@/components/site/featured-product-card";

type Tab = { id: "novedades" | "destacados"; label: string };

const TABS: Tab[] = [
  { id: "novedades", label: "Novedades" },
  { id: "destacados", label: "Destacados" },
];

function pickProducts(tab: Tab["id"]): Product[] {
  if (tab === "novedades") {
    return PRODUCTS.filter((p) => p.isNew).slice(0, 4);
  }
  const ids = ["prod-008", "prod-015", "prod-019", "prod-033"];
  return ids.map((id) => PRODUCTS.find((p) => p.id === id)!).filter(Boolean);
}

export function FeaturedProducts() {
  const [active, setActive] = useState<Tab["id"]>("novedades");
  const items = useMemo(() => pickProducts(active), [active]);

  return (
    <section className="border-b border-border pt-12 pb-8 md:pt-16 md:pb-10">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="relative flex -translate-y-3 items-end justify-center gap-6 md:-translate-y-4">
          <div className="text-center">
            <p className="-translate-y-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground md:-translate-y-3">
              Colecciones
            </p>
            <div role="tablist" className="mt-4 flex translate-y-1 items-baseline justify-center gap-6 md:mt-4.5 md:translate-y-1.5">
              {TABS.map((t) => {
                const isActive = active === t.id;
                return (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActive(t.id)}
                    className={`font-display text-2xl font-semibold tracking-tight transition-colors md:text-3xl ${
                      isActive ? "text-foreground" : "text-foreground/35 hover:text-foreground/60"
                    }`}
                  >
                    {t.label}
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

        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
          {items.map((p) => (
            <FeaturedProductCard key={p.id} product={p} />
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
