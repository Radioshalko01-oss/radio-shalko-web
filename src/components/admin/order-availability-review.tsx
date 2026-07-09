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
import { AdminButton } from "@/components/admin/admin-button";
import { adminShell } from "@/lib/design/admin-shell";
import { typography } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

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
    <section className={adminShell.cardSection}>
      <h3 className={adminShell.sectionTitleSm}>Revisión de disponibilidad</h3>
      <p className={adminShell.sectionDesc}>
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
                className={cn(
                  "flex cursor-pointer gap-3 rounded-lg border px-4 py-3 transition-colors",
                  decision === opt
                    ? "border-copper bg-copper/5 ring-1 ring-copper/40"
                    : "border-border hover:border-copper/25",
                )}
              >
                <input
                  type="radio"
                  name="availability"
                  value={opt}
                  checked={decision === opt}
                  onChange={() => setDecision(opt)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-copper"
                />
                <span>
                  <span className="block text-sm font-medium text-foreground">
                    {AVAILABILITY_DECISION_LABELS[opt]}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
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
                className="block text-xs font-medium text-muted-foreground"
              >
                Fecha para continuar con el pedido
              </label>
              <input
                id="pickup-date"
                type="date"
                value={customDate}
                min={mexicoTodayYmd()}
                onChange={(e) => setCustomDate(e.target.value)}
                className={cn(adminShell.input, "mt-1.5")}
              />
            </div>
          )}

          <div>
            <label
              htmlFor="customer-message"
              className="block text-xs font-medium text-muted-foreground"
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
              className={cn(adminShell.input, "mt-1.5 h-auto resize-y py-2")}
            />
          </div>

          <div className={cn("flex flex-wrap gap-2 border-t pt-4", adminShell.dividerSoft)}>
            {decision !== "unavailable" && (
              <AdminButton
                type="button"
                disabled={pending || !customerMessage.trim()}
                onClick={() => submit(decision)}
                size="lg"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar disponibilidad
              </AdminButton>
            )}
            {decision === "unavailable" && (
              <AdminButton
                type="button"
                variant="danger"
                disabled={pending || !customerMessage.trim()}
                onClick={() => submit("unavailable")}
                size="lg"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Marcar no disponible
              </AdminButton>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className={adminShell.mutedBox}>
              <dt className={adminShell.fieldLabel}>Decisión</dt>
              <dd className="mt-0.5 text-sm font-medium text-foreground">
                {availabilityDecisionLabel(order.availabilityDecision)}
              </dd>
            </div>
            {order.pickupAvailableDate && (
              <div className={adminShell.mutedBox}>
                <dt className={adminShell.fieldLabel}>Fecha estimada</dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">
                  {formatPickupDateLong(order.pickupAvailableDate)}
                </dd>
              </div>
            )}
            {order.reviewedAt && (
              <div className={cn(adminShell.mutedBox, "sm:col-span-2")}>
                <dt className={adminShell.fieldLabel}>Revisado</dt>
                <dd className="mt-0.5 text-sm text-foreground/90">
                  {formatReviewDateTime(order.reviewedAt)}
                </dd>
              </div>
            )}
          </dl>

          {order.customerMessage && (
            <div className={cn(adminShell.card, "px-4 py-3")}>
              <p className={typography.labelCaps}>Mensaje para el cliente</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                {order.customerMessage}
              </p>
            </div>
          )}

          {order.legacyAdminNote && (
            <div className={adminShell.mutedBox}>
              <p className={typography.labelCaps}>Nota interna</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/85">
                {order.legacyAdminNote}
              </p>
            </div>
          )}

          {pickupAvailabilityHint(order.availabilityDecision, order.pickupAvailableDate) && (
            <p className="text-sm font-medium text-foreground/85">
              {pickupAvailabilityHint(order.availabilityDecision, order.pickupAvailableDate)}
            </p>
          )}

          {waLink && (
            <AdminButton asChild size="lg">
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                Enviar mensaje por WhatsApp
              </a>
            </AdminButton>
          )}
        </div>
      )}
    </section>
  );
}
