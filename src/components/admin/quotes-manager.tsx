"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  MessageCircle,
  Package,
  Search,
  SlidersHorizontal,
  SquarePen,
  Tag,
} from "lucide-react";
import { formatPrice } from "@/lib/catalog/format";
import { SITE_CONTACT } from "@/lib/site-contact";
import {
  buildQuoteWhatsAppHref,
  buildQuoteWhatsAppMessage,
} from "@/lib/whatsapp/product-message";
import type {
  AdminQuoteDetail,
  AdminQuoteListItem,
  AdminQuoteListResult,
} from "@/lib/admin/quote-queries";
import {
  QUOTE_STATUSES,
  QUOTE_STATUS_LABELS,
  type QuoteStatus,
} from "@/lib/admin/quote-constants";
import { updateQuoteStatus } from "@/lib/admin/quote-actions";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminButton } from "@/components/admin/admin-button";
import { AdminEmptyState, adminInputClass, adminSelectClass } from "@/components/admin/admin-patterns";
import { adminShell } from "@/lib/design/admin-shell";
import { cn } from "@/lib/utils";

type Filters = {
  q: string;
  estado: string;
  from: string;
  to: string;
  sort: string;
  per: string;
  id: string;
};

const selectCls = adminSelectClass();

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function StatusBadge({ status }: { status: QuoteStatus }) {
  const label = QUOTE_STATUS_LABELS[status];
  const tone =
    status === "draft"
      ? "neutral"
      : status === "sent"
        ? "approved"
        : status === "closed"
          ? "active"
          : "danger";
  return <AdminStatusBadge tone={tone}>{label}</AdminStatusBadge>;
}

function displayEmail(row: AdminQuoteListItem) {
  return row.contactEmail ?? row.userEmail ?? "—";
}

