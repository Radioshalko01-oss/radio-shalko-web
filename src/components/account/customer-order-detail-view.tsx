import Link from "next/link";
import { ArrowLeft, MessageCircle, Settings2 } from "lucide-react";
import { formatPrice } from "@/lib/catalog/format";
import { whatsappHref } from "@/lib/site-contact";
import {
  branchDisplayName,
  buildCustomerOrderWhatsAppMessage,
  customerOrderStatusBadgeClass,
  customerOrderStatusUi,
  customerPickupHint,
} from "@/lib/orders/customer-status-labels";
import { customerPaymentPreferenceLabel } from "@/lib/orders/status-labels";
import { typography } from "@/lib/design/tokens";
import { siteShell } from "@/lib/design/site-shell";
import { cn } from "@/lib/utils";
import type { CustomerOrderDetail } from "@/lib/orders/customer-queries";
import { CustomerOrderLineRow } from "@/components/account/customer-orders-list";
import { PurchaseTrustLinkRow } from "@/components/trust/purchase-trust-note";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
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
  });
  const isPaid = order.paymentStatus === "paid";
  const isPending = order.status === "pending" && order.paymentStatus === "unpaid";
  const isApprovedUnpaid =
    order.status === "confirmed" && order.paymentStatus === "unpaid";
  const fs = order.fulfillmentStatus;
  const paymentPreference = customerPaymentPreferenceLabel(order.paymentMethod);
  const hasConfirmedPrice = order.confirmedFinalPrice != null;
  const displayTotal = order.confirmedFinalPrice ?? order.total;
  const hasPriceAdjustment =
    Boolean(order.confirmedFinalPriceNote) ||
    (hasConfirmedPrice && order.confirmedFinalPrice !== order.subtotal);
  const isTransfer = order.paymentMethod === "bank_transfer";
  const showTransferInstructionsMessage =
    isApprovedUnpaid && isTransfer && order.paymentInstructionsSent;

  const waLink = whatsappHref(undefined, buildCustomerOrderWhatsAppMessage(order.orderNumber));

  return (
    <div className="space-y-6 pt-8">
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
          Solicitud enviada correctamente. Radio Shalko la revisará y te contactará por canales
          oficiales.
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
              {hasConfirmedPrice ? "Precio final confirmado con el cliente" : "Total estimado"}
            </p>
            <p className={typography.priceTotal}>{formatPrice(displayTotal)}</p>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card/60 p-5">
        <h2 className="text-sm font-semibold text-foreground">Estado actual</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/85">{status.description}</p>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-5">
        <h2 className="text-sm font-semibold text-foreground">Preferencia de pago</h2>
        <p className="mt-2 text-sm font-medium text-foreground">{paymentPreference}</p>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-5">
        <h2 className="text-sm font-semibold text-foreground">Tienda de recolección</h2>
        <p className="mt-2 text-sm font-medium text-foreground">
          {branchDisplayName(order.branchSlug, order.branchLabel)}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Radio Shalko confirmará disponibilidad, garantía y forma de pago final. No realizamos
          envíos; debes recoger tu producto en la tienda indicada.
        </p>
      </section>

      {hasConfirmedPrice && (
        <section className="rounded-2xl border border-border bg-card/60 p-5">
          <h2 className="text-sm font-semibold text-foreground">
            Precio final confirmado con el cliente
          </h2>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {formatPrice(order.confirmedFinalPrice!)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Este monto fue acordado y confirmado contigo por Radio Shalko.
          </p>
          {order.confirmedFinalPriceNote && (
            <p className="mt-2 text-sm text-foreground/85">{order.confirmedFinalPriceNote}</p>
          )}
          {hasPriceAdjustment && (
            <p className="mt-3 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Este precio fue acordado contigo. Debes aceptarlo antes de continuar con el pago.
            </p>
          )}
        </section>
      )}

      {order.warrantyLabel && (
        <section className="rounded-2xl border border-border bg-card/60 p-5">
          <h2 className="text-sm font-semibold text-foreground">Garantía</h2>
          <p className="mt-2 text-sm font-medium text-foreground">{order.warrantyLabel}</p>
        </section>
      )}

      {order.customerMessage && (
        <section className="rounded-2xl border border-border bg-card/60 p-5">
          <h2 className="text-sm font-semibold text-foreground">Mensaje de Radio Shalko</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
            {order.customerMessage}
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card/60 p-5">
        <h2 className="text-sm font-semibold text-foreground">Estado de recolección</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {customerPickupHint(fs)}
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card/60">
        <div className="border-b border-border/60 px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Productos{" "}
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

      <section className="rounded-2xl border border-border bg-card/60 p-5">
        <h2 className="text-sm font-semibold text-foreground">Resumen</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal estimado</dt>
            <dd className="font-medium text-foreground">{formatPrice(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between border-t border-border/60 pt-2">
            <dt className="font-medium text-foreground">
              {hasConfirmedPrice ? "Precio final confirmado con el cliente" : "Total estimado"}
            </dt>
            <dd className="text-lg font-semibold text-foreground">{formatPrice(displayTotal)}</dd>
          </div>
        </dl>
        {!isPaid && (
          <p className="mt-3 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            El pago se solicitará después de la confirmación de Radio Shalko.
          </p>
        )}
      </section>

      {isPending && (
        <section className="rounded-2xl border border-border bg-muted/30 p-5">
          <h2 className="text-sm font-semibold text-foreground">Pago</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            No realices pagos fuera de los canales oficiales. Nuestro equipo te confirmará
            disponibilidad, garantía y forma de pago.
          </p>
        </section>
      )}

      {isApprovedUnpaid && (
        <section className="rounded-2xl border border-border bg-muted/30 p-5">
          <h2 className="text-sm font-semibold text-foreground">Pago pendiente</h2>
          {showTransferInstructionsMessage ? (
            <p className="mt-2 text-sm leading-relaxed text-foreground/85">
              Radio Shalko ya confirmó tu forma de pago. Por favor realiza tu transferencia y
              comparte tu comprobante por el canal oficial.
            </p>
          ) : isTransfer ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Tu solicitud fue aprobada. Radio Shalko te compartirá las instrucciones oficiales de
              transferencia por el canal acordado cuando estén listas.
            </p>
          ) : order.paymentMethodConfirmed ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Radio Shalko confirmó tu forma de pago presencial en{" "}
              {branchDisplayName(order.branchSlug, order.branchLabel)}. Acude a la tienda indicada
              cuando te indiquemos continuar.
            </p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Tu solicitud fue aprobada. Radio Shalko te compartirá las instrucciones de pago por
              transferencia o pago presencial en tienda.
            </p>
          )}
        </section>
      )}

      {isPaid && fs === "unfulfilled" && (
        <section className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
          <h2 className="text-sm font-semibold text-emerald-800">Pago confirmado</h2>
          <p className="mt-2 text-sm leading-relaxed text-emerald-900/80">
            Pago confirmado. Prepararemos tu producto para entrega o recolección según
            corresponda.
          </p>
          {order.stripePaidAt && (
            <p className="mt-2 text-xs text-emerald-800/70">
              Confirmado el {formatDateTime(order.stripePaidAt)}
            </p>
          )}
        </section>
      )}

      {isPaid && fs === "preparing" && (
        <section className="rounded-2xl border border-border bg-card/60 p-5">
          <h2 className="text-sm font-semibold text-foreground">Preparando pedido</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Estamos preparando tu pedido. Te avisaremos cuando esté listo para recoger.
          </p>
        </section>
      )}

      {isPaid && fs === "ready_for_pickup" && (
        <section className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
          <h2 className="text-sm font-semibold text-emerald-800">Listo para recoger</h2>
          {order.pickupReadyMessage && (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-emerald-900/85">
              {order.pickupReadyMessage}
            </p>
          )}
          {order.pickupReadyEstimate && (
            <p className="mt-2 text-sm font-medium text-emerald-900/90">
              {order.pickupReadyEstimate}
            </p>
          )}
        </section>
      )}

      {isPaid && fs === "delivered" && (
        <section className="rounded-2xl border border-border bg-muted/30 p-5">
          <h2 className="text-sm font-semibold text-foreground">Pedido entregado</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Este pedido fue marcado como entregado. Gracias por comprar en Radio Shalko.
          </p>
          {order.deliveredAt && (
            <p className="mt-2 text-xs text-muted-foreground">
              Entregado el {formatDateTime(order.deliveredAt)}
            </p>
          )}
        </section>
      )}

      {order.notes && (
        <section className="rounded-2xl border border-border bg-card/60 p-5">
          <h2 className="text-sm font-semibold text-foreground">Notas de tu solicitud</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
            {order.notes}
          </p>
        </section>
      )}

      {!isAdminViewer && (
        <div className="space-y-4">
          <PurchaseTrustLinkRow
            className="justify-start"
            linkKeys={["metodosPago", "compraSegura", "comoComprar"]}
          />
          <div className="flex flex-wrap gap-2">
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
        </div>
      )}
    </div>
  );
}
