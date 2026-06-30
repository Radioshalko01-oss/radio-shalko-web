"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { whatsappHref } from "@/lib/site-contact";
import { buildOrderWhatsAppMessage } from "@/lib/orders/status-labels";
import { AdminButton } from "@/components/admin/admin-button";

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
        <AdminButton
          type="button"
          variant="secondary"
          onClick={() => copy(phone, "phone")}
        >
          {copiedField === "phone" ? (
            <Check className="h-4 w-4 text-emerald-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copiedField === "phone" ? "Copiado" : "Copiar teléfono"}
        </AdminButton>
      )}
      <AdminButton type="button" variant="secondary" onClick={() => copy(orderNumber, "order")}>
        {copiedField === "order" ? (
          <Check className="h-4 w-4 text-emerald-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        {copiedField === "order" ? "Copiado" : "Copiar número de pedido"}
      </AdminButton>
      {showPendingWhatsApp && waLink && (
        <AdminButton asChild variant="primary">
          <a href={waLink} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" />
            Abrir WhatsApp
          </a>
        </AdminButton>
      )}
    </div>
  );
}
