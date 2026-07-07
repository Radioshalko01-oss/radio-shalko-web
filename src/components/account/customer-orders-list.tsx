import Link from "next/link";
import { ChevronRight, Package, Tag } from "lucide-react";
import { formatPrice } from "@/lib/catalog/format";
import {
  customerOrderStatusBadgeClass,
  customerOrderStatusUi,
} from "@/lib/orders/customer-status-labels";
import { SiteEmptyState } from "@/components/site/site-empty-state";
import { PurchaseTrustLinkRow, PurchaseTrustNote } from "@/components/trust/purchase-trust-note";
import { siteShell } from "@/lib/design/site-shell";
import { cn } from "@/lib/utils";
import type { CustomerOrderListItem } from "@/lib/orders/customer-queries";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function CustomerOrdersList({ orders }: { orders: CustomerOrderListItem[] }) {
  if (orders.length === 0) {
    return (
      <SiteEmptyState
        icon={<Package className="h-6 w-6" />}
        title="Aún no tienes pedidos"
        description="Cuando envíes una solicitud de compra, aparecerá aquí con su estado y seguimiento."
        action={{ label: "Explorar productos", href: "/productos" }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <PurchaseTrustNote
        compact
        title="¿Tienes dudas sobre tu pago?"
        lines={[
          "Cada solicitud pasa por revisión antes de confirmarse.",
          "Solo realiza pagos cuando recibas instrucciones por canales oficiales.",
        ]}
        linkKeys={["metodosPago", "compraSegura", "comoComprar"]}
      />

      <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3.5">
        <p className="text-xs font-medium text-foreground">Estados de tu solicitud</p>
        <dl className="mt-2.5 space-y-2 text-[11px] leading-snug text-muted-foreground">
          <div>
            <dt className="font-medium text-foreground/85">Solicitud recibida</dt>
            <dd>Estamos revisando disponibilidad y datos de tu pedido.</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground/85">Aprobado · esperando pago</dt>
            <dd>Tu solicitud fue confirmada; te enviaremos instrucciones de pago.</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground/85">Pago confirmado</dt>
            <dd>Recibimos tu pago y preparamos tu pedido para recolección.</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground/85">No disponible</dt>
            <dd>Por el momento no fue posible continuar con esta solicitud.</dd>
          </div>
        </dl>
      </div>

    <ul className="grid gap-4">
      {orders.map((order) => {
        const status = customerOrderStatusUi(order.status, order.paymentStatus, {
          hasPaymentUrl: order.hasPaymentUrl,
          fulfillmentStatus: order.fulfillmentStatus,
          pickupReadyMessage: null,
          pickupReadyEstimate: null,
        });
        return (
          <li key={order.id}>
            <article className={cn(siteShell.cardMuted, "p-4 transition-colors hover:border-foreground/15 md:p-5")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-semibold tracking-tight text-foreground">
                    {order.orderNumber}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </p>
                  <p className="mt-2 text-sm text-foreground/85">
                    <span className="font-medium">{order.branchLabel}</span>
                    <span className="text-muted-foreground/50"> · </span>
                    {order.itemCount} producto{order.itemCount === 1 ? "" : "s"}
                    <span className="text-muted-foreground/50"> · </span>
                    <span className="font-semibold text-foreground">
                      {formatPrice(order.total)}
                    </span>
                  </p>
                </div>
                <span className={customerOrderStatusBadgeClass(status.tone)}>
                  {status.label}
                </span>
              </div>
              <div className="mt-4 flex justify-end border-t border-border/60 pt-3">
                <Link
                  href={`/cuenta/pedidos/${order.id}`}
                  className="inline-flex h-9 items-center gap-1 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  Ver detalle
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          </li>
        );
      })}
    </ul>

      <PurchaseTrustLinkRow className="pt-1" linkKeys={["compraSegura", "metodosPago"]} />
    </div>
  );
}

export function CustomerOrderLineRow({
  item,
}: {
  item: {
    productTitle: string;
    brandName: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    imageUrl: string | null;
  };
}) {
  return (
    <li className="flex gap-3 py-3">
      <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-muted/40">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.productTitle} className="h-full w-full object-cover" />
        ) : (
          <Tag className="h-4 w-4 text-muted-foreground/40" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{item.productTitle}</p>
        {item.brandName && (
          <p className="text-xs text-muted-foreground">{item.brandName}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {item.quantity} × {formatPrice(item.unitPrice)} ={" "}
          <span className="font-medium text-foreground">{formatPrice(item.subtotal)}</span>
        </p>
      </div>
    </li>
  );
}
