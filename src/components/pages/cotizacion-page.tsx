"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, ShoppingBag, Trash2 } from "lucide-react";
import { CartShareActions } from "@/components/cart/cart-share-actions";
import { QuantityStepper } from "@/components/catalog/quantity-stepper";
import { SiteEmptyState } from "@/components/site/site-empty-state";
import { SitePageHero } from "@/components/site/site-page-hero";
import { PurchaseTrustNote } from "@/components/trust/purchase-trust-note";
import { finalizeBreadcrumbs, siteCrumbs } from "@/lib/site/breadcrumbs";
import { Button } from "@/components/ui/button";
import { typography } from "@/lib/design/tokens";
import { siteShell } from "@/lib/design/site-shell";
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

  const idsKey = useMemo(() => [...ids].sort().join(","), [ids.join(",")]);

  useEffect(() => {
    if (!idsKey) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const requestedIds = idsKey.split(",");
    let active = true;
    setLoading(true);

    fetchProductsByIds(requestedIds)
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
  }, [idsKey]);

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
  const showInitialLoader = loading && ids.length > 0 && rows.length === 0;

  return (
    <>
      <SitePageHero
        breadcrumbs={finalizeBreadcrumbs([siteCrumbs.home, siteCrumbs.carrito])}
        title={isAdmin ? "Carrito tienda" : "Tu carrito"}
        description={
          isAdmin
            ? count === 0
              ? "Agrega productos desde el catálogo."
              : "Prepara una selección de productos y compártela con un cliente."
            : count === 0
              ? "Agrega productos desde el catálogo."
              : `${count} producto${count === 1 ? "" : "s"} · ${units} unidad${units === 1 ? "" : "es"}`
        }
      />

    <div
      className={cn(
        "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
        hasItems && "pb-44 md:pb-24",
      )}
    >
      <nav className="flex items-center justify-between gap-4 pt-5 md:pt-6">
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

      {showInitialLoader ? (
        <CartLoadingSkeleton />
      ) : count === 0 ? (
        <SiteEmptyState
          className="mt-10 md:mt-12"
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Tu carrito está vacío"
          description="Explora el catálogo y agrega los productos que te interesen."
          action={{ label: "Explorar catálogo", href: "/productos" }}
        />
      ) : (
        <div className="mt-5 flex flex-col gap-10 md:mt-6 md:flex-row md:items-start md:justify-between md:gap-x-12 lg:gap-x-16 xl:gap-x-20">
          <section aria-label="Productos" className="min-w-0 w-full md:flex-1">
            {!isAdmin && (
              <PurchaseTrustNote
                className="mb-5 md:hidden"
                compact
                title="Solicitud de compra"
                lines={[
                  "Revisaremos disponibilidad antes de confirmar. No pagues hasta recibir instrucciones oficiales.",
                ]}
                linkKeys={["compraSegura", "metodosPago"]}
              />
            )}
            <div className="hidden border-b border-border px-1 pb-4 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground md:grid md:grid-cols-[minmax(0,1fr)_112px_96px_36px] md:gap-4">
              <span>Producto</span>
              <span className="text-center">Cantidad</span>
              <span className="text-right">Subtotal</span>
              <span className="sr-only">Quitar</span>
            </div>

            <ul className="divide-y divide-border md:mt-4">
              {rows.map(({ product: p, quantity, subtotal }) => (
                <li
                  key={p.id}
                  className="grid gap-3 py-5 md:grid-cols-[minmax(0,1fr)_112px_96px_36px] md:items-center md:gap-4 md:py-6"
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
                    <div className="min-w-0 flex-1 pt-0.5">
                      <Link href={`/productos/${p.slug}`} className="block min-w-0">
                        {p.brand?.name && (
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-copper">
                            {p.brand.name}
                          </p>
                        )}
                        <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug sm:text-[15px]">
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

          <aside className="hidden md:sticky md:top-24 md:block md:w-[320px] md:shrink-0 lg:w-[340px] xl:w-[380px]">
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
        <CartMobileActionBar
          count={count}
          total={total}
          isAdmin={isAdmin}
          whatsappHref={whatsappHref}
          shareLines={shareLines}
        />
      )}
    </div>
    </>
  );
}

function CartMobileActionBar({
  count,
  total,
  isAdmin,
  whatsappHref,
  shareLines,
}: {
  count: number;
  total: number;
  isAdmin: boolean;
  whatsappHref: string;
  shareLines: { productId: string; quantity: number; unitPrice: number }[];
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur-sm md:hidden">
      <div className="mx-auto max-w-7xl space-y-2.5">
        <div className="flex items-baseline justify-between gap-4">
          <div className="min-w-0">
            <p className={siteShell.labelCaps}>Total estimado</p>
            <p className={cn(typography.priceTotal, "mt-0.5")}>{formatPrice(total)}</p>
          </div>
          <p className="shrink-0 text-right text-xs text-muted-foreground tabular-nums">
            {count} producto{count === 1 ? "" : "s"}
          </p>
        </div>
        {isAdmin ? (
          <div className="[&_button]:h-12 [&_button]:w-full [&_button]:rounded-full">
            <CartShareActions lines={shareLines} variant="primary" compact />
          </div>
        ) : (
          <>
            <Button asChild className="h-12 w-full rounded-full text-sm font-semibold">
              <Link href="/checkout">Continuar solicitud</Link>
            </Button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              Asesoría por WhatsApp
            </a>
          </>
        )}
      </div>
    </div>
  );
}

function CartLoadingSkeleton() {
  return (
    <div className="mt-8 flex flex-col gap-10 md:flex-row md:items-start md:justify-between md:gap-x-12 lg:gap-x-16 xl:gap-x-20">
      <div className="min-w-0 flex-1 space-y-0 divide-y divide-border">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex gap-4 py-5 animate-pulse motion-reduce:animate-none"
          >
            <div className="h-[72px] w-[72px] shrink-0 rounded-lg bg-muted" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-2.5 w-16 rounded bg-muted" />
              <div className="h-4 w-3/4 max-w-xs rounded bg-muted" />
              <div className="h-3 w-20 rounded bg-muted md:hidden" />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden w-[320px] shrink-0 rounded-2xl border border-border bg-card p-6 md:block lg:w-[340px] xl:w-[380px]">
        <div className="h-3 w-32 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="mt-5 space-y-3">
          <div className="h-3 w-full animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        </div>
        <div className="mt-6 h-11 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
      </div>
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
    <div className={siteShell.summaryPanel}>
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
        <p className={cn("mt-1", typography.priceTotal)}>
          {formatPrice(total)}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {isAdmin
            ? "Precios de referencia para la selección compartida."
            : "Precios de referencia. Disponibilidad y monto final se confirman con un asesor."}
        </p>
      </div>

      {!isAdmin && (
        <PurchaseTrustNote
          className="mt-5"
          compact
          title="Antes de pagar"
          lines={[
            "Revisaremos disponibilidad antes de confirmar. No realices pagos hasta recibir instrucciones oficiales.",
          ]}
          linkKeys={["compraSegura", "metodosPago"]}
        />
      )}

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
            <Button asChild className="h-12 w-full rounded-full text-sm font-semibold">
              <Link href="/checkout">Enviar solicitud</Link>
            </Button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-background text-sm font-medium text-foreground transition-colors hover:border-foreground/20 hover:bg-muted/40"
            >
              <MessageCircle className="h-4 w-4 text-copper" />
              Asesoría por WhatsApp
            </a>
          </>
        )}
      </div>
    </div>
  );
}
