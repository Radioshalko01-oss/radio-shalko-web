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

type Filters = {
  q: string;
  estado: string;
  from: string;
  to: string;
  sort: string;
  per: string;
  id: string;
};

const selectCls =
  "h-9 rounded-lg border border-zinc-200 bg-white px-2.5 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function StatusBadge({ status }: { status: QuoteStatus }) {
  const label = QUOTE_STATUS_LABELS[status];
  const styles: Record<QuoteStatus, string> = {
    draft: "bg-zinc-100 text-zinc-700",
    sent: "bg-sky-50 text-sky-700",
    closed: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {label}
    </span>
  );
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

      <div className="rounded-xl border border-zinc-200 bg-white p-3">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por email, nombre o ID…"
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400">
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
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Lista */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {result.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Package className="h-8 w-8 text-zinc-300" />
              <p className="text-sm font-medium text-zinc-900">Sin solicitudes</p>
              <p className="text-sm text-zinc-500">Ajusta los filtros o espera carritos de usuarios.</p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {result.items.map((row) => {
                const active = selectedId === row.id;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => navigate({ id: row.id }, true)}
                      className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-zinc-50 ${
                        active ? "bg-zinc-50 ring-1 ring-inset ring-zinc-200" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900">
                            {displayEmail(row)}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-400">
                            {formatDateTime(row.updatedAt)}
                          </p>
                        </div>
                        <StatusBadge status={row.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span>{row.itemCount} producto{row.itemCount === 1 ? "" : "s"}</span>
                        <span className="font-semibold text-zinc-800">{formatPrice(row.total)}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {result.items.length > 0 && (
            <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>Por página</span>
                <select
                  value={filters.per}
                  onChange={(e) =>
                    navigate({ per: e.target.value === "25" ? undefined : e.target.value })
                  }
                  className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs"
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
                  className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 text-xs text-zinc-500">
                  {result.page} / {totalPages}
                </span>
                <button
                  onClick={() => navigate({ page: String(result.page + 1) }, true)}
                  disabled={result.page >= totalPages}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 disabled:opacity-30"
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
            <div className="grid min-h-[280px] place-items-center rounded-xl border border-dashed border-zinc-200 bg-white">
              <div className="max-w-xs text-center">
                <Tag className="mx-auto h-8 w-8 text-zinc-300" />
                <p className="mt-2 text-sm font-medium text-zinc-900">
                  Selecciona una solicitud para ver el detalle.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-zinc-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                      Carrito
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-zinc-900">
                        {displayEmail(detail)}
                      </h2>
                      <StatusBadge status={detail.status} />
                    </div>
                    <p className="mt-1 text-xs text-zinc-400">
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
                    {pending && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2">
                    <p className="text-xs text-zinc-500">Productos</p>
                    <p className="text-lg font-semibold text-zinc-900">{detail.itemCount}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2">
                    <p className="text-xs text-zinc-500">Total estimado</p>
                    <p className="text-lg font-semibold text-zinc-900">
                      {formatPrice(detail.total)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2">
                    <p className="text-xs text-zinc-500">Estado</p>
                    <p className="text-sm font-medium text-zinc-900">
                      {QUOTE_STATUS_LABELS[detail.status]}
                    </p>
                  </div>
                </div>

                {(detail.contactName ||
                  detail.contactPhone ||
                  detail.contactEmail ||
                  detail.userEmail) && (
                  <div className="mt-4 rounded-lg border border-zinc-100 bg-zinc-50/60 px-4 py-3 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      Contacto
                    </p>
                    <ul className="mt-2 space-y-1 text-zinc-700">
                      {detail.contactName && <li>Nombre: {detail.contactName}</li>}
                      {(detail.contactEmail || detail.userEmail) && (
                        <li>Email: {detail.contactEmail ?? detail.userEmail}</li>
                      )}
                      {detail.contactPhone && <li>Teléfono: {detail.contactPhone}</li>}
                    </ul>
                  </div>
                )}

                {detail.note && (
                  <div className="mt-3 rounded-lg border border-zinc-100 bg-white px-4 py-3 text-sm text-zinc-600">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      Nota
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{detail.note}</p>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {whatsappHref && (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Abrir WhatsApp
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={copySummary}
                    disabled={!summaryText}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? "Copiado" : "Copiar resumen"}
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                <div className="border-b border-zinc-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Productos <span className="text-zinc-400">({detail.items.length})</span>
                  </h3>
                </div>
                {detail.items.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-zinc-500">Sin productos.</p>
                ) : (
                  <ul className="divide-y divide-zinc-100">
                    {detail.items.map((it) => (
                      <li key={it.id} className="flex gap-3 px-4 py-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
                          {it.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                          ) : (
                            <Tag className="h-4 w-4 text-zinc-300" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-900">{it.name}</p>
                          <p className="text-xs text-zinc-500">
                            {it.brandName ?? "Sin marca"}
                            {it.sku ? ` · SKU ${it.sku}` : ""}
                          </p>
                          <p className="mt-1 text-xs text-zinc-600">
                            {it.quantity} × {formatPrice(it.unitPrice)} ={" "}
                            <span className="font-semibold text-zinc-900">
                              {formatPrice(it.subtotal)}
                            </span>
                          </p>
                        </div>
                        <Link
                          href={`/admin/productos/${it.productId}/editar`}
                          title="Editar producto"
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                        >
                          <SquarePen className="h-4 w-4" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {detail.items.length > 0 && (
                  <div className="flex justify-end border-t border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900">
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
