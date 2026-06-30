"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { fetchProductsByIds } from "@/lib/catalog/actions";
import type { CatalogProduct } from "@/lib/catalog/types";
import { ProductCard } from "@/components/catalog/product-card";
import { PageHeader } from "@/components/ui/page-header";

export function FavoritosPage() {
  const { ids } = useFavorites();
  const [items, setItems] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchProductsByIds(ids)
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
  }, [ids]);

  const count = items.length;

  return (
    <div className="pt-28 md:pt-32">
        <section className="border-b border-border py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <PageHeader
              eyebrow="Tu selección"
              title="Favoritos"
              description={
                count === 0
                  ? "Aún no tienes productos marcados como favoritos."
                  : `${count} producto${count === 1 ? "" : "s"} guardado${count === 1 ? "" : "s"}.`
              }
            />
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            {loading && ids.length > 0 ? (
              <p className="text-sm text-muted-foreground">Cargando favoritos…</p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
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
    </div>
  );
}
