"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  History,
  Link2,
  MessageCircle,
  Monitor,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { QuantityStepper } from "@/components/catalog/quantity-stepper";
import { AdminButton } from "@/components/admin/admin-button";
import { SellerSaleSummary } from "@/components/admin/seller-sale-summary";
import { useSellerSession } from "@/hooks/use-seller-session";
import { formatPrice } from "@/lib/catalog/format";
import type { CatalogBranch } from "@/lib/catalog/types";
import type { SellerProduct } from "@/lib/admin/seller-queries";
import {
  branchLabel,
  branchQty,
  getStockLevel,
  otherBranchesWithStock,
  scopeStock,
  STOCK_LEVEL_STYLES,
} from "@/lib/admin/seller-stock";
import {
  formatSaleLabel,
  formatSaleTime,
  lineSubtotal,
  sessionTotal,
} from "@/lib/admin/seller-session";
import {
  buildPosSaleSummaryText,
  buildPosWhatsAppHref,
  type PosSummaryInput,
} from "@/lib/admin/seller-summary";
import { createSharedCart } from "@/lib/shared-cart/actions";
import {
  buildSharedCartLinkWhatsAppHref,
  posLinesToSharedCartLines,
} from "@/lib/shared-cart/messages";
import { adminShell } from "@/lib/design/admin-shell";
import { typography } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

type FilterOption = { id: string; name: string };

function ProductStockInfo({
  product,
  branches,
  selectedBranchId,
}: {
  product: SellerProduct;
  branches: CatalogBranch[];
  selectedBranchId: string;
}) {
  const primaryQty = scopeStock(product, selectedBranchId);
  const level = getStockLevel(primaryQty);
  const styles = STOCK_LEVEL_STYLES[level];
  const others =
    selectedBranchId && primaryQty <= 0
      ? otherBranchesWithStock(product, branches, selectedBranchId)
      : [];

  return (
    <div className="mt-2 space-y-1.5">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
          styles.badge,
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
        {styles.label}
      </span>
      <p className="text-[10px] leading-relaxed text-zinc-500">
        <span className="font-medium text-zinc-600">Total {product.totalStock}</span>
        {branches.map((b) => (
          <span key={b.id}>
            {" · "}
            <span
              className={cn(
                selectedBranchId === b.id && "font-semibold text-zinc-800",
              )}
            >
              {branchLabel(b)} {branchQty(product, b.id)}
            </span>
          </span>
        ))}
      </p>
      {others.length > 0 && (
        <p className="text-[10px] font-medium text-amber-700">
          Sin stock aquí · disponible en {others.map((o) => `${o.name} (${o.qty})`).join(", ")}
        </p>
      )}
    </div>
  );
}

function CartStockHint({
  product,
  quantity,
  branches,
  selectedBranchId,
}: {
  product: SellerProduct;
  quantity: number;
  branches: CatalogBranch[];
  selectedBranchId: string;
}) {
  const available = scopeStock(product, selectedBranchId);
  const branchName = selectedBranchId
    ? branches.find((b) => b.id === selectedBranchId)?.name ?? "sucursal"
    : "total";

  if (quantity <= available) {
    return (
      <p className="mt-1.5 text-[10px] text-zinc-500">
        Stock {branchName}: {available} uds
      </p>
    );
  }

  return (
    <p className="mt-1.5 flex items-start gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-800">
      <span className="shrink-0">⚠</span>
      <span>
        Supera stock en {branchName} ({available} disponible
        {available !== product.totalStock ? ` · total ${product.totalStock}` : ""})
      </span>
    </p>
  );
}

function matchesSearch(p: SellerProduct, q: string): boolean {
  const term = q.trim().toLowerCase();
  if (!term) return true;
  return (
    p.name.toLowerCase().includes(term) ||
    (p.sku?.toLowerCase().includes(term) ?? false) ||
    (p.brandName?.toLowerCase().includes(term) ?? false)
  );
}

