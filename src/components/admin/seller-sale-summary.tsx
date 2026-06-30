"use client";

import {
  Check,
  Copy,
  MessageCircle,
  Printer,
  X,
} from "lucide-react";
import { AdminButton } from "@/components/admin/admin-button";
import { BRAND_ALT, BRAND_WORDMARK_SRC } from "@/lib/brand/assets";
import { formatPrice } from "@/lib/catalog/format";
import {
  formatSaleLabel,
  lineSubtotal,
  sessionTotal,
  type PosCartLine,
} from "@/lib/admin/seller-session";
import {
  formatSaleDateTime,
  POS_SUMMARY_DISCLAIMER,
} from "@/lib/admin/seller-summary";
import { adminShell } from "@/lib/design/admin-shell";
import { typography } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

type SellerSaleSummaryProps = {
  open: boolean;
  onClose: () => void;
  saleNumber: number;
  startedAt: string;
  branchLabel: string | null;
  lines: PosCartLine[];
  whatsappHref: string;
  copied: boolean;
  onCopy: () => void;
};

export function SellerSaleSummary({
  open,
  onClose,
  saleNumber,
  startedAt,
  branchLabel,
  lines,
  whatsappHref,
  copied,
  onCopy,
}: SellerSaleSummaryProps) {
  if (!open || lines.length === 0) return null;

  const total = sessionTotal(lines);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #pos-sale-summary-print,
          #pos-sale-summary-print * {
            visibility: visible !important;
          }
          #pos-sale-summary-print {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 24px !important;
            background: white !important;
          }
        }
      `}</style>

      <div
        className={cn(adminShell.modalOverlay, "z-[300] items-center p-4 md:p-8 print:bg-white print:p-0")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sale-summary-title"
      >
        <div
          className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col print:max-w-none print:flex-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex shrink-0 items-center justify-between gap-3 print:hidden">
            <p className="text-sm font-medium text-white/90 md:text-foreground/80">
              Presentar al cliente
            </p>
            <button
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 place-items-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 md:border-border md:bg-card md:text-muted-foreground md:hover:bg-muted/40 md:hover:text-foreground"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            id="pos-sale-summary-print"
            className={cn(
              adminShell.card,
              "min-h-0 flex-1 overflow-y-auto shadow-2xl print:overflow-visible print:rounded-none print:shadow-none",
            )}
          >
            <div className={cn("border-b px-6 py-6 md:px-8 md:py-8", adminShell.dividerSoft)}>
              <img
                src={BRAND_WORDMARK_SRC}
                alt={BRAND_ALT}
                className="h-8 w-auto max-w-[200px] object-contain object-left md:h-9"
              />
              <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className={adminShell.groupLabel}>Resumen de venta</p>
                  <h2
                    id="sale-summary-title"
                    className={cn(typography.pageTitle, "mt-1 text-2xl md:text-3xl")}
                  >
                    {formatSaleLabel(saleNumber)}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatSaleDateTime(startedAt)}
                  </p>
                  {branchLabel && (
                    <p className="mt-1 text-sm font-medium text-foreground/85">
                      Sucursal: {branchLabel}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className={adminShell.fieldLabel}>Total estimado</p>
                  <p className={cn(typography.priceTotal, "text-foreground")}>
                    {formatPrice(total)}
                  </p>
                </div>
              </div>
            </div>

            <ul className={cn("divide-y px-4 md:px-6", adminShell.dividerSoft)}>
              {lines.map((line) => {
                const sub = lineSubtotal(line);
                return (
                  <li key={line.productId} className="flex gap-4 py-4 md:py-5">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted/40 md:h-20 md:w-20">
                      {line.image ? (
                        <img
                          src={line.image}
                          alt={line.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs text-muted-foreground/50">
                          —
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {line.brandName && (
                        <p className={cn(adminShell.groupLabel, "text-[10px]")}>
                          {line.brandName}
                        </p>
                      )}
                      <p className="mt-0.5 text-sm font-medium leading-snug md:text-base">
                        {line.name}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground md:text-sm">
                        <span>Cant. {line.quantity}</span>
                        <span>{formatPrice(line.price)} c/u</span>
                        <span className="font-semibold text-foreground">
                          {formatPrice(sub)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className={cn("border-t bg-muted/30 px-6 py-5 md:px-8", adminShell.divider)}>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm font-medium text-muted-foreground">Total estimado</span>
                <span className={cn(typography.priceTotal, "text-xl md:text-2xl")}>
                  {formatPrice(total)}
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {POS_SUMMARY_DISCLAIMER}
              </p>
            </div>
          </div>

          <div className="mt-4 grid shrink-0 grid-cols-2 gap-2 print:hidden md:grid-cols-4">
            <AdminButton
              type="button"
              variant="secondary"
              size="lg"
              className="h-12 rounded-xl shadow-sm"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </AdminButton>
            <AdminButton
              type="button"
              variant="secondary"
              size="lg"
              className="h-12 rounded-xl shadow-sm"
              onClick={onCopy}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar
                </>
              )}
            </AdminButton>
            <AdminButton
              asChild
              variant="accent"
              size="lg"
              className="h-12 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </AdminButton>
            <AdminButton
              type="button"
              variant="ghost"
              size="lg"
              className="h-12 rounded-xl border border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20 md:border-border md:bg-card md:text-foreground md:hover:bg-muted/40"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              Cerrar
            </AdminButton>
          </div>
        </div>
      </div>
    </>
  );
}
