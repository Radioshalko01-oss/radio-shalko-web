"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, ShoppingBag, Trash2 } from "lucide-react";
import { CartShareActions } from "@/components/cart/cart-share-actions";
import { QuantityStepper } from "@/components/catalog/quantity-stepper";
import { Button } from "@/components/ui/button";
import { useQuote } from "@/hooks/use-quote";
import { fetchProductsByIds } from "@/lib/catalog/actions";
import { formatPrice } from "@/lib/catalog/format";
import type { CatalogProduct } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";
import { buildQuoteWhatsAppHref } from "@/lib/whatsapp/product-message";

type CotizacionPageProps = {
  isAdmin?: boolean;
};

export function CotizacionPage({ isAdmin = false }: CotizacionPageProps) {
  const { ids, remove, getQuantity, setQuantity, clearCart } = useQuote();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchProductsByIds(ids)
      .then((res) => {
        if (active) {
          setProducts(res);
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

  const rows = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    return ids
      .map((id) => byId.get(id))
      .filter((p): p is CatalogProduct => Boolean(p))
      .map((p) => {
        const quantity = getQuantity(p.id) || 1;
        return { product: p, quantity, subtotal: p.price * quantity };
      });
  }, [ids, products, getQuantity]);

  const shareLines = useMemo(
    () =>
      rows.map((r) => ({
        productId: r.product.id,
        quantity: r.quantity,
        unitPrice: r.product.price,
      })),
    [rows],
  );

  const total = rows.reduce((acc, r) => acc + r.subtotal, 0);
  const count = rows.length;
  const units = rows.reduce((acc, r) => acc + r.quantity, 0);

  const whatsappHref = useMemo(
    () =>
      buildQuoteWhatsAppHref(
        rows.map((r) => ({
          name: r.product.name,
          quantity: r.quantity,
          unitPrice: r.product.price,
        })),
      ),
    [rows],
  );

  const hasItems = count > 0;

  return (
    <div
      className={cn(
        "mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24 lg:px-8",
        hasItems && "pb-32 md:pb-24",
      )}
    >
      <nav className="flex items-center justify-between gap-4">
        <Link
          href="/productos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Seguir explorando
        </Link>
        {hasItems && (
          <p className="text-sm text-muted-foreground tabular-nums md:hidden">
            {count} producto{count === 1 ? "" : "s"}
          </p>
        )}
      </nav>

      <header className="mt-6 md:mt-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
          {isAdmin ? "Carrito tienda" : "Tu carrito"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground md:text-base">
          {isAdmin ? (
            count === 0
              ? "Agrega productos desde el catálogo."
              : "Usa este carrito para preparar una selección de productos y compartirla con un cliente."
          ) : count === 0 ? (
            "Agrega productos desde el catálogo."
          ) : (
            `${count} producto${count === 1 ? "" : "s"} · ${units} unidad${units === 1 ? "" : "es"}`
          )}
        </p>
      </header>

      {loading && ids.length > 0 ? (
        <p className="mt-12 text-sm text-muted-foreground">Cargando tu carrito…</p>
      ) : count === 0 ? (
        <div className="mt-12 grid place-items-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-20 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-4 font-display text-lg font-medium">Tu carrito está vacío</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Explora el catálogo y agrega los productos que te interesen.
          </p>
          <Button asChild className="mt-6 h-11 rounded-full px-8">
            <Link href="/productos">Explorar catálogo</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1fr)_320px] md:items-start lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
          <section aria-label="Productos">
            <div className="hidden border-b border-border px-1 pb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground md:grid md:grid-cols-[minmax(0,1fr)_112px_96px_36px] md:gap-4">
              <span>Producto</span>
              <span className="text-center">Cantidad</span>
              <span className="text-right">Subtotal</span>
              <span className="sr-only">Quitar</span>
            </div>

            <ul className="divide-y divide-border md:mt-0">
              {rows.map(({ product: p, quantity, subtotal }) => (
                <li
                  key={p.id}
                  className="grid gap-3 py-4 first:pt-0 md:grid-cols-[minmax(0,1fr)_112px_96px_36px] md:items-center md:gap-4 md:py-5"
                >
                  <div className="flex min-w-0 gap-3 md:gap-4">
                    <Link
                      href={`/productos/${p.slug}`}
                      className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted sm:h-[72px] sm:w-[72px]"
                    >
                      {p.images[0] ? (
                        <img
                          src={p.images[0].url}
                          alt={p.images[0].alt ?? p.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-muted-foreground/40">
                          <ShoppingBag className="h-4 w-4" />
                        </div>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/productos/${p.slug}`} className="block min-w-0">
                        {p.brand?.name && (
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-copper">
                            {p.brand.name}
                          </p>
                        )}
                        <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug sm:text-[15px]">
                          {p.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground tabular-nums md:hidden">
                          {formatPrice(p.price)} c/u
                        </p>
                      </Link>
                      <div className="mt-2.5 flex items-center justify-between gap-3 md:hidden">
                        <QuantityStepper
                          value={quantity}
                          size="sm"
                          onChange={(next) => setQuantity(p.id, next)}
                        />
                        <span className="text-sm font-semibold tabular-nums">{formatPrice(subtotal)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden justify-center md:flex">
                    <QuantityStepper
                      value={quantity}
                      size="sm"
                      onChange={(next) => setQuantity(p.id, next)}
                    />
                  </div>

                  <p className="hidden text-right text-sm font-semibold tabular-nums md:block">
                    {formatPrice(subtotal)}
                  </p>

                  <div className="hidden justify-end md:flex">
                    <button
                      type="button"
                      aria-label={`Quitar ${p.name}`}
                      onClick={() => remove(p.id)}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex justify-end md:hidden">
                    <button
                      type="button"
                      aria-label={`Quitar ${p.name}`}
                      onClick={() => remove(p.id)}
                      className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <aside className="hidden md:block md:sticky md:top-24">
            <CartSummaryPanel
              count={count}
              units={units}
              total={total}
              isAdmin={isAdmin}
              whatsappHref={whatsappHref}
              shareLines={shareLines}
              onClearCart={clearCart}
            />
          </aside>
        </div>
      )}

      {hasItems && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm md:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Total estimado
              </p>
              <p className="font-display text-xl font-semibold tabular-nums">{formatPrice(total)}</p>
            </div>
            {isAdmin ? (
              <div className="shrink-0 [&_button]:h-11 [&_button]:min-w-[148px] [&_button]:px-5">
                <CartShareActions lines={shareLines} variant="primary" compact />
              </div>
            ) : (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-copper px-5 text-sm font-semibold text-copper-foreground hover:bg-copper/90"
              >
                <MessageCircle className="h-4 w-4" />
                Asesoría
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CartSummaryPanel({
  count,
  units,
  total,
  isAdmin,
  whatsappHref,
  shareLines,
  onClearCart,
}: {
  count: number;
  units: number;
  total: number;
  isAdmin: boolean;
  whatsappHref: string;
  shareLines: { productId: string; quantity: number; unitPrice: number }[];
  onClearCart: () => Promise<void>;
}) {
  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    setClearing(true);
    try {
      await onClearCart();
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.15)]">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {isAdmin ? "Resumen de selección" : "Resumen del pedido"}
      </h2>

      <div className="mt-5 space-y-2 border-b border-border pb-5 text-sm">
        <div className="flex justify-between gap-4 text-muted-foreground">
          <span>Productos ({count})</span>
          <span className="tabular-nums text-foreground">{formatPrice(total)}</span>
        </div>
        <div className="flex justify-between gap-4 text-muted-foreground">
          <span>Unidades</span>
          <span className="tabular-nums text-foreground">{units}</span>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Total estimado
        </p>
        <p className="mt-1 font-display text-2xl font-semibold tracking-tight tabular-nums md:text-3xl">
          {formatPrice(total)}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {isAdmin
            ? "Precios de referencia para la selección compartida."
            : "Precios de referencia. Disponibilidad y monto final se confirman con un asesor."}
        </p>
      </div>

      <div className="mt-6 space-y-2.5">
        {isAdmin ? (
          <>
            <CartShareActions lines={shareLines} variant="primary" />
            <Button
              type="button"
              variant="outline"
              asChild
              className="h-11 w-full rounded-full"
            >
              <Link href="/productos">Seguir agregando productos</Link>
            </Button>
            <button
              type="button"
              onClick={handleClear}
              disabled={clearing}
              className="inline-flex h-10 w-full items-center justify-center rounded-full text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              {clearing ? "Vaciando…" : "Vaciar carrito"}
            </button>
          </>
        ) : (
          <>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-copper text-sm font-semibold text-copper-foreground transition-colors hover:bg-copper/90"
            >
              <MessageCircle className="h-4 w-4" />
              Solicitar asesoría
            </a>
            <Button
              type="button"
              variant="outline"
              asChild
              className="h-11 w-full rounded-full"
            >
              <Link href="/checkout">Comprar</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
