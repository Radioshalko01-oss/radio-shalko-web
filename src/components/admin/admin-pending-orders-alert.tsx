import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { AdminOrderNotificationSummary } from "@/lib/orders/notification-queries";
import { AdminButton } from "@/components/admin/admin-button";
import { adminShell } from "@/lib/design/admin-shell";
import { cn } from "@/lib/utils";

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
    <div
      className={cn(
        adminShell.alertBanner,
        "mb-6 flex flex-wrap items-center justify-between gap-3",
      )}
    >
      <p className="text-sm text-foreground/85">
        Tienes <span className="font-medium text-foreground">{label}</span>.
      </p>
      <AdminButton asChild size="sm" variant="accent">
        <Link href="/admin/pedidos?filter=pending">
          Revisar pedidos
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </AdminButton>
    </div>
  );
}
