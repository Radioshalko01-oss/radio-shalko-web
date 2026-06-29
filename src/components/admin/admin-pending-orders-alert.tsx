import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { AdminOrderNotificationSummary } from "@/lib/orders/notification-queries";

export function AdminPendingOrdersAlert({
  summary,
}: {
  summary: AdminOrderNotificationSummary;
}) {
  if (summary.pendingCount <= 0) return null;

  const n = summary.pendingCount;
  const label =
    n === 1 ? "1 solicitud pendiente de revisión" : `${n} solicitudes pendientes de revisión`;

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3">
      <p className="text-sm text-zinc-700">
        Tienes <span className="font-medium text-zinc-900">{label}</span>.
      </p>
      <Link
        href="/admin/pedidos?filter=pending"
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Revisar pedidos
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
