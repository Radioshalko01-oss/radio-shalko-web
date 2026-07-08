import Link from "next/link";
import { ArrowLeft, Clock, Package, Tag } from "lucide-react";
import { formatPrice } from "@/lib/catalog/format";
import {
  branchDisplayName,
  customerPaymentPreferenceLabel,
  historyStatusLabel,
  isOrderPendingReview,
  orderStatusUi,
} from "@/lib/orders/status-labels";
import type { AdminOrderDetail } from "@/lib/orders/admin-queries";
import { AdminOrderStatusBadge } from "@/components/admin/admin-status-badge";
import { OrderDetailActions } from "@/components/admin/order-detail-actions";
import { OrderAvailabilityReview } from "@/components/admin/order-availability-review";
import { OrderPaymentSection } from "@/components/admin/order-payment-section";
import {
  OrderFinalPriceSection,
  OrderPaymentInstructionsSection,
  OrderWarrantySection,
} from "@/components/admin/order-operational-sections";
import { OrderFulfillmentSection } from "@/components/admin/order-fulfillment-section";
import { OrderNextStepCard } from "@/components/admin/order-next-step-card";
import { OrderProgressSummary } from "@/components/admin/order-progress-summary";
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

function displayOrderTotal(order: AdminOrderDetail): number {
  return order.confirmedFinalPrice ?? order.total;
}

export function OrderDetailView({ order }: { order: AdminOrderDetail }) {
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
        className={cn(
          adminShell.backLink,
          "inline-flex max-lg:items-center max-lg:rounded-lg max-lg:border max-lg:border-border/70 max-lg:bg-card max-lg:px-3 max-lg:py-2",
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a pedidos
      </Link>

      <section className={adminShell.cardSection}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={typography.labelCaps}>Solicitud</p>
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
          </div>
          <div className="text-right">
            <p className={adminShell.fieldLabel}>
              {order.confirmedFinalPriceAt ? "Total confirmado" : "Total estimado"}
            </p>
            <p className={typography.priceTotal}>{formatPrice(displayOrderTotal(order))}</p>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className={adminShell.mutedBox}>
            <dt className={adminShell.fieldLabel}>Estado actual</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {orderStatusUi(order.status, order.paymentStatus, {
                fulfillmentStatus: order.fulfillmentStatus,
              }).label}
            </dd>
          </div>
          <div className={adminShell.mutedBox}>
            <dt className={adminShell.fieldLabel}>Cliente</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{order.customerName}</dd>
            <dd className="text-xs text-muted-foreground">{order.customerEmail || "—"}</dd>
          </div>
          <div className={adminShell.mutedBox}>
            <dt className={adminShell.fieldLabel}>Pago preferido</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {customerPaymentPreferenceLabel(order.paymentMethod)}
            </dd>
          </div>
          <div className={adminShell.mutedBox}>
            <dt className={adminShell.fieldLabel}>Tienda de recolección</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {branchDisplayName(order.branchSlug, order.branchLabel)}
            </dd>
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

      <OrderNextStepCard order={order} />

      <OrderProgressSummary order={order} />

      <div id="order-review">
        <OrderAvailabilityReview order={order} />
      </div>

      <div id="order-price">
        <OrderFinalPriceSection order={order} />
      </div>
      <div id="order-warranty">
        <OrderWarrantySection order={order} />
      </div>
      <div id="order-payment-method">
        <OrderPaymentInstructionsSection order={order} />
      </div>

      <div id="order-validate-payment">
        <OrderPaymentSection order={order} />
      </div>

      <div id="order-fulfillment">
        <OrderFulfillmentSection order={order} />
      </div>

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

      {order.notes && (
        <section className={adminShell.cardSection}>
          <h3 className={adminShell.sectionTitleSm}>Notas del cliente</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
            {order.notes}
          </p>
        </section>
      )}

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
                  {historyStatusLabel(entry.toStatus, entry.fromStatus)}
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
