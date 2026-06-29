"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { formatPrice } from "@/lib/catalog/format";
import {
  orderStatusBadgeClass,
  orderStatusUi,
  pickupAvailabilityHint,
} from "@/lib/orders/status-labels";
import type {
  AdminOrderFilter,
  AdminOrderListResult,
} from "@/lib/orders/admin-queries";

type Filters = {
  q: string;
  filter: string;
  per: string;
};

const FILTER_OPTIONS: { value: AdminOrderFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendientes de revisión" },
  { value: "approved", label: "Aprobados · esperando pago" },
  { value: "paid", label: "Pagados" },
  { value: "ready_for_pickup", label: "Listos para recoger" },
  { value: "delivered", label: "Entregados" },
  { value: "chalco", label: "Chalco" },
  { value: "amecameca", label: "Amecameca" },
  { value: "cancelled", label: "Cancelados" },
];

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function OrderStatusBadge({
  status,
  paymentStatus,
  hasPaymentUrl,
  fulfillmentStatus,
}: {
  status: string;
  paymentStatus: string;
  hasPaymentUrl?: boolean;
  fulfillmentStatus?: string;
}) {
  const ui = orderStatusUi(status, paymentStatus, { hasPaymentUrl, fulfillmentStatus });
  return <span className={orderStatusBadgeClass(ui.tone)}>{ui.label}</span>;
}

function contactLine(email: string, phone: string) {
  if (phone && email) return `${phone} · ${email}`;
  return phone || email || "—";
}

export function OrdersManager({
  result,
  filters,
  loadError,
}: {
  result: AdminOrderListResult;
  filters: Filters;
  loadError?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(filters.q);
  const firstSearch = useRef(true);

  const activeFilter = (filters.filter || "all") as AdminOrderFilter;

  const buildUrl = (updates: Record<string, string | undefined>, keepPage = false) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined || v === "" || v === "all") sp.delete(k);
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

  const totalPages = Math.max(1, Math.ceil(result.total / result.perPage));
  const hasFilters = Boolean(filters.q || (filters.filter && filters.filter !== "all"));
  const sectionTitle =
    activeFilter === "pending"
      ? "Pendientes de revisión"
      : activeFilter === "approved"
        ? "Aprobados esperando pago"
        : activeFilter === "all"
          ? "Solicitudes de compra"
          : "Solicitudes de compra";

  return (
    <div>
      {loadError && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadError}
        </p>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white p-3">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por número de pedido, nombre, teléfono o correo…"
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
          </span>

          {FILTER_OPTIONS.map((opt) => {
            const active = activeFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => navigate({ filter: opt.value === "all" ? undefined : opt.value })}
                className={`h-8 rounded-full px-3 text-xs font-medium transition-colors ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {opt.label}
              </button>
            );
          })}

          {hasFilters && (
            <button
              type="button"
              onClick={() => router.replace(pathname)}
              className="ml-auto text-xs font-medium text-zinc-500 hover:text-zinc-900"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">{sectionTitle}</h2>
          {result.pendingCount > 0 && activeFilter !== "paid" && activeFilter !== "cancelled" && (
            <p className="mt-0.5 text-xs text-zinc-500">
              {result.pendingCount} solicitud{result.pendingCount === 1 ? "" : "es"} por revisar
            </p>
          )}
        </div>
      </div>

      <div className="mt-3">
        {result.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-200 bg-white py-16 text-center">
            <ClipboardList className="h-8 w-8 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-900">Sin solicitudes de compra</p>
            <p className="max-w-sm text-sm text-zinc-500">
              {hasFilters
                ? "No hay pedidos que coincidan con tu búsqueda o filtros."
                : "Cuando un cliente envíe una solicitud desde el checkout, aparecerá aquí."}
            </p>
          </div>
        ) : (
          <ul className="grid gap-2.5">
            {result.items.map((row) => (
              <li key={row.id}>
                <article className="rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm font-semibold tracking-tight text-zinc-900">
                        {row.orderNumber}
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-800">{row.customerName}</p>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {contactLine(row.customerEmail, row.customerPhone)}
                      </p>
                      <p className="mt-2 text-sm text-zinc-600">
                        <span className="font-medium text-zinc-800">{row.branchLabel}</span>
                        <span className="text-zinc-300"> · </span>
                        {row.itemCount} producto{row.itemCount === 1 ? "" : "s"}
                        <span className="text-zinc-300"> · </span>
                        <span className="font-semibold text-zinc-900">{formatPrice(row.total)}</span>
                      </p>
                      {pickupAvailabilityHint(row.availabilityDecision, row.pickupAvailableDate) && (
                        <p className="mt-1 text-xs text-zinc-500">
                          {pickupAvailabilityHint(row.availabilityDecision, row.pickupAvailableDate)}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-zinc-400">{formatDateTime(row.createdAt)}</p>
                    </div>
                    <OrderStatusBadge
                      status={row.status}
                      paymentStatus={row.paymentStatus}
                      hasPaymentUrl={row.hasPaymentUrl}
                      fulfillmentStatus={row.fulfillmentStatus}
                    />
                  </div>
                  <div className="mt-4 flex justify-end border-t border-zinc-100 pt-3">
                    <Link
                      href={`/admin/pedidos/${row.id}`}
                      className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}

        {result.items.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>Por página</span>
              <select
                value={filters.per}
                onChange={(e) =>
                  navigate({ per: e.target.value === "25" ? undefined : e.target.value }, true)
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
                type="button"
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
                type="button"
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
    </div>
  );
}
