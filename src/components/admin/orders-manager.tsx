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
import { AdminButton } from "@/components/admin/admin-button";
import { adminShell } from "@/lib/design/admin-shell";
import { cn } from "@/lib/utils";
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

      <div className={adminShell.cardToolbar}>
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por número de pedido, nombre, teléfono o correo…"
            className={cn(adminShell.input, "pl-9")}
          />
        </div>

        <div className={cn("mt-3 flex flex-wrap items-center gap-2 border-t pt-3", adminShell.dividerSoft)}>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
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
                className={cn(
                  "h-8 transition-colors",
                  active ? adminShell.filterActive : adminShell.filterInactive,
                )}
              >
                {opt.label}
              </button>
            );
          })}

          {hasFilters && (
            <button
              type="button"
              onClick={() => router.replace(pathname)}
              className="ml-auto text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <h2 className={adminShell.sectionTitleSm}>{sectionTitle}</h2>
          {result.pendingCount > 0 && activeFilter !== "paid" && activeFilter !== "cancelled" && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {result.pendingCount} solicitud{result.pendingCount === 1 ? "" : "es"} por revisar
            </p>
          )}
        </div>
      </div>

      <div className="mt-3">
        {result.items.length === 0 ? (
          <div className={cn(adminShell.emptyState, "flex flex-col items-center justify-center gap-2 py-16 text-center")}>
            <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">Sin solicitudes de compra</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {hasFilters
                ? "No hay pedidos que coincidan con tu búsqueda o filtros."
                : "Cuando un cliente envíe una solicitud desde el checkout, aparecerá aquí."}
            </p>
          </div>
        ) : (
          <ul className="grid gap-2.5">
            {result.items.map((row) => (
              <li key={row.id}>
                <article className={cn(adminShell.cardInteractive, "p-4")}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm font-semibold tracking-tight text-foreground">
                        {row.orderNumber}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground/90">{row.customerName}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {contactLine(row.customerEmail, row.customerPhone)}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground/85">{row.branchLabel}</span>
                        <span className="text-border"> · </span>
                        {row.itemCount} producto{row.itemCount === 1 ? "" : "s"}
                        <span className="text-border"> · </span>
                        <span className="font-semibold text-foreground">{formatPrice(row.total)}</span>
                      </p>
                      {pickupAvailabilityHint(row.availabilityDecision, row.pickupAvailableDate) && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {pickupAvailabilityHint(row.availabilityDecision, row.pickupAvailableDate)}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground/70">{formatDateTime(row.createdAt)}</p>
                    </div>
                    <OrderStatusBadge
                      status={row.status}
                      paymentStatus={row.paymentStatus}
                      hasPaymentUrl={row.hasPaymentUrl}
                      fulfillmentStatus={row.fulfillmentStatus}
                    />
                  </div>
                  <div className={cn("mt-4 flex justify-end border-t pt-3", adminShell.dividerSoft)}>
                    <AdminButton asChild size="default">
                      <Link href={`/admin/pedidos/${row.id}`}>Ver detalle</Link>
                    </AdminButton>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}

        {result.items.length > 0 && (
          <div className={cn(adminShell.cardToolbar, "mt-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3")}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Por página</span>
              <select
                value={filters.per}
                onChange={(e) =>
                  navigate({ per: e.target.value === "25" ? undefined : e.target.value }, true)
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
                type="button"
                onClick={() =>
                  navigate({ page: result.page > 2 ? String(result.page - 1) : undefined }, true)
                }
                disabled={result.page <= 1}
                className={cn(adminShell.select, "grid h-8 w-8 place-items-center p-0 disabled:opacity-30")}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-xs text-muted-foreground">
                {result.page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => navigate({ page: String(result.page + 1) }, true)}
                disabled={result.page >= totalPages}
                className={cn(adminShell.select, "grid h-8 w-8 place-items-center p-0 disabled:opacity-30")}
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
