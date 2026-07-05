"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { fetchProductsByIds } from "@/lib/catalog/actions";
import type { CatalogProduct } from "@/lib/catalog/types";
import { ProductCard } from "@/components/catalog/product-card";
import { SitePageHero } from "@/components/site/site-page-hero";
import { finalizeBreadcrumbs, siteCrumbs } from "@/lib/site/breadcrumbs";
import { siteShell } from "@/lib/design/site-shell";

function FavoritosSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse motion-reduce:animate-none">
          <div className="aspect-square rounded-2xl bg-muted" />
          <div className="mt-3 h-3 w-16 rounded bg-muted" />
          <div className="mt-2 h-4 w-full rounded bg-muted" />
          <div className="mt-2 h-4 w-20 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function FavoritosPage() {
  const { ids } = useFavorites();
  const [items, setItems] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const idsKey = useMemo(() => [...ids].sort().join(","), [ids.join(",")]);

  useEffect(() => {
    if (!idsKey) {
      setItems([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    fetchProductsByIds(idsKey.split(","))
      .then((res) => {
        if (active) {
          setItems(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [idsKey]);

  const count = items.length;
  const pendingCount = ids.length;
  const showInitialLoader = loading && pendingCount > 0 && items.length === 0;

  return (
    <>
      <SitePageHero
        breadcrumbs={finalizeBreadcrumbs([siteCrumbs.home, siteCrumbs.favoritos])}
        title="Favoritos"
        description={
          showInitialLoader
            ? `Cargando ${pendingCount} producto${pendingCount === 1 ? "" : "s"}…`
            : count === 0
              ? "Aún no tienes productos marcados como favoritos."
              : `${count} producto${count === 1 ? "" : "s"} guardado${count === 1 ? "" : "s"}.`
        }
      />

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          {showInitialLoader ? (
            <FavoritosSkeleton />
          ) : items.length === 0 ? (
            <div className={siteShell.emptyState}>
              <Heart className="h-8 w-8 text-muted-foreground" />
              <p className="mt-4 font-display text-lg">Tu lista de favoritos está vacía</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Explora el catálogo y toca el corazón para guardar lo que más te guste.
              </p>
              <Link
                href="/productos"
                className="mt-6 inline-flex items-center justify-center bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-background hover:opacity-90"
              >
                Ver productos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} variant="compact" />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
