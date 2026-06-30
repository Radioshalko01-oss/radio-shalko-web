"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, MessageCircle } from "lucide-react";
import {
  markOrderDelivered,
  markOrderPreparing,
  markOrderReadyForPickup,
} from "@/lib/orders/admin-actions";
import { whatsappHref } from "@/lib/site-contact";
import {
  branchDisplayName,
  buildOrderPickupWhatsAppMessage,
  defaultPickupReadyMessage,
  fulfillmentStatusLabel,
} from "@/lib/orders/status-labels";
import type { AdminOrderDetail } from "@/lib/orders/admin-queries";
import { AdminButton } from "@/components/admin/admin-button";
import { adminShell } from "@/lib/design/admin-shell";
import { typography } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

function normalizePhoneE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("52") && digits.length >= 12) return digits;
  if (digits.length === 10) return `52${digits}`;
  return digits;
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function OrderFulfillmentSection({ order }: { order: AdminOrderDetail }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const branchLabel = branchDisplayName(order.branchSlug, order.branchLabel);
  const defaultMessage = defaultPickupReadyMessage(branchLabel);

  const [message, setMessage] = useState(order.pickupReadyMessage ?? defaultMessage);
  const [estimate, setEstimate] = useState(order.pickupReadyEstimate ?? "");

  if (order.paymentStatus !== "paid") return null;

  const fs = order.fulfillmentStatus;
  const phoneE164 = order.customerPhone ? normalizePhoneE164(order.customerPhone) : null;

  const runAction = (action: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "No se pudo completar la acción.");
        return;
      }
      setSuccess("Cambios guardados correctamente.");
    });
  };

  const waLink =
    fs === "ready_for_pickup" && order.pickupReadyMessage && phoneE164
      ? whatsappHref(
          phoneE164,
          buildOrderPickupWhatsAppMessage(order.orderNumber, order.pickupReadyMessage),
        )
      : null;

  return (
    <section className={adminShell.cardSection}>
      <h3 className={adminShell.sectionTitleSm}>Preparación y entrega</h3>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {success}
        </p>
      )}

      <div className="mt-3 space-y-4 text-sm">
        <div>
          <p className={typography.labelCaps}>Estado</p>
          <p className="mt-1 font-medium text-foreground">{fulfillmentStatusLabel(fs)}</p>
        </div>

        {fs === "unfulfilled" && (
          <>
            <p className="leading-relaxed text-muted-foreground">
              Este pedido ya fue pagado. Marca el inicio de preparación cuando el equipo comience
              a prepararlo.
            </p>
            <AdminButton
              type="button"
              disabled={isPending}
              onClick={() => runAction(() => markOrderPreparing(order.id))}
              size="lg"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Marcar como preparando
            </AdminButton>
          </>
        )}

        {(fs === "preparing" || fs === "unfulfilled") && fs === "preparing" && (
          <>
            <p className="leading-relaxed text-muted-foreground">
              El pedido está en preparación. Cuando esté listo, agrega un mensaje para el cliente.
            </p>
            {order.preparedAt && (
              <p className="text-xs text-muted-foreground">
                Preparación iniciada: {formatDateTime(order.preparedAt)}
              </p>
            )}
            <div className="space-y-3">
              <div>
                <label htmlFor="pickup-estimate" className="text-xs font-medium text-foreground/80">
                  Hora o indicación estimada de recolección
                </label>
                <input
                  id="pickup-estimate"
                  type="text"
                  value={estimate}
                  onChange={(e) => setEstimate(e.target.value)}
                  placeholder="Ej. Hoy a partir de las 5:00 p.m."
                  className={cn(adminShell.input, "mt-1")}
                />
              </div>
              <div>
                <label htmlFor="pickup-message" className="text-xs font-medium text-foreground/80">
                  Mensaje para el cliente
                </label>
                <textarea
                  id="pickup-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={cn(adminShell.input, "mt-1 h-auto resize-y py-2")}
                />
              </div>
            </div>
            <AdminButton
              type="button"
              disabled={isPending || !message.trim()}
              onClick={() =>
                runAction(() =>
                  markOrderReadyForPickup({
                    orderId: order.id,
                    message,
                    estimate: estimate.trim() || undefined,
                  }),
                )
              }
              size="lg"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Marcar como listo para recoger
            </AdminButton>
          </>
        )}

        {fs === "ready_for_pickup" && (
          <>
            {order.pickupReadyMessage && (
              <div className={adminShell.mutedBox}>
                <p className={adminShell.fieldLabel}>Mensaje para el cliente</p>
                <p className="mt-1 whitespace-pre-wrap text-foreground/90">
                  {order.pickupReadyMessage}
                </p>
              </div>
            )}
            {order.pickupReadyEstimate && (
              <p className="text-foreground/85">
                <span className="font-medium">Indicación:</span> {order.pickupReadyEstimate}
              </p>
            )}
            {order.readyForPickupAt && (
              <p className="text-xs text-muted-foreground">
                Listo desde: {formatDateTime(order.readyForPickupAt)}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {waLink && (
                <AdminButton asChild variant="primary">
                  <a href={waLink} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    Enviar aviso por WhatsApp
                  </a>
                </AdminButton>
              )}
              <AdminButton
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={() => runAction(() => markOrderDelivered(order.id))}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Marcar como entregado
              </AdminButton>
            </div>
          </>
        )}

        {fs === "delivered" && (
          <>
            <p className="text-muted-foreground">Este pedido fue entregado al cliente.</p>
            {order.deliveredAt && (
              <p className="text-xs text-muted-foreground">
                Entregado el {formatDateTime(order.deliveredAt)}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
