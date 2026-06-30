"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, MessageCircle } from "lucide-react";
import { submitOrderAvailabilityReview } from "@/lib/orders/admin-actions";
import {
  AVAILABILITY_DECISION_HINTS,
  AVAILABILITY_DECISION_LABELS,
  type AvailabilityDecision,
} from "@/lib/orders/types";
import {
  availabilityDecisionLabel,
  buildOrderDecisionWhatsAppMessage,
  defaultCustomerMessage,
  isOrderPendingReview,
  pickupAvailabilityHint,
} from "@/lib/orders/status-labels";
import { formatPickupDateLong, mexicoTodayYmd } from "@/lib/orders/dates";
import { whatsappHref } from "@/lib/site-contact";
import type { AdminOrderDetail } from "@/lib/orders/admin-queries";

const APPROVAL_DECISIONS: AvailabilityDecision[] = [
  "available_today",
  "available_tomorrow",
  "available_custom",
];

function normalizePhoneE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("52") && digits.length >= 12) return digits;
  if (digits.length === 10) return `52${digits}`;
  return digits;
}

function formatReviewDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function OrderAvailabilityReview({ order }: { order: AdminOrderDetail }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const pendingReview = isOrderPendingReview(order.status, order.paymentStatus);

  const [decision, setDecision] = useState<AvailabilityDecision>("available_today");
  const [customDate, setCustomDate] = useState(mexicoTodayYmd());
  const [customerMessage, setCustomerMessage] = useState(() =>
    defaultCustomerMessage("available_today"),
  );
  const messageEdited = useRef(false);

  useEffect(() => {
    if (!pendingReview || messageEdited.current) return;
    const msg = defaultCustomerMessage(
      decision,
      decision === "available_custom" ? customDate : null,
    );
    setCustomerMessage(msg);
  }, [decision, customDate, pendingReview]);

  const submit = (submitDecision: AvailabilityDecision) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await submitOrderAvailabilityReview({
        orderId: order.id,
        decision: submitDecision,
        pickupAvailableDate:
          submitDecision === "available_custom" ? customDate : undefined,
        customerMessage: customerMessage.trim(),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(
        submitDecision === "unavailable"
          ? "Solicitud marcada como no disponible."
          : "Disponibilidad confirmada. El pedido quedó aprobado y esperando pago.",
      );
      router.refresh();
    });
  };

  const phoneE164 = order.customerPhone ? normalizePhoneE164(order.customerPhone) : null;
  const waMessage =
    order.customerMessage &&
    buildOrderDecisionWhatsAppMessage(order.orderNumber, order.customerMessage);
  const waLink = phoneE164 && waMessage ? whatsappHref(phoneE164, waMessage) : null;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-zinc-900">Revisión de disponibilidad</h3>
      <p className="mt-1 text-sm text-zinc-500">
        Confirma cuándo podrá recogerse esta solicitud antes de enviar instrucciones de pago.
      </p>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <Check className="h-4 w-4" />
          {success}
        </p>
      )}

      {pendingReview ? (
        <div className="mt-4 space-y-5">
          <fieldset className="space-y-2">
            <legend className="sr-only">Opciones de disponibilidad</legend>
            {(
              [
                ...APPROVAL_DECISIONS,
                "unavailable",
              ] as AvailabilityDecision[]
            ).map((opt) => (
              <label
                key={opt}
                className={`flex cursor-pointer gap-3 rounded-lg border px-4 py-3 transition-colors ${
                  decision === opt
                    ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <input
                  type="radio"
                  name="availability"
                  value={opt}
                  checked={decision === opt}
                  onChange={() => setDecision(opt)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-zinc-900"
                />
                <span>
                  <span className="block text-sm font-medium text-zinc-900">
                    {AVAILABILITY_DECISION_LABELS[opt]}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    {AVAILABILITY_DECISION_HINTS[opt]}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          {decision === "available_custom" && (
            <div>
              <label
                htmlFor="pickup-date"
                className="block text-xs font-medium text-zinc-600"
              >
                Fecha para continuar con el pedido
              </label>
              <input
                id="pickup-date"
                type="date"
                value={customDate}
                min={mexicoTodayYmd()}
                onChange={(e) => setCustomDate(e.target.value)}
                className="mt-1.5 h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="customer-message"
              className="block text-xs font-medium text-zinc-600"
            >
              Mensaje para el cliente
            </label>
            <textarea
              id="customer-message"
              rows={4}
              value={customerMessage}
              onChange={(e) => {
                messageEdited.current = true;
                setCustomerMessage(e.target.value);
              }}
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
            />
          </div>

          <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
            {decision !== "unavailable" && (
              <button
                type="button"
                disabled={pending || !customerMessage.trim()}
                onClick={() => submit(decision)}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar disponibilidad
              </button>
            )}
            {decision === "unavailable" && (
              <button
                type="button"
                disabled={pending || !customerMessage.trim()}
                onClick={() => submit("unavailable")}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-40"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Marcar no disponible
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2">
              <dt className="text-xs text-zinc-500">Decisión</dt>
              <dd className="mt-0.5 text-sm font-medium text-zinc-900">
                {availabilityDecisionLabel(order.availabilityDecision)}
              </dd>
            </div>
            {order.pickupAvailableDate && (
              <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2">
                <dt className="text-xs text-zinc-500">Fecha estimada</dt>
                <dd className="mt-0.5 text-sm font-medium text-zinc-900">
                  {formatPickupDateLong(order.pickupAvailableDate)}
                </dd>
              </div>
            )}
            {order.reviewedAt && (
              <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2 sm:col-span-2">
                <dt className="text-xs text-zinc-500">Revisado</dt>
                <dd className="mt-0.5 text-sm text-zinc-800">
                  {formatReviewDateTime(order.reviewedAt)}
                </dd>
              </div>
            )}
          </dl>

          {order.customerMessage && (
            <div className="rounded-lg border border-zinc-100 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Mensaje para el cliente
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                {order.customerMessage}
              </p>
            </div>
          )}

          {order.adminInternalNote && (
            <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Nota interna
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
                {order.adminInternalNote}
              </p>
            </div>
          )}

          {pickupAvailabilityHint(order.availabilityDecision, order.pickupAvailableDate) && (
            <p className="text-sm font-medium text-zinc-700">
              {pickupAvailabilityHint(order.availabilityDecision, order.pickupAvailableDate)}
            </p>
          )}

          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
            >
              <MessageCircle className="h-4 w-4" />
              Enviar mensaje por WhatsApp
            </a>
          )}
        </div>
      )}
    </section>
  );
}
