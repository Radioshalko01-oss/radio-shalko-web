import Link from "next/link";
import type { AdminOrderNotificationSummary } from "@/lib/orders/notification-queries";

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
  }> = [
    {
      label: "Pendientes de revisión",
      value: summary.pendingCount,
      href: "/admin/pedidos?filter=pending",
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
    <section className="mb-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Resumen de pedidos
      </h2>
      <dl className="mt-2.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="flex min-h-[5.25rem] flex-col rounded-xl border border-zinc-200 bg-white p-3.5 transition-colors hover:border-zinc-300"
          >
            <dt className="text-xs text-zinc-500">{card.label}</dt>
            <dd className="mt-auto pt-1 text-2xl font-semibold tabular-nums leading-none text-zinc-900">
              {card.value}
            </dd>
            {card.sub && <p className="mt-1 text-[11px] text-zinc-400">{card.sub}</p>}
          </Link>
        ))}
      </dl>
    </section>
  );
}