export function QuotesManager({
  result,
  detail,
  filters,
}: {
  result: AdminQuoteListResult;
  detail: AdminQuoteDetail | null;
  filters: Filters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [q, setQ] = useState(filters.q);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const firstSearch = useRef(true);

  const selectedId = filters.id || detail?.id || null;

  const buildUrl = (updates: Record<string, string | undefined>, keepPage = false) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    if (!keepPage) sp.delete("page");
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const navigate = (updates: Record<string, string | undefined>, keepPage = false) => {
    router.replace(buildUrl(updates, keepPage));
  };

  useEffect(() => {
    if (firstSearch.current) {
      firstSearch.current = false;
      return;
    }
    const t = setTimeout(() => navigate({ q: q.trim() || undefined }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const flash = (msg: string) => {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess((s) => (s === msg ? null : s)), 3000);
  };

  const changeStatus = (status: QuoteStatus) => {
    if (!detail) return;
    setError(null);
    startTransition(async () => {
      const res = await updateQuoteStatus(detail.id, status);
      if (!res.ok) return setError(res.error);
      flash(`Estado actualizado a ${QUOTE_STATUS_LABELS[status]}.`);
      router.refresh();
    });
  };

  const whatsappLines = detail?.items.map((it) => ({
    name: it.brandName ? `${it.name} (${it.brandName})` : it.name,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
  }));

  const whatsappHref =
    whatsappLines && whatsappLines.length > 0
      ? buildQuoteWhatsAppHref(
          whatsappLines,
          detail?.contactPhone?.replace(/\D/g, "")
            ? detail.contactPhone.replace(/\D/g, "").startsWith("52")
              ? detail.contactPhone.replace(/\D/g, "")
              : `52${detail.contactPhone.replace(/\D/g, "")}`
            : SITE_CONTACT.whatsapp.e164,
        )
      : null;

  const summaryText =
    whatsappLines && whatsappLines.length > 0 ? buildQuoteWhatsAppMessage(whatsappLines) : "";

  const copySummary = async () => {
    if (!summaryText) return;
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No se pudo copiar al portapapeles.");
    }
  };

  const totalPages = Math.max(1, Math.ceil(result.total / result.perPage));
  const hasFilters = Boolean(filters.q || filters.estado || filters.from || filters.to);

  return (
    <div>
      {error && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <Check className="h-4 w-4" />
          {success}
        </p>
      )}

      <div className={adminShell.cardToolbar}>
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por email, nombre o ID…"
            className={cn(adminInputClass(), "pl-9")}
          />
        </div>

        <div className={cn("mt-3 flex flex-wrap items-center gap-2 border-t pt-3", adminShell.dividerSoft)}>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
          </span>

          <select
            value={filters.estado}
            onChange={(e) => navigate({ estado: e.target.value || undefined })}
            className={selectCls}
          >
            <option value="">Estado</option>
            {QUOTE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {QUOTE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.from}
            onChange={(e) => navigate({ from: e.target.value || undefined })}
            className={selectCls}
            title="Desde"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => navigate({ to: e.target.value || undefined })}
            className={selectCls}
            title="Hasta"
          />

          <select
            value={filters.sort}
            onChange={(e) =>
              navigate({ sort: e.target.value === "recent" ? undefined : e.target.value })
            }
            className={selectCls}
          >
            <option value="recent">Más recientes</option>
            <option value="oldest">Más antiguas</option>
            <option value="total_desc">Total mayor</option>
            <option value="total_asc">Total menor</option>
          </select>

          <div className="ml-auto flex items-center gap-2">
            {hasFilters && (
              <button
                onClick={() => router.replace(pathname)}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Lista */}
        <div className={adminShell.tableShell}>
          {result.items.length === 0 ? (
            <AdminEmptyState
              icon={<Package className="h-8 w-8 text-muted-foreground/40" />}
              title="Sin solicitudes"
              description="Ajusta los filtros o espera carritos de usuarios."
            />
          ) : (
            <ul className={cn("divide-y", adminShell.dividerSoft)}>
              {result.items.map((row) => {
                const active = selectedId === row.id;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => navigate({ id: row.id }, true)}
                      className={cn(
                        "flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-muted/30",
                        active && "bg-copper/5 ring-1 ring-inset ring-copper/20",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{displayEmail(row)}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatDateTime(row.updatedAt)}
                          </p>
                        </div>
                        <StatusBadge status={row.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{row.itemCount} producto{row.itemCount === 1 ? "" : "s"}</span>
                        <span className="font-semibold text-foreground">{formatPrice(row.total)}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {result.items.length > 0 && (
            <div className={cn("flex items-center justify-between gap-3 border-t px-4 py-3", adminShell.dividerSoft)}>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Por página</span>
                <select
                  value={filters.per}
                  onChange={(e) =>
                    navigate({ per: e.target.value === "25" ? undefined : e.target.value })
                  }
                  className={cn(adminShell.select, "h-8 px-2 text-xs")}
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span>
                  {(result.page - 1) * result.perPage + 1}–
                  {Math.min(result.page * result.perPage, result.total)} de {result.total}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    navigate({ page: result.page > 2 ? String(result.page - 1) : undefined }, true)
                  }
                  disabled={result.page <= 1}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/40 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 text-xs text-muted-foreground">
                  {result.page} / {totalPages}
                </span>
                <button
                  onClick={() => navigate({ page: String(result.page + 1) }, true)}
                  disabled={result.page >= totalPages}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/40 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detalle */}
        <section className="min-w-0">
          {!detail ? (
            <div className={cn(adminShell.emptyState, "grid min-h-[280px] place-items-center p-6")}>
              <div className="max-w-xs text-center">
                <Tag className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-sm font-medium">
                  Selecciona una solicitud para ver el detalle.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={cn(adminShell.cardSection, "p-5")}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className={adminShell.groupLabel}>Carrito</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <h2 className={adminShell.sectionTitle}>{displayEmail(detail)}</h2>
                      <StatusBadge status={detail.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Creada {formatDateTime(detail.createdAt)} · Actualizada{" "}
                      {formatDateTime(detail.updatedAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={detail.status}
                      disabled={pending}
                      onChange={(e) => changeStatus(e.target.value as QuoteStatus)}
                      className={selectCls}
                    >
                      {QUOTE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {QUOTE_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    {pending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className={cn(adminShell.mutedBox, "rounded-lg border border-border/60")}>
                    <p className={adminShell.fieldLabel}>Productos</p>
                    <p className={adminShell.statValue}>{detail.itemCount}</p>
                  </div>
                  <div className={cn(adminShell.mutedBox, "rounded-lg border border-border/60")}>
                    <p className={adminShell.fieldLabel}>Total estimado</p>
                    <p className={adminShell.statValue}>{formatPrice(detail.total)}</p>
                  </div>
                  <div className={cn(adminShell.mutedBox, "rounded-lg border border-border/60")}>
                    <p className={adminShell.fieldLabel}>Estado</p>
                    <p className="text-sm font-medium">{QUOTE_STATUS_LABELS[detail.status]}</p>
                  </div>
                </div>

                {(detail.contactName ||
                  detail.contactPhone ||
                  detail.contactEmail ||
                  detail.userEmail) && (
                  <div className={cn(adminShell.mutedBox, "mt-4 rounded-lg border border-border/60 px-4 py-3 text-sm")}>
                    <p className={adminShell.groupLabel}>Contacto</p>
                    <ul className="mt-2 space-y-1 text-foreground/85">
                      {detail.contactName && <li>Nombre: {detail.contactName}</li>}
                      {(detail.contactEmail || detail.userEmail) && (
                        <li>Email: {detail.contactEmail ?? detail.userEmail}</li>
                      )}
                      {detail.contactPhone && <li>Teléfono: {detail.contactPhone}</li>}
                    </ul>
                  </div>
                )}

                {detail.note && (
                  <div className={cn(adminShell.cardSection, "mt-3 px-4 py-3 text-sm")}>
                    <p className={adminShell.groupLabel}>Nota</p>
                    <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{detail.note}</p>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {whatsappHref && (
                    <AdminButton asChild variant="primary" size="sm">
                      <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4" />
                        Abrir WhatsApp
                      </a>
                    </AdminButton>
                  )}
                  <AdminButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={copySummary}
                    disabled={!summaryText}
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? "Copiado" : "Copiar resumen"}
                  </AdminButton>
                </div>
              </div>

              <div className={adminShell.tableShell}>
                <div className={cn("border-b px-4 py-3", adminShell.dividerSoft)}>
                  <h3 className={adminShell.sectionTitleSm}>
                    Productos <span className="text-muted-foreground">({detail.items.length})</span>
                  </h3>
                </div>
                {detail.items.length === 0 ? (
                  <AdminEmptyState title="Sin productos" description="Esta solicitud no tiene líneas." className="py-10" />
                ) : (
                  <ul className={cn("divide-y", adminShell.dividerSoft)}>
                    {detail.items.map((it) => (
                      <li key={it.id} className="flex gap-3 px-4 py-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted/40">
                          {it.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                          ) : (
                            <Tag className="h-4 w-4 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{it.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {it.brandName ?? "Sin marca"}
                            {it.sku ? ` · SKU ${it.sku}` : ""}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {it.quantity} × {formatPrice(it.unitPrice)} ={" "}
                            <span className="font-semibold text-foreground">
                              {formatPrice(it.subtotal)}
                            </span>
                          </p>
                        </div>
                        <Link
                          href={`/admin/productos/${it.productId}/editar`}
                          title="Editar producto"
                          className={adminShell.iconAction}
                        >
                          <SquarePen className="h-4 w-4" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {detail.items.length > 0 && (
                  <div className={cn("flex justify-end border-t px-4 py-3 text-sm font-semibold", adminShell.dividerSoft)}>
                    Total estimado: {formatPrice(detail.total)}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
