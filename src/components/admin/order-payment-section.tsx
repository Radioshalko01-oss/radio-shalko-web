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
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-zinc-900">Pago</h3>

      {isPaid ? (
        <div className="mt-3 space-y-2 text-sm">
          <p className="font-medium text-emerald-700">Pagado</p>
          {order.stripePaidAt && (
            <p className="text-zinc-600">
              Fecha de pago: {formatDateTime(order.stripePaidAt)}
            </p>
          )}
        </div>
      ) : hasUrl ? (
        <div className="mt-3 space-y-4">
          <p className="text-sm text-zinc-600">
            {paymentStatusUi(order.paymentStatus, order.status, { hasPaymentUrl: true })}
          </p>
          <div className="rounded-lg bg-zinc-50 px-3 py-2">
            <p className="text-xs font-medium text-zinc-500">Enlace de pago</p>
            <p className="mt-1 break-all font-mono text-xs text-zinc-800">{paymentUrl}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyUrl}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copiado" : "Copiar enlace"}
            </button>
            <a
              href={paymentUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir enlace
            </a>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800"
              >
                <MessageCircle className="h-4 w-4" />
                Enviar por WhatsApp
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-4">
          <p className="text-sm leading-relaxed text-zinc-600">
            Este pedido fue aprobado. Genera un enlace seguro para que el cliente complete el
            pago.
          </p>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <button
            type="button"
            onClick={generateLink}
            disabled={isPending}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Generar enlace de pago
          </button>
        </div>
      )}
    </section>
  );
}
