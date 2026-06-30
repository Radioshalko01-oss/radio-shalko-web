import Link from "next/link";
import { ArrowLeft, Clock, Package, Tag } from "lucide-react";
import { formatPrice } from "@/lib/catalog/format";
import {
  ADMIN_BRANCH_REVIEW_HINTS,
  branchDisplayName,
  historyStatusLabel,
  isOrderPendingReview,
  orderStatusUi,
  paymentStatusUi,
  pickupAvailabilityHint,
} from "@/lib/orders/status-labels";
import type { AdminOrderDetail } from "@/lib/orders/admin-queries";
import { AdminOrderStatusBadge } from "@/components/admin/admin-status-badge";
import { OrderDetailActions } from "@/components/admin/order-detail-actions";
import { OrderAvailabilityReview } from "@/components/admin/order-availability-review";
import { OrderPaymentSection } from "@/components/admin/order-payment-section";
import { OrderFulfillmentSection } from "@/components/admin/order-fulfillment-section";
import { adminShell } from "@/lib/design/admin-shell";
import { typography } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

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
  return <AdminOrderStatusBadge tone={ui.tone}>{ui.label}</AdminOrderStatusBadge>;
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
      <Link href="/admin/pedidos" className={adminShell.backLink}>
        <ArrowLeft className="h-4 w-4" />
        Volver a pedidos
      </Link>

      <div className={adminShell.cardSection}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={typography.labelCaps}>Solicitud de compra</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="font-mono text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                {order.orderNumber}
              </h2>
              <StatusBadge
                status={order.status}
                paymentStatus={order.paymentStatus}
                hasPaymentUrl={order.hasPaymentUrl}
                fulfillmentStatus={order.fulfillmentStatus}
              />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</p>
            {pickupAvailabilityHint(order.availabilityDecision, order.pickupAvailableDate) && (
              <p className="mt-1 text-sm text-muted-foreground">
                {pickupAvailabilityHint(order.availabilityDecision, order.pickupAvailableDate)}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className={adminShell.fieldLabel}>Total estimado</p>
            <p className={typography.priceTotal}>{formatPrice(order.total)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={adminShell.cardSection}>
          <h3 className={adminShell.sectionTitleSm}>Cliente</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className={adminShell.fieldLabel}>Nombre</dt>
              <dd className="font-medium text-foreground">{order.customerName}</dd>
            </div>
            <div>
              <dt className={adminShell.fieldLabel}>Correo</dt>
              <dd className="text-foreground/90">{order.customerEmail || "—"}</dd>
            </div>
            <div>
              <dt className={adminShell.fieldLabel}>Teléfono</dt>
              <dd className="text-foreground/90">{order.customerPhone || "—"}</dd>
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

        <section className={adminShell.cardSection}>
          <h3 className={adminShell.sectionTitleSm}>Recolección</h3>
          <p className="mt-2 text-sm font-medium text-foreground">
            {branchDisplayName(order.branchSlug, order.branchLabel)}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{branchHint}</p>
        </section>
      </div>

      <OrderAvailabilityReview order={order} />

      <OrderPaymentSection order={order} />

      <OrderFulfillmentSection order={order} />

      <section className={cn(adminShell.card, "overflow-hidden")}>
        <div className={cn("border-b px-4 py-3", adminShell.dividerSoft)}>
          <h3 className={adminShell.sectionTitleSm}>
            Productos solicitados{" "}
            <span className="font-normal text-muted-foreground">({order.items.length})</span>
          </h3>
        </div>
        {order.items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Package className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Sin productos en esta solicitud.</p>
          </div>
        ) : (
          <ul className={cn("divide-y", adminShell.dividerSoft)}>
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-3 px-4 py-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted/30">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.productTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Tag className="h-4 w-4 text-muted-foreground/40" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{item.productTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.brandName ?? "Sin marca"}
                    {item.productSku ? ` · SKU ${item.productSku}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.quantity} × {formatPrice(item.unitPrice)} ={" "}
                    <span className="font-semibold text-foreground">{formatPrice(item.subtotal)}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={adminShell.cardSection}>
          <h3 className={adminShell.sectionTitleSm}>Resumen</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal estimado</dt>
              <dd className="font-medium text-foreground">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.shippingCost > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Envío</dt>
                <dd className="font-medium text-foreground">{formatPrice(order.shippingCost)}</dd>
              </div>
            )}
            <div className={cn("flex justify-between border-t pt-2", adminShell.dividerSoft)}>
              <dt className="font-medium text-foreground">Total estimado</dt>
              <dd className="font-semibold text-foreground">{formatPrice(order.total)}</dd>
            </div>
          </dl>
          <p className={cn("mt-3 text-xs text-muted-foreground", adminShell.mutedBox)}>
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
          <section className={adminShell.cardSection}>
            <h3 className={adminShell.sectionTitleSm}>Notas del cliente</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
              {order.notes}
            </p>
          </section>
        )}
      </div>

      <section className={adminShell.cardSection}>
        <h3 className={adminShell.sectionTitleSm}>Historial</h3>
        <ul className="mt-3 space-y-3">
          {historyEntries.map((entry) => (
            <li key={entry.id} className="flex gap-3 text-sm">
              <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted/50">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {historyLabel(entry.toStatus, entry.fromStatus)}
                </p>
                <p className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
                {entry.note && (
                  <p className="mt-1 text-xs text-muted-foreground">{entry.note}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
