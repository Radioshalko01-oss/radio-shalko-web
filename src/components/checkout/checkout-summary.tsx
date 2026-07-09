"use client";

import { Check, ShoppingBag } from "lucide-react";
import type { CartProductRow } from "@/hooks/use-cart-products";
import { formatPrice } from "@/lib/catalog/format";
import { typography } from "@/lib/design/tokens";
import { PurchaseTrustLinkRow } from "@/components/trust/purchase-trust-note";
import { cn } from "@/lib/utils";

const TRUST_ITEMS = [
  "Atención personalizada",
  "Garantía Radio Shalko",
  "Recoges en la sucursal que elijas",
  "Confirmamos disponibilidad antes del pago",
  "Solo paga por canales oficiales",
] as const;

type CheckoutSummaryProps = {
  rows: CartProductRow[];
  compact?: boolean;
  className?: string;
};

export function CheckoutSummary({ rows, compact, className }: CheckoutSummaryProps) {
  const subtotal = rows.reduce((acc, r) => acc + r.subtotal, 0);

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card",
        compact ? "p-4" : "p-5",
        className,
      )}
    >
      <h2 className="font-display text-[15px] font-semibold tracking-tight text-foreground">
        Tu solicitud
      </h2>
      {rows.length > 0 && (
        <p className="mt-0.5 text-xs text-muted-foreground">
          {rows.length} producto{rows.length === 1 ? "" : "s"} · sujeto a confirmación
        </p>
      )}

      <ul className={cn("divide-y divide-border/80", compact ? "mt-3" : "mt-4")}>
        {rows.map(({ product: p, quantity, subtotal: lineTotal }) => (
          <li key={p.id} className="flex gap-3 py-3 first:pt-0">
            <div
              className={cn(
                "shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted",
                compact ? "h-14 w-14" : "h-16 w-16",
              )}
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
            </div>
            <div className="min-w-0 flex-1">
              {p.brand?.name && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-copper">
                  {p.brand.name}
                </p>
              )}
              <p className="line-clamp-2 text-sm font-medium leading-snug">{p.name}</p>
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                ×{quantity} · {formatPrice(p.price)} c/u
              </p>
            </div>
            <p className="min-w-[4.5rem] shrink-0 text-right text-sm font-medium tabular-nums">
              {formatPrice(lineTotal)}
            </p>
          </li>
        ))}
      </ul>

      <div
        className={cn(
          "space-y-2 border-t border-border/80 text-sm",
          compact ? "mt-3 pt-3" : "mt-4 pt-4",
        )}
      >
        <div className="flex items-baseline justify-between gap-3 text-muted-foreground">
          <span className="text-xs">Subtotal estimado</span>
          <span className="tabular-nums">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs font-medium text-foreground">Total estimado</span>
          <span className={cn("tabular-nums", typography.priceTotal)}>
            {formatPrice(subtotal)}
          </span>
        </div>
        <p className="pt-1 text-[11px] leading-relaxed text-muted-foreground">
          No se realizará ningún cobro en este momento.
        </p>
      </div>

      {!compact && (
        <ul className="mt-4 space-y-2 border-t border-border/60 pt-4">
          {TRUST_ITEMS.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-[11px] leading-snug text-muted-foreground"
            >
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-copper/70" strokeWidth={2.5} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {!compact && (
        <PurchaseTrustLinkRow className="mt-4 border-t border-border/60 pt-4" />
      )}
    </div>
  );
}
