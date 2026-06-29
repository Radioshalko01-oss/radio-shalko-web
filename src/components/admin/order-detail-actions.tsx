"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { whatsappHref } from "@/lib/site-contact";
import { buildOrderWhatsAppMessage } from "@/lib/orders/status-labels";

function normalizePhoneE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("52") && digits.length >= 12) return digits;
  if (digits.length === 10) return `52${digits}`;
  return digits;
}

export function OrderDetailActions({
  orderNumber,
  phone,
  showPendingWhatsApp = true,
}: {
  orderNumber: string;
  phone: string;
  showPendingWhatsApp?: boolean;
}) {
  const [copiedField, setCopiedField] = useState<"phone" | "order" | null>(null);

  const copy = async (text: string, field: "phone" | "order") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField((c) => (c === field ? null : c)), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const phoneE164 = phone ? normalizePhoneE164(phone) : null;
  const message = buildOrderWhatsAppMessage(orderNumber);
  const waLink = phoneE164 ? whatsappHref(phoneE164, message) : null;

  return (
    <div className="flex flex-wrap gap-2">
      {phone && (
        <button
          type="button"
          onClick={() => copy(phone, "phone")}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          {copiedField === "phone" ? (
            <Check className="h-4 w-4 text-emerald-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copiedField === "phone" ? "Copiado" : "Copiar teléfono"}
        </button>
      )}
      <button
        type="button"
        onClick={() => copy(orderNumber, "order")}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        {copiedField === "order" ? (
          <Check className="h-4 w-4 text-emerald-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        {copiedField === "order" ? "Copiado" : "Copiar número de pedido"}
      </button>
      {showPendingWhatsApp && waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <MessageCircle className="h-4 w-4" />
          Abrir WhatsApp
        </a>
      )}
    </div>
  );
}
