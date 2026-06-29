import {
  listAdminOrders,
  type AdminOrderFilter,
  type AdminOrderListFilters,
} from "@/lib/orders/admin-queries";
import { getAdminOrderNotificationSummary } from "@/lib/orders/notification-queries";
import { OrdersManager } from "@/components/admin/orders-manager";
import { OrdersSummaryCards } from "@/components/admin/orders-summary-cards";

type SearchParams = Promise<{
  q?: string;
  filter?: string;
  per?: string;
  page?: string;
}>;

const VALID_FILTERS: AdminOrderFilter[] = [
  "all",
  "pending",
  "approved",
  "chalco",
  "amecameca",
  "paid",
  "cancelled",
];

function parseFilter(value?: string): AdminOrderFilter | undefined {
  if (!value) return undefined;
  return VALID_FILTERS.includes(value as AdminOrderFilter)
    ? (value as AdminOrderFilter)
    : undefined;
}

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const perPage = sp.per === "50" ? 50 : sp.per === "100" ? 100 : 25;
  const page = Math.max(1, Number(sp.page) || 1);
  const filter = parseFilter(sp.filter) ?? "all";

  const listFilters: AdminOrderListFilters = {
    q: sp.q,
    filter,
    page,
    perPage,
  };

  let result;
  let loadError: string | null = null;
  let summary;

  try {
    [result, summary] = await Promise.all([
      listAdminOrders(listFilters),
      getAdminOrderNotificationSummary(),
    ]);
  } catch {
    loadError = "No se pudieron cargar los pedidos. Intenta de nuevo en unos momentos.";
    result = { items: [], total: 0, page, perPage, pendingCount: 0 };
    summary = {
      pendingCount: 0,
      approvedAwaitingPaymentCount: 0,
      cancelledCount: 0,
      recentTotal: 0,
    };
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Pedidos</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Revisa las solicitudes de compra recibidas y prepara la confirmación de disponibilidad.
        </p>
      </div>

      <OrdersSummaryCards summary={summary} />

      <OrdersManager
        result={result}
        loadError={loadError}
        filters={{
          q: sp.q ?? "",
          filter: sp.filter ?? "all",
          per: String(perPage),
        }}
      />
    </div>
  );
}
