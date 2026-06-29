"use client";

import {
  Check,
  Copy,
  MessageCircle,
  Printer,
  X,
} from "lucide-react";
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
        className="fixed inset-0 z-[300] flex flex-col bg-black/50 p-4 print:bg-white print:p-0 md:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sale-summary-title"
      >
        <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col print:max-w-none print:flex-none">
          {/* Acciones — ocultas al imprimir */}
          <div className="mb-3 flex shrink-0 items-center justify-between gap-3 print:hidden">
            <p className="text-sm font-medium text-white md:text-zinc-200">
              Presentar al cliente
            </p>
            <button
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white backdrop-blur hover:bg-white/20"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Contenido imprimible */}
          <div
            id="pos-sale-summary-print"
            className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-white shadow-2xl print:overflow-visible print:rounded-none print:shadow-none"
          >
            <div className="border-b border-zinc-100 px-6 py-6 md:px-8 md:py-8">
              <img
                src={BRAND_WORDMARK_SRC}
                alt={BRAND_ALT}
                className="h-8 w-auto max-w-[200px] object-contain object-left md:h-9"
              />
              <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                    Resumen de venta
                  </p>
                  <h2
                    id="sale-summary-title"
                    className="mt-1 font-display text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl"
                  >
                    {formatSaleLabel(saleNumber)}
                  </h2>
                  <p className="mt-2 text-sm text-zinc-500">
                    {formatSaleDateTime(startedAt)}
                  </p>
                  {branchLabel && (
                    <p className="mt-1 text-sm font-medium text-zinc-700">
                      Sucursal: {branchLabel}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                    Total estimado
                  </p>
                  <p className="font-display text-3xl font-semibold tabular-nums text-zinc-900">
                    {formatPrice(total)}
                  </p>
                </div>
              </div>
            </div>

            <ul className="divide-y divide-zinc-100 px-4 md:px-6">
              {lines.map((line) => {
                const sub = lineSubtotal(line);
                return (
                  <li
                    key={line.productId}
                    className="flex gap-4 py-4 md:py-5"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 md:h-20 md:w-20">
                      {line.image ? (
                        <img
                          src={line.image}
                          alt={line.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-zinc-300 text-xs">
                          —
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {line.brandName && (
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                          {line.brandName}
                        </p>
                      )}
                      <p className="mt-0.5 text-sm font-medium leading-snug text-zinc-900 md:text-base">
                        {line.name}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 md:text-sm">
                        <span>Cant. {line.quantity}</span>
                        <span>{formatPrice(line.price)} c/u</span>
                        <span className="font-semibold text-zinc-900">
                          {formatPrice(sub)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-5 md:px-8">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm font-medium text-zinc-600">Total estimado</span>
                <span className="font-display text-2xl font-semibold tabular-nums text-zinc-900">
                  {formatPrice(total)}
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                {POS_SUMMARY_DISCLAIMER}
              </p>
            </div>
          </div>

          {/* Botones táctiles */}
          <div className="mt-4 grid shrink-0 grid-cols-2 gap-2 print:hidden md:grid-cols-4">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white text-sm font-semibold text-zinc-900 shadow-lg hover:bg-zinc-50"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white text-sm font-semibold text-zinc-900 shadow-lg hover:bg-zinc-50"
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
            </button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700",
              )}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
            >
              <X className="h-4 w-4" />
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
