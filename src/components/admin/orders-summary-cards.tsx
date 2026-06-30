import Link from "next/link";
import type { AdminOrderNotificationSummary } from "@/lib/orders/notification-queries";
import { adminShell } from "@/lib/design/admin-shell";
import { typography } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

export function OrdersSummaryCards({
  summary,
}: {
  summary: AdminOrderNotificationSummary;
}) {
  const cards: Array<{
    label: string;
    value: number;
    href: string;
    sub?: string;
    highlight?: boolean;
  }> = [
    {
      label: "Pendientes de revisión",
      value: summary.pendingCount,
      href: "/admin/pedidos?filter=pending",
      highlight: summary.pendingCount > 0,
    },
    {
      label: "Aprobados esperando pago",
      value: summary.approvedAwaitingPaymentCount,
      href: "/admin/pedidos?filter=approved",
    },
    {
      label: "No disponibles",
      value: summary.cancelledCount,
      href: "/admin/pedidos?filter=cancelled",
    },
    {
      label: "Solicitudes recientes",
      value: summary.recentTotal,
      href: "/admin/pedidos",
      sub: "Últimos 30 días",
    },
  ];

  return (
    <section className="mb-6">
      <h2 className={typography.label}>Resumen de pedidos</h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={cn(
              adminShell.cardInteractive,
              "flex min-h-[5.25rem] flex-col p-4",
              card.highlight && "border-copper/25 bg-copper/[0.03]",
            )}
          >
            <dt className={adminShell.statLabel}>{card.label}</dt>
            <dd className={cn(adminShell.statValue, "mt-auto pt-2")}>{card.value}</dd>
            {card.sub && <p className={adminShell.statSub}>{card.sub}</p>}
          </Link>
        ))}
      </dl>
    </section>
  );
}
