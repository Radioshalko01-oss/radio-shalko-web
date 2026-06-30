"use client";

import { useState, useTransition } from "react";
import { Check, Copy, ExternalLink, Loader2, MessageCircle } from "lucide-react";
import { createStripeCheckoutForOrder } from "@/lib/orders/admin-actions";
import { whatsappHref } from "@/lib/site-contact";
import {
  buildOrderPaymentWhatsAppMessage,
  paymentStatusUi,
} from "@/lib/orders/status-labels";
import type { AdminOrderDetail } from "@/lib/orders/admin-queries";
import { AdminButton } from "@/components/admin/admin-button";
import { adminShell } from "@/lib/design/admin-shell";

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

export function OrderPaymentSection({ order }: { order: AdminOrderDetail }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState(order.stripePaymentUrl);
  const [copied, setCopied] = useState(false);

  const isPaid = order.paymentStatus === "paid";
  const isApproved =
    order.status === "confirmed" && order.paymentStatus === "unpaid";
  const showSection = isPaid || isApproved;

  if (!showSection) return null;

  const hasUrl = Boolean(paymentUrl);
  const phoneE164 = order.customerPhone ? normalizePhoneE164(order.customerPhone) : null;

  const generateLink = () => {
    setError(null);
    startTransition(async () => {
      const result = await createStripeCheckoutForOrder(order.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPaymentUrl(result.url);
    });
  };

  const copyUrl = async () => {
    if (!paymentUrl) return;
    try {
      await navigator.clipboard.writeText(paymentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const waMessage =
    paymentUrl && hasUrl
      ? buildOrderPaymentWhatsAppMessage(order.orderNumber, paymentUrl)
      : null;
  const waLink = waMessage && phoneE164 ? whatsappHref(phoneE164, waMessage) : null;

  return (
    <section className={adminShell.cardSection}>
      <h3 className={adminShell.sectionTitleSm}>Pago</h3>

      {isPaid ? (
        <div className="mt-3 space-y-2 text-sm">
          <p className="font-medium text-emerald-700">Pagado</p>
          {order.stripePaidAt && (
            <p className="text-muted-foreground">
              Fecha de pago: {formatDateTime(order.stripePaidAt)}
            </p>
          )}
        </div>
      ) : hasUrl ? (
        <div className="mt-3 space-y-4">
          <p className="text-sm text-muted-foreground">
            {paymentStatusUi(order.paymentStatus, order.status, { hasPaymentUrl: true })}
          </p>
          <div className={adminShell.mutedBox}>
            <p className={adminShell.fieldLabel}>Enlace de pago</p>
            <p className="mt-1 break-all font-mono text-xs text-foreground/90">{paymentUrl}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminButton type="button" variant="secondary" onClick={copyUrl}>
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copiado" : "Copiar enlace"}
            </AdminButton>
            <AdminButton asChild variant="secondary">
              <a href={paymentUrl!} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Abrir enlace
              </a>
            </AdminButton>
            {waLink && (
              <AdminButton asChild variant="primary">
                <a href={waLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  Enviar por WhatsApp
                </a>
              </AdminButton>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Este pedido fue aprobado. Genera un enlace seguro para que el cliente complete el
            pago.
          </p>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <AdminButton type="button" onClick={generateLink} disabled={isPending} size="lg">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Generar enlace de pago
          </AdminButton>
        </div>
      )}
    </section>
  );
}