export function SellerPos({
  products,
  brands,
  categories,
  branches,
}: {
  products: SellerProduct[];
  brands: FilterOption[];
  categories: FilterOption[];
  branches: CatalogBranch[];
}) {
  const productsById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const {
    hydrated,
    session,
    history,
    activeLines,
    completedLines,
    getQuantity,
    addProduct,
    setQuantity,
    removeLine,
    startNewSession,
    finalizeSale,
    dismissCompleted,
  } = useSellerSession(productsById);

  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmNewSale, setConfirmNewSale] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [finalizeMode, setFinalizeMode] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareMeta, setShareMeta] = useState<{
    url: string;
    fingerprint: string;
  } | null>(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (!matchesSearch(p, query)) return false;
      if (categoryId && p.categoryId !== categoryId) return false;
      if (brandId && p.brandId !== brandId) return false;
      if (inStockOnly && scopeStock(p, branchId) <= 0) return false;
      return true;
    });
  }, [products, query, categoryId, brandId, branchId, inStockOnly]);

  const cartRows = useMemo(
    () =>
      activeLines.map((line) => ({
        line,
        subtotal: lineSubtotal(line),
      })),
    [activeLines],
  );

  const total = sessionTotal(activeLines);

  const summaryInput = useMemo((): PosSummaryInput | null => {
    if (!session || activeLines.length === 0) return null;
    const branch = branchId
      ? (branches.find((b) => b.id === branchId)?.displayName ??
        branches.find((b) => b.id === branchId)?.name ??
        null)
      : null;
    return {
      saleNumber: session.number,
      startedAt: session.startedAt,
      branchLabel: branch,
      lines: activeLines,
    };
  }, [session, activeLines, branchId, branches]);

  const whatsappHref = useMemo(
    () => (summaryInput ? buildPosWhatsAppHref(summaryInput) : ""),
    [summaryInput],
  );

  const summaryText = useMemo(
    () => (summaryInput ? buildPosSaleSummaryText(summaryInput) : ""),
    [summaryInput],
  );

  const cartFingerprint = useMemo(
    () => activeLines.map((l) => `${l.productId}:${l.quantity}`).join("|"),
    [activeLines],
  );

  const ensureShareUrl = async (): Promise<string | null> => {
    if (!summaryInput) return null;
    if (shareMeta?.fingerprint === cartFingerprint) {
      return shareMeta.url;
    }
    setShareLoading(true);
    try {
      const res = await createSharedCart({
        lines: posLinesToSharedCartLines(summaryInput.lines),
        saleNumber: summaryInput.saleNumber,
        branchLabel: summaryInput.branchLabel,
      });
      if (res.ok) {
        setShareMeta({ url: res.url, fingerprint: cartFingerprint });
        return res.url;
      }
    } finally {
      setShareLoading(false);
    }
    return null;
  };

  const handleShareCart = async () => {
    const url = await ensureShareUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2500);
    } catch {
      /* ignore */
    }
  };

  const handleWhatsAppWithLink = async () => {
    const url = await ensureShareUrl();
    if (!url || !summaryInput) return;
    const href = buildSharedCartLinkWhatsAppHref(summaryInput, url);
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const requestNewSale = () => {
    if (session && session.lines.length > 0 && !completedLines) {
      setConfirmNewSale(true);
      return;
    }
    setFinalizeMode(false);
    startNewSession();
  };

  const confirmNewSaleAction = () => {
    setConfirmNewSale(false);
    setFinalizeMode(false);
    startNewSession();
  };

  const handleFinalize = () => {
    if (!session?.lines.length) return;
    finalizeSale();
    setFinalizeMode(true);
  };

  const copySummary = async () => {
    if (!summaryText) return;
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const selectCls = cn(adminShell.select, "h-11 min-h-[44px] rounded-xl px-3");

  if (!hydrated || !session) {
    return (
      <div className="grid h-full place-items-center text-sm text-muted-foreground">
        Cargando modo vendedor…
      </div>
    );
  }

  const displaySessionNumber = completedLines
    ? session.number
    : session.number;
  const isCompleted = Boolean(completedLines);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Confirmar nueva venta */}
      {confirmNewSale && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-new-sale-title"
        >
          <div className={cn(adminShell.modalPanel, "w-full max-w-md p-6")}>
            <h3
              id="confirm-new-sale-title"
              className={adminShell.sectionTitle}
            >
              ¿Deseas iniciar una nueva venta?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              La venta actual contiene productos.
            </p>
            <div className="mt-6 flex gap-3">
              <AdminButton
                type="button"
                variant="secondary"
                className="h-11 flex-1 rounded-xl"
                onClick={() => setConfirmNewSale(false)}
              >
                Cancelar
              </AdminButton>
              <AdminButton
                type="button"
                variant="primary"
                className="h-11 flex-1 rounded-xl"
                onClick={confirmNewSaleAction}
              >
                Iniciar nueva venta
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {summaryInput && (
        <SellerSaleSummary
          open={showSummary}
          onClose={() => setShowSummary(false)}
          saleNumber={summaryInput.saleNumber}
          startedAt={summaryInput.startedAt}
          branchLabel={summaryInput.branchLabel}
          lines={summaryInput.lines}
          whatsappHref={whatsappHref}
          copied={copied}
          onCopy={copySummary}
        />
      )}

      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/admin"
            className={cn(adminShell.iconAction, "h-11 w-11 rounded-xl")}
            aria-label="Volver al panel"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className={adminShell.groupLabel}>Radio Shalko POS</p>
            <h1 className={cn(adminShell.sectionTitle, "truncate text-lg md:text-xl")}>
              Modo vendedor
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className={cn(
              adminShell.iconAction,
              "h-11 w-11 rounded-xl",
              showHistory && adminShell.iconActionActive,
            )}
            aria-label="Historial de ventas"
          >
            <History className="h-5 w-5" />
          </button>
          <AdminButton
            type="button"
            variant="primary"
            className="h-11 rounded-xl px-4"
            onClick={requestNewSale}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva venta</span>
            <span className="sm:hidden">Nueva</span>
          </AdminButton>
        </div>
      </header>

      {showHistory && history.length > 0 && (
        <div className="shrink-0 border-b border-border bg-muted/30 px-4 py-3 md:px-6">
          <p className={adminShell.groupLabel}>Últimas ventas</p>
          <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {history.map((h) => (
              <li
                key={`${h.id}-${h.date}`}
                className={cn(adminShell.mutedBox, "shrink-0 rounded-xl border border-border/60 text-xs")}
              >
                <span className="font-semibold">{formatSaleLabel(h.id)}</span>
                <span className="mx-1.5 text-muted-foreground/40">·</span>
                <span className="text-muted-foreground">{formatSaleTime(h.date)}</span>
                <span className="mx-1.5 text-muted-foreground/40">·</span>
                <span className="font-medium tabular-nums">{formatPrice(h.total)}</span>
                <span className="ml-1 text-muted-foreground/80">
                  ({h.productCount} prod.)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px]">
        {/* Catálogo */}
        <section className="flex min-h-0 flex-col border-b border-border lg:border-b-0 lg:border-r">
          <div className="shrink-0 space-y-3 border-b border-border/60 bg-card p-4 md:p-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, SKU o marca…"
                className={cn(adminShell.input, "h-12 w-full rounded-2xl pl-12 pr-4 text-base")}
                autoComplete="off"
                disabled={isCompleted}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-zinc-400 hover:bg-zinc-100"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className={cn(selectCls, "min-w-[150px] flex-1")}
                aria-label="Sucursal"
                disabled={isCompleted}
              >
                <option value="">Todas las sucursales</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.displayName || b.name}
                  </option>
                ))}
              </select>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={cn(selectCls, "min-w-[140px] flex-1")}
                aria-label="Categoría"
                disabled={isCompleted}
              >
                <option value="">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className={cn(selectCls, "min-w-[140px] flex-1")}
                aria-label="Marca"
                disabled={isCompleted}
              >
                <option value="">Todas las marcas</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setInStockOnly((v) => !v)}
                disabled={isCompleted}
                className={cn(
                  "inline-flex h-11 min-h-[44px] items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors",
                  inStockOnly
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
                  isCompleted && "opacity-50",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    inStockOnly ? "bg-emerald-500" : "bg-zinc-300",
                  )}
                />
                Con stock
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
            {filtered.length === 0 ? (
              <div className={cn(adminShell.emptyState, "grid place-items-center py-20 text-center")}>
                <Package className="h-10 w-10 text-zinc-300" />
                <p className="mt-3 text-sm font-medium text-zinc-700">Sin resultados</p>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((p) => {
                  const primaryQty = scopeStock(p, branchId);
                  const level = getStockLevel(primaryQty);
                  const badge = STOCK_LEVEL_STYLES[level];
                  const inCart = getQuantity(p.id) > 0;
                  return (
                    <li
                      key={p.id}
                      className={cn(
                        "flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md",
                        isCompleted && "opacity-60",
                      )}
                    >
                      <div className="relative aspect-[4/3] bg-zinc-100">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-zinc-300">
                            <Package className="h-8 w-8" />
                          </div>
                        )}
                        <span
                          className={cn(
                            "absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            badge.badge,
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", badge.dot)} />
                          {badge.label}
                        </span>
                        {inCart && (
                          <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-zinc-900 text-white">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-3">
                        {p.brandName && (
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                            {p.brandName}
                          </p>
                        )}
                        <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-zinc-900">
                          {p.name}
                        </p>
                        {p.sku && (
                          <p className="mt-1 text-[11px] text-zinc-400">SKU {p.sku}</p>
                        )}
                        <ProductStockInfo
                          product={p}
                          branches={branches}
                          selectedBranchId={branchId}
                        />
                        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                          <p className="text-base font-semibold tabular-nums text-zinc-900">
                            {formatPrice(p.price)}
                          </p>
                          <AdminButton
                            type="button"
                            variant="primary"
                            className="h-11 min-w-[44px] rounded-xl px-4"
                            onClick={() => addProduct(p.id)}
                            disabled={isCompleted}
                          >
                            <Plus className="h-4 w-4" />
                            Agregar
                          </AdminButton>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Carrito / sesión */}
        <aside className="flex min-h-0 flex-col bg-card lg:max-h-full">
          {/* Sesión activa */}
          <div className="shrink-0 border-b border-border/60 bg-muted/30 px-4 py-4 md:px-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={adminShell.groupLabel}>
                  {isCompleted ? "Venta finalizada" : "Venta actual"}
                </p>
                <p className="mt-0.5 text-xl font-semibold tracking-tight">
                  {formatSaleLabel(displaySessionNumber)}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Iniciada {formatSaleTime(session.startedAt)}
                </p>
              </div>
              <ShoppingBag className="h-6 w-6 shrink-0 text-muted-foreground/40" />
            </div>
            {branchId && !isCompleted && (
              <p className="mt-2 text-[10px] font-medium text-zinc-500">
                Sucursal: {branches.find((b) => b.id === branchId)?.name ?? "—"}
              </p>
            )}
            {isCompleted && (
              <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Venta registrada. Comparte el resumen o inicia la siguiente atención.
              </p>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 md:px-5">
            {cartRows.length === 0 ? (
              <div className={cn(adminShell.emptyState, "grid place-items-center py-16 text-center")}>
                <ShoppingBag className="h-8 w-8 text-zinc-300" />
                <p className="mt-3 text-sm text-zinc-500">
                  {isCompleted
                    ? "Listo para la siguiente venta"
                    : "Agrega productos desde el catálogo"}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100 py-2">
                {cartRows.map(({ line, subtotal }) => {
                  const product = productsById.get(line.productId);
                  return (
                  <li key={line.productId} className="flex gap-3 py-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
                      {line.image && (
                        <img
                          src={line.image}
                          alt={line.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-medium leading-snug text-zinc-900">
                            {line.name}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500 tabular-nums">
                            {formatPrice(line.price)} c/u
                          </p>
                        </div>
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() => removeLine(line.productId)}
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                            aria-label={`Quitar ${line.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        {isCompleted ? (
                          <span className="text-sm text-zinc-600">
                            Cant. {line.quantity}
                          </span>
                        ) : (
                          <QuantityStepper
                            value={line.quantity}
                            size="sm"
                            onChange={(next) => setQuantity(line.productId, next)}
                          />
                        )}
                        <span className="text-sm font-semibold tabular-nums text-zinc-900">
                          {formatPrice(subtotal)}
                        </span>
                      </div>
                      {product && (
                        <CartStockHint
                          product={product}
                          quantity={line.quantity}
                          branches={branches}
                          selectedBranchId={branchId}
                        />
                      )}
                    </div>
                  </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="shrink-0 border-t border-border bg-muted/30 p-4 md:p-5">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm font-medium text-muted-foreground">Total estimado</span>
              <span className={cn(typography.priceTotal, "text-foreground")}>
                {formatPrice(total)}
              </span>
            </div>

            <div className="mt-4 grid gap-2">
              {shareMeta?.fingerprint === cartFingerprint && shareMeta.url && (
                <p className={cn(adminShell.mutedBox, "truncate text-[11px] text-muted-foreground")}>
                  Enlace: {shareMeta.url}
                </p>
              )}
              {isCompleted || finalizeMode ? (
                <>
                  <AdminButton type="button" variant="secondary" size="lg" className="h-12 w-full rounded-xl" onClick={() => setShowSummary(true)}>
                    <Monitor className="h-4 w-4" />
                    Presentar al cliente
                  </AdminButton>
                  <AdminButton type="button" variant="secondary" className="h-11 w-full rounded-xl" onClick={handleShareCart} disabled={shareLoading || cartRows.length === 0}>
                    {shareCopied ? (<><Check className="h-4 w-4 text-emerald-600" />Enlace copiado</>) : (<><Link2 className="h-4 w-4" />{shareLoading ? "Generando…" : "Compartir carrito"}</>)}
                  </AdminButton>
                  <AdminButton type="button" className="h-12 w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleWhatsAppWithLink} disabled={shareLoading || cartRows.length === 0}>
                    <MessageCircle className="h-4 w-4" />
                    Enviar por WhatsApp
                  </AdminButton>
                  <AdminButton type="button" variant="secondary" className="h-11 w-full rounded-xl" onClick={copySummary}>
                    {copied ? (<><Check className="h-4 w-4 text-emerald-600" />Copiado</>) : (<><Copy className="h-4 w-4" />Copiar resumen</>)}
                  </AdminButton>
                  <AdminButton type="button" variant="primary" size="lg" className="h-12 w-full rounded-xl" onClick={dismissCompleted}>
                    <Plus className="h-4 w-4" />
                    Iniciar nueva venta
                  </AdminButton>
                </>
              ) : (
                <>
                  <AdminButton type="button" variant="secondary" size="lg" className="h-12 w-full rounded-xl" onClick={() => setShowSummary(true)} disabled={cartRows.length === 0}>
                    <Monitor className="h-4 w-4" />
                    Presentar al cliente
                  </AdminButton>
                  <AdminButton type="button" variant="secondary" className="h-11 w-full rounded-xl" onClick={handleShareCart} disabled={shareLoading || cartRows.length === 0}>
                    {shareCopied ? (<><Check className="h-4 w-4 text-emerald-600" />Enlace copiado</>) : (<><Link2 className="h-4 w-4" />{shareLoading ? "Generando…" : "Compartir carrito"}</>)}
                  </AdminButton>
                  <AdminButton type="button" className="h-12 w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleWhatsAppWithLink} disabled={shareLoading || cartRows.length === 0}>
                    <MessageCircle className="h-4 w-4" />
                    Enviar por WhatsApp
                  </AdminButton>
                  <AdminButton type="button" variant="primary" size="lg" className="h-12 w-full rounded-xl" onClick={handleFinalize} disabled={cartRows.length === 0}>
                    <Check className="h-4 w-4" />
                    Finalizar venta
                  </AdminButton>
                  <AdminButton type="button" variant="secondary" className="h-11 w-full rounded-xl" onClick={copySummary} disabled={cartRows.length === 0}>
                    <Copy className="h-4 w-4" />
                    Copiar resumen
                  </AdminButton>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
