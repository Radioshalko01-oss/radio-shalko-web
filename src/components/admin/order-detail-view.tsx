import Link from "next/link";
import { ArrowLeft, Clock, Package, Tag } from "lucide-react";
import { formatPrice } from "@/lib/catalog/format";
import {
  ADMIN_BRANCH_REVIEW_HINTS,
  branchDisplayName,
  historyStatusLabel,
  isOrderPendingReview,
  orderStatusBadgeClass,
  orderStatusUi,
  paymentStatusUi,
  pickupAvailabilityHint,
} from "@/lib/orders/status-labels";
import type { AdminOrderDetail } from "@/lib/orders/admin-queries";
import { OrderDetailActions } from "@/components/admin/order-detail-actions";
import { OrderAvailabilityReview } from "@/components/admin/order-availability-review";
import { OrderPaymentSection } from "@/components/admin/order-payment-section";
import { OrderFulfillmentSection } from "@/components/admin/order-fulfillment-section";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

function StatusBadge({
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

function historyLabel(toStatus: string, fromStatus: string | null): string {
  return historyStatusLabel(toStatus, fromStatus);
}

export function OrderDetailView({ order }: { order: AdminOrderDetail }) {
  const branchHint =
    order.branchSlug === "chalco" || order.branchSlug === "amecameca"
      ? ADMIN_BRANCH_REVIEW_HINTS[order.branchSlug]
      : "Revisa disponibilidad antes de confirmar al cliente.";

  const historyEntries =
    order.history.length > 0
      ? order.history
      : [
          {
            id: "created",
            fromStatus: null,
            toStatus: order.status,
            note: null,
            createdAt: order.createdAt,
          },
        ];

  return (
    <div className="space-y-5">
      <Link
        href="/admin/pedidos"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a pedidos
      </Link>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Solicitud de compra
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="font-mono text-xl font-semibold tracking-tight text-zinc-900">
                {order.orderNumber}
              </h2>
              <StatusBadge
                status={order.status}
                paymentStatus={order.paymentStatus}
                hasPaymentUrl={order.hasPaymentUrl}
                fulfillmentStatus={order.fulfillmentStatus}
              />
            </div>
            <p className="mt-1 text-sm text-zinc-500">{formatDateTime(order.createdAt)}</p>
            {pickupAvailabilityHint(order.availabilityDecision, order.pickupAvailableDate) && (
              <p className="mt-1 text-sm text-zinc-500">
                {pickupAvailabilityHint(order.availabilityDecision, order.pickupAvailableDate)}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">Total estimado</p>
            <p className="text-2xl font-semibold text-zinc-900">{formatPrice(order.total)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-zinc-900">Cliente</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-xs text-zinc-500">Nombre</dt>
              <dd className="font-medium text-zinc-900">{order.customerName}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Correo</dt>
              <dd className="text-zinc-800">{order.customerEmail || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Teléfono</dt>
              <dd className="text-zinc-800">{order.customerPhone || "—"}</dd>
            </div>
          </dl>
          <div className="mt-4">
            <OrderDetailActions
              orderNumber={order.orderNumber}
              phone={order.customerPhone}
              showPendingWhatsApp={isOrderPendingReview(order.status, order.paymentStatus)}
            />
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-zinc-900">Recolección</h3>
          <p className="mt-2 text-sm font-medium text-zinc-900">
            {branchDisplayName(order.branchSlug, order.branchLabel)}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">{branchHint}</p>
        </section>
      </div>

      <OrderAvailabilityReview order={order} />

      <OrderPaymentSection order={order} />

      <OrderFulfillmentSection order={order} />

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-zinc-900">
            Productos solicitados{" "}
            <span className="font-normal text-zinc-400">({order.items.length})</span>
          </h3>
        </div>
        {order.items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Package className="h-8 w-8 text-zinc-300" />
            <p className="text-sm text-zinc-500">Sin productos en esta solicitud.</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-3 px-4 py-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.productTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Tag className="h-4 w-4 text-zinc-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900">{item.productTitle}</p>
                  <p className="text-xs text-zinc-500">
                    {item.brandName ?? "Sin marca"}
                    {item.productSku ? ` · SKU ${item.productSku}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {item.quantity} × {formatPrice(item.unitPrice)} ={" "}
                    <span className="font-semibold text-zinc-900">{formatPrice(item.subtotal)}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-zinc-900">Resumen</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Subtotal estimado</dt>
              <dd className="font-medium text-zinc-900">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.shippingCost > 0 && (
              <div className="flex justify-between">
                <dt className="text-zinc-500">Envío</dt>
                <dd className="font-medium text-zinc-900">{formatPrice(order.shippingCost)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-zinc-100 pt-2">
              <dt className="font-medium text-zinc-900">Total estimado</dt>
              <dd className="text-lg font-semibold text-zinc-900">{formatPrice(order.total)}</dd>
            </div>
          </dl>
          <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
            {paymentStatusUi(order.paymentStatus, order.status, {
              hasPaymentUrl: order.hasPaymentUrl,
              fulfillmentStatus: order.fulfillmentStatus,
            })}
            {order.status === "confirmed" &&
            order.paymentStatus === "unpaid" &&
            !order.hasPaymentUrl
              ? " · El pago aún no ha sido solicitado."
              : order.status === "pending"
                ? " · El pago aún no ha sido solicitado."
                : ""}
          </p>
        </section>

        {order.notes && (
          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-zinc-900">Notas del cliente</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
              {order.notes}
            </p>
          </section>
        )}
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-zinc-900">Historial</h3>
        <ul className="mt-3 space-y-3">
          {historyEntries.map((entry) => (
            <li key={entry.id} className="flex gap-3 text-sm">
              <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-zinc-100">
                <Clock className="h-4 w-4 text-zinc-500" />
              </div>
              <div>
                <p className="font-medium text-zinc-900">
                  {historyLabel(entry.toStatus, entry.fromStatus)}
                </p>
                <p className="text-xs text-zinc-500">{formatDateTime(entry.createdAt)}</p>
                {entry.note && (
                  <p className="mt-1 text-xs text-zinc-600">{entry.note}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
