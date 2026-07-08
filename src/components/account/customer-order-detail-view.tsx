import Link from "next/link";
import { ArrowLeft, MessageCircle, Settings2 } from "lucide-react";
import { formatPrice } from "@/lib/catalog/format";
import { whatsappHref } from "@/lib/site-contact";
import {
  branchDisplayName,
  buildCustomerOrderWhatsAppMessage,
  customerOrderStatusBadgeClass,
  customerOrderStatusUi,
  customerPaymentSummary,
  customerPickupSummary,
} from "@/lib/orders/customer-status-labels";
import { typography } from "@/lib/design/tokens";
import { siteShell } from "@/lib/design/site-shell";
import { cn } from "@/lib/utils";
import type { CustomerOrderDetail } from "@/lib/orders/customer-queries";
import { CustomerOrderLineRow } from "@/components/account/customer-orders-list";
import { CustomerTransferCard } from "@/components/account/customer-transfer-card";
import { PurchaseTrustLinkRow } from "@/components/trust/purchase-trust-note";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

function OrderCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card/60 p-5", className)}>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function CustomerOrderDetailView({
  order,
  createdQuery,
  isAdminViewer = false,
}: {
  order: CustomerOrderDetail;
  createdQuery?: string | null;
  isAdminViewer?: boolean;
}) {
  const status = customerOrderStatusUi(order.status, order.paymentStatus, {
    fulfillmentStatus: order.fulfillmentStatus,
    pickupReadyMessage: order.pickupReadyMessage,
    pickupReadyEstimate: order.pickupReadyEstimate,
    paymentInstructionsSent: order.paymentInstructionsSent,
    paymentMethod: order.paymentMethod,
  });
  const isPaid = order.paymentStatus === "paid";
  const isTransfer = order.paymentMethod === "bank_transfer";
  const showTransferCard =
    isTransfer && order.paymentInstructionsSent && !isPaid && order.status === "confirmed";
  const hasConfirmedPrice = order.confirmedFinalPrice != null;
  const displayTotal = order.confirmedFinalPrice ?? order.total;
  const waLink = whatsappHref(undefined, buildCustomerOrderWhatsAppMessage(order.orderNumber));

  return (
    <div className="space-y-5 pt-8">
      <Link
        href="/cuenta/pedidos"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a mis pedidos
      </Link>

      {isAdminViewer && (
        <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm">
          <p className="text-foreground/85">
            Estás viendo este pedido desde una cuenta administrativa.
          </p>
          <Link
            href={`/admin/pedidos/${order.id}`}
            className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <Settings2 className="h-4 w-4" />
            Gestionar en panel admin
          </Link>
        </div>
      )}

      {createdQuery === "1" && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900/85">
          Solicitud enviada correctamente. Radio Shalko la revisará y te contactará.
        </div>
      )}

      <div className={cn(siteShell.cardMuted, "p-5 md:p-6")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={siteShell.brandEyebrow}>Solicitud de compra</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                {order.orderNumber}
              </h1>
              <span className={customerOrderStatusBadgeClass(status.tone)}>{status.label}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {hasConfirmedPrice ? "Total confirmado" : "Total estimado"}
            </p>
            <p className={typography.priceTotal}>{formatPrice(displayTotal)}</p>
          </div>
        </div>
      </div>

      {order.customerMessage && (
        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground/85">
          <p className="font-medium text-foreground">Mensaje de Radio Shalko</p>
          <p className="mt-1 whitespace-pre-wrap leading-relaxed">{order.customerMessage}</p>
        </div>
      )}

      <OrderCard title="Estado de solicitud">
        <p className="text-sm leading-relaxed text-foreground/85">{status.description}</p>
      </OrderCard>

      <OrderCard title="Pago">
        <p className="text-sm leading-relaxed text-foreground/85">
          {customerPaymentSummary(
            order.status,
            order.paymentStatus,
            order.paymentMethod,
            order.paymentInstructionsSent,
          )}
        </p>
        {hasConfirmedPrice && (
          <p className="mt-2 text-sm text-muted-foreground">
            Total confirmado: <span className="font-medium text-foreground">{formatPrice(displayTotal)}</span>
            {order.confirmedFinalPriceNote ? ` · ${order.confirmedFinalPriceNote}` : ""}
          </p>
        )}
      </OrderCard>

      {showTransferCard && <CustomerTransferCard orderNumber={order.orderNumber} />}

      <OrderCard title="Recolección">
        <p className="text-sm leading-relaxed text-foreground/85">
          {customerPickupSummary(order.branchSlug, order.branchLabel, order.fulfillmentStatus)}
        </p>
      </OrderCard>

      {order.warrantyLabel && (
        <OrderCard title="Garantía">
          <p className="text-sm leading-relaxed text-foreground/85">{order.warrantyLabel}</p>
        </OrderCard>
      )}

      <section className="overflow-hidden rounded-2xl border border-border bg-card/60">
        <div className="border-b border-border/60 px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Productos solicitados{" "}
            <span className="font-normal text-muted-foreground">({order.items.length})</span>
          </h2>
        </div>
        {order.items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">Sin productos.</p>
        ) : (
          <ul className="divide-y divide-border/60 px-5">
            {order.items.map((item) => (
              <CustomerOrderLineRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>

      {order.notes && (
        <OrderCard title="Notas de tu solicitud">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
            {order.notes}
          </p>
        </OrderCard>
      )}

      {!isAdminViewer && (
        <div className="space-y-4">
          <PurchaseTrustLinkRow
            className="justify-start"
            linkKeys={["metodosPago", "compraSegura", "comoComprar"]}
          />
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground/20"
          >
            <MessageCircle className="h-4 w-4" />
            Contactar a Radio Shalko
          </a>
        </div>
      )}
    </div>
  );
}
