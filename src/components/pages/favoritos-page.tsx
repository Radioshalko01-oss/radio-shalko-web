"use client";

import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { PRODUCTS, formatPrice } from "@/lib/products";
import { useFavorites } from "@/hooks/use-favorites";

export function FavoritosPage() {
  const { ids, remove } = useFavorites();
  const items = PRODUCTS.filter((p) => ids.includes(p.id));

  return (
    <div className="pt-28 md:pt-32">
        <section className="border-b border-border py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Tu selección
            </p>
            <h1 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-5xl">
              Favoritos
            </h1>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              {items.length === 0
                ? "Aún no tienes productos marcados como favoritos."
                : `${items.length} producto${items.length === 1 ? "" : "s"} guardado${items.length === 1 ? "" : "s"}.`}
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            {items.length === 0 ? (
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
                  <article
                    key={p.id}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    <Link
                      href={`/productos?sub=${encodeURIComponent(p.subcategory)}`}
                      className="block"
                    >
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        <img
                          src={p.image}
                          alt={p.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {p.brand}
                        </p>
                        <h3 className="mt-1 line-clamp-2 font-display text-sm font-medium md:text-base">
                          {p.name}
                        </h3>
                        <p className="mt-2 text-sm font-semibold">{formatPrice(p.price)}</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => remove(p.id)}
                      aria-label="Quitar de favoritos"
                      className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-foreground hover:text-background"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
    </div>
  );
}
