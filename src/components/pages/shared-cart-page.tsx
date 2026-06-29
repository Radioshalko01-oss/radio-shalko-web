"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, MessageCircle, ShoppingBag, Sparkles } from "lucide-react";
import { SiteLogo } from "@/components/brand/site-logo";
import { Button } from "@/components/ui/button";
import { useQuote } from "@/hooks/use-quote";
import { formatPrice } from "@/lib/catalog/format";
import { POS_SUMMARY_DISCLAIMER, formatSaleDateTime } from "@/lib/admin/seller-summary";
import type { SharedCartView } from "@/lib/shared-cart/queries";
import { buildPublicSharedCartWhatsAppHref } from "@/lib/shared-cart/messages";

export function SharedCartPage({ cart }: { cart: SharedCartView }) {
  const router = useRouter();
  const { getQuantity, setQuantity } = useQuote();
  const [imported, setImported] = useState(false);
  const [importing, setImporting] = useState(false);

  const rows = useMemo(
    () =>
      cart.items
        .filter((i) => i.product)
        .map((i) => ({
          product: i.product!,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          subtotal: i.unitPrice * i.quantity,
        })),
    [cart.items],
  );

  const total = rows.reduce((acc, r) => acc + r.subtotal, 0);
  const units = rows.reduce((acc, r) => acc + r.quantity, 0);

  const whatsappHref = useMemo(
    () =>
      buildPublicSharedCartWhatsAppHref(cart.items, {
        saleLabel: cart.saleLabel,
        branchName: cart.branchName,
      }),
    [cart],
  );

  const handleImport = async () => {
    setImporting(true);
    try {
      for (const row of rows) {
        const current = getQuantity(row.product.id);
        const next = current > 0 ? current + row.quantity : row.quantity;
        setQuantity(row.product.id, next);
      }
      setImported(true);
      router.push("/carrito");
    } finally {
      setImporting(false);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="mx-auto max-w-md px-5 py-28 text-center md:py-32">
        <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 font-display text-xl font-semibold">Selección no disponible</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Este enlace expiró o los productos ya no están disponibles.
        </p>
        <Button asChild className="mt-8 h-11 rounded-full px-8">
          <Link href="/productos">Explorar catálogo</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 md:py-24 lg:px-8">
      <header className="text-center">
        <SiteLogo variant="horizontal" context="header" size="sm" className="mx-auto" />
        <div className="mx-auto mt-8 max-w-lg">
          <p className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-copper">
            <Sparkles className="h-3.5 w-3.5" />
            Selección personalizada
          </p>
          <h1 className="mt-3 font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-[2rem]">
            Radio Shalko preparó esta selección para ti
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {cart.saleLabel ? `${cart.saleLabel} · ` : ""}
            {formatSaleDateTime(cart.createdAt)}
            {cart.branchName ? ` · ${cart.branchName}` : ""}
          </p>
        </div>
      </header>

      <section className="mt-10 md:mt-12" aria-label="Productos seleccionados">
        <div className="hidden border-b border-border px-1 pb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
          <span>Producto</span>
          <span className="text-right">Subtotal</span>
        </div>

        <ul className="divide-y divide-border">
          {rows.map(({ product, quantity, unitPrice, subtotal }) => (
            <li
              key={product.id}
              className="flex gap-3 py-4 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:py-5"
            >
              <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
                <Link
                  href={`/productos/${product.slug}`}
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted sm:h-[72px] sm:w-[72px]"
                >
                  {product.images[0] && (
                    <img
                      src={product.images[0].url}
                      alt={product.images[0].alt ?? product.name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  {product.brand?.name && (
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-copper">
                      {product.brand.name}
                    </p>
                  )}
                  <Link
                    href={`/productos/${product.slug}`}
                    className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug transition-colors hover:text-copper sm:text-[15px]"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1.5 text-xs text-muted-foreground tabular-nums sm:hidden">
                    Cant. {quantity} · {formatPrice(unitPrice)} c/u
                  </p>
                  <p className="mt-1 hidden text-xs text-muted-foreground tabular-nums sm:block">
                    Cantidad {quantity} · {formatPrice(unitPrice)} c/u
                  </p>
                </div>
              </div>
              <p className="shrink-0 self-end text-right text-sm font-semibold tabular-nums sm:self-center sm:text-base">
                {formatPrice(subtotal)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <aside className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.12)] sm:p-6">
        <div className="flex items-end justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Total estimado
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {rows.length} producto{rows.length === 1 ? "" : "s"} · {units} unidad
              {units === 1 ? "" : "es"}
            </p>
          </div>
          <p className="font-display text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
            {formatPrice(total)}
          </p>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{POS_SUMMARY_DISCLAIMER}</p>

        <div className="mt-6 space-y-2.5">
          <Button
            type="button"
            onClick={handleImport}
            disabled={importing || imported}
            className="h-12 w-full rounded-full text-sm font-semibold"
          >
            {imported ? (
              <>
                <Check className="h-4 w-4" />
                Agregado a tu carrito
              </>
            ) : importing ? (
              "Agregando…"
            ) : (
              "Agregar a mi carrito"
            )}
          </Button>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <MessageCircle className="h-4 w-4" />
            Solicitar asesoría
          </a>
        </div>
      </aside>
    </div>
  );
}
