"use client";

import { useState } from "react";
import { Copy, MessageCircle } from "lucide-react";
import {
  customerBankTransferDetailsText,
  customerBankTransferLines,
  customerTransferReceiptWhatsAppMessage,
} from "@/lib/orders/operational-metadata";
import { whatsappHref } from "@/lib/site-contact";
import { cn } from "@/lib/utils";

export function CustomerTransferCard({
  orderNumber,
  className,
}: {
  orderNumber: string;
  className?: string;
}) {
  const [copiedField, setCopiedField] = useState<"clabe" | "all" | null>(null);
  const lines = customerBankTransferLines();
  const clabe = lines.find((row) => row.label === "CLABE")?.value ?? "";
  const fullText = customerBankTransferDetailsText(orderNumber);
  const waLink = whatsappHref(undefined, customerTransferReceiptWhatsAppMessage(orderNumber));

  const copyText = async (text: string, field: "clabe" | "all") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={cn("rounded-2xl border border-border bg-card/60 p-5", className)}>
      <h2 className="text-sm font-semibold text-foreground">Datos para transferencia bancaria</h2>
      <ul className="mt-3 space-y-1.5 text-sm text-foreground/90">
        {lines.map((row) => (
          <li key={row.label}>
            <span className="text-muted-foreground">{row.label}:</span>{" "}
            <span className="font-medium text-foreground">{row.value}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Envía tu comprobante por WhatsApp indicando tu número de solicitud. La compra se confirma
        hasta validar el pago.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copyText(clabe, "clabe")}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3.5 text-sm font-medium text-foreground transition-colors hover:border-foreground/20"
        >
          <Copy className="h-4 w-4" />
          {copiedField === "clabe" ? "CLABE copiada" : "Copiar CLABE"}
        </button>
        <button
          type="button"
          onClick={() => copyText(fullText, "all")}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3.5 text-sm font-medium text-foreground transition-colors hover:border-foreground/20"
        >
          <Copy className="h-4 w-4" />
          {copiedField === "all" ? "Datos copiados" : "Copiar datos completos"}
        </button>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          <MessageCircle className="h-4 w-4" />
          Enviar comprobante por WhatsApp
        </a>
      </div>
    </div>
  );
}
