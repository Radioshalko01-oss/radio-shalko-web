"use client";

import Link from "next/link";
import { ShoppingBag, Trash2 } from "lucide-react";
import { PRODUCTS, formatPrice } from "@/lib/products";
import { useQuote } from "@/hooks/use-quote";
import { Button } from "@/components/ui/button";

export function CotizacionPage() {
  const { ids, remove, count } = useQuote();
  const products = PRODUCTS.filter((p) => ids.includes(p.id));

  return (
    <div className="mx-auto max-w-7xl px-5 py-28 md:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Cotización
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Tu cotización</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        {count === 0
          ? "Agrega productos con el botón Cotizar o el ícono de bolsa en el menú."
          : `${count} producto${count === 1 ? "" : "s"} listo${count === 1 ? "" : "s"} para solicitar precio y disponibilidad.`}
      </p>

      {products.length === 0 ? (
        <div className="mt-12 grid place-items-center rounded-xl border border-dashed border-border py-16 text-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Tu lista está vacía</p>
          <Button asChild className="mt-6 h-11">
            <Link href="/productos">Explorar catálogo</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-10 divide-y divide-border rounded-xl border border-border">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-4 p-4 md:p-5">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted md:h-24 md:w-24">
                <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {p.brand}
                </p>
                <p className="mt-1 font-display text-lg font-medium">{p.name}</p>
                <p className="mt-1 text-sm font-semibold">{formatPrice(p.price)}</p>
              </div>
              <button
                type="button"
                aria-label="Quitar"
                onClick={() => remove(p.id)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {products.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="h-11 bg-copper text-copper-foreground hover:bg-copper/90">
            <Link href="/contacto">Solicitar cotización</Link>
          </Button>
          <Button asChild variant="outline" className="h-11">
            <Link href="/productos">Seguir explorando</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
