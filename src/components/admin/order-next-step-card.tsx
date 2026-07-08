"use client";

import { useState, useTransition } from "react";
import { Copy, Loader2, MessageCircle } from "lucide-react";
import { confirmOrderPaymentMethod } from "@/lib/orders/admin-actions";
import type { AdminOrderDetail } from "@/lib/orders/admin-queries";
import {
  bankTransferDetailsText,
  bankTransferWhatsAppMessage,
} from "@/lib/orders/operational-metadata";
import { resolveOrderNextStep } from "@/lib/orders/order-next-step";
import { AdminButton } from "@/components/admin/admin-button";
import { adminShell } from "@/lib/design/admin-shell";
import { formatPrice } from "@/lib/catalog/format";
import { whatsappHref } from "@/lib/site-contact";
import { useRouter } from "next/navigation";

function scrollToAnchor(anchor: string) {
  document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function OrderNextStepCard({ order }: { order: AdminOrderDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const step = resolveOrderNextStep(order);

  const isTransfer = order.paymentMethod === "bank_transfer";
  const amount = order.confirmedFinalPrice ?? order.total;
  const bankText = bankTransferDetailsText(order.orderNumber, amount);
  const waMessage = bankTransferWhatsAppMessage(order.orderNumber, amount, order.customerName);

  const markInstructionsSent = () => {
    startTransition(async () => {
      const result = await confirmOrderPaymentMethod({
        orderId: order.id,
        instructionsSent: true,
      });
      if (result.ok) router.refresh();
    });
  };

  const copyBankDetails = async () => {
    try {
      await navigator.clipboard.writeText(bankText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const showTransferQuickActions = step.kind === "send_transfer_instructions";

  return (
    <section className={`${adminShell.cardSection} border-copper/20 bg-copper/5`}>
      <p className={adminShell.fieldLabel}>Siguiente paso</p>
      <h3 className="mt-1 text-lg font-semibold text-foreground">{step.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>

      {showTransferQuickActions && (
        <div className="mt-4 flex flex-wrap gap-2">
          <AdminButton type="button" variant="secondary" onClick={copyBankDetails} disabled={isPending}>
            <Copy className="h-4 w-4" />
            {copied ? "Copiado" : "Copiar datos"}
          </AdminButton>
          <AdminButton asChild variant="secondary">
            <a href={whatsappHref(undefined, waMessage)} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              Enviar por WhatsApp
            </a>
          </AdminButton>
          <AdminButton type="button" onClick={markInstructionsSent} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Marcar como enviado
          </AdminButton>
        </div>
      )}

      {!showTransferQuickActions && step.kind !== "completed" && step.kind !== "cancelled" && (
        <AdminButton
          type="button"
          className="mt-4"
          size="lg"
          onClick={() => scrollToAnchor(step.anchor)}
        >
          Ir a este paso
        </AdminButton>
      )}

      {step.kind === "send_transfer_instructions" && (
        <p className="mt-3 text-xs text-muted-foreground">
          Monto a transferir: {formatPrice(amount)}
        </p>
      )}
    </section>
  );
}
