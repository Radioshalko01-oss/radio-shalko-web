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
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-zinc-900">Preparación y entrega</h3>

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
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Estado</p>
          <p className="mt-1 font-medium text-zinc-900">{fulfillmentStatusLabel(fs)}</p>
        </div>

        {fs === "unfulfilled" && (
          <>
            <p className="leading-relaxed text-zinc-600">
              Este pedido ya fue pagado. Marca el inicio de preparación cuando el equipo comience
              a prepararlo.
            </p>
            <button
              type="button"
              disabled={isPending}
              onClick={() => runAction(() => markOrderPreparing(order.id))}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Marcar como preparando
            </button>
          </>
        )}

        {(fs === "preparing" || fs === "unfulfilled") && fs === "preparing" && (
          <>
            <p className="leading-relaxed text-zinc-600">
              El pedido está en preparación. Cuando esté listo, agrega un mensaje para el cliente.
            </p>
            {order.preparedAt && (
              <p className="text-xs text-zinc-500">
                Preparación iniciada: {formatDateTime(order.preparedAt)}
              </p>
            )}
            <div className="space-y-3">
              <div>
                <label htmlFor="pickup-estimate" className="text-xs font-medium text-zinc-700">
                  Hora o indicación estimada de recolección
                </label>
                <input
                  id="pickup-estimate"
                  type="text"
                  value={estimate}
                  onChange={(e) => setEstimate(e.target.value)}
                  placeholder="Ej. Hoy a partir de las 5:00 p.m."
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="pickup-message" className="text-xs font-medium text-zinc-700">
                  Mensaje para el cliente
                </label>
                <textarea
                  id="pickup-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
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
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Marcar como listo para recoger
            </button>
          </>
        )}

        {fs === "ready_for_pickup" && (
          <>
            {order.pickupReadyMessage && (
              <div className="rounded-lg bg-zinc-50 px-3 py-2">
                <p className="text-xs font-medium text-zinc-500">Mensaje para el cliente</p>
                <p className="mt-1 whitespace-pre-wrap text-zinc-800">
                  {order.pickupReadyMessage}
                </p>
              </div>
            )}
            {order.pickupReadyEstimate && (
              <p className="text-zinc-700">
                <span className="font-medium">Indicación:</span> {order.pickupReadyEstimate}
              </p>
            )}
            {order.readyForPickupAt && (
              <p className="text-xs text-zinc-500">
                Listo desde: {formatDateTime(order.readyForPickupAt)}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  <MessageCircle className="h-4 w-4" />
                  Enviar aviso por WhatsApp
                </a>
              )}
              <button
                type="button"
                disabled={isPending}
                onClick={() => runAction(() => markOrderDelivered(order.id))}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Marcar como entregado
              </button>
            </div>
          </>
        )}

        {fs === "delivered" && (
          <>
            <p className="text-zinc-600">Este pedido fue entregado al cliente.</p>
            {order.deliveredAt && (
              <p className="text-xs text-zinc-500">
                Entregado el {formatDateTime(order.deliveredAt)}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
