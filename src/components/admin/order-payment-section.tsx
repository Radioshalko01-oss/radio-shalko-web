"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { registerManualPaymentForOrder } from "@/lib/orders/admin-actions";
import type { AdminOrderDetail } from "@/lib/orders/admin-queries";
import { AdminButton } from "@/components/admin/admin-button";
import { adminShell } from "@/lib/design/admin-shell";

type ManualPaymentOption = "bank_transfer" | "pay_in_store_chalco" | "pay_in_store_amecameca";

function parseManualPaymentOption(option: ManualPaymentOption) {
  if (option === "bank_transfer") {
    return { paymentMethod: "bank_transfer" as const, storeLocation: undefined };
  }
  if (option === "pay_in_store_chalco") {
    return { paymentMethod: "pay_in_store" as const, storeLocation: "chalco" as const };
  }
  return { paymentMethod: "pay_in_store" as const, storeLocation: "amecameca" as const };
}

export function OrderPaymentSection({ order }: { order: AdminOrderDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(order.paymentStatus === "paid");
  const [methodOption, setMethodOption] = useState<ManualPaymentOption>("bank_transfer");
  const [reference, setReference] = useState("");

  const isApproved =
    order.status === "confirmed" && order.paymentStatus === "unpaid" && !isPaid;
  const showSection = isPaid || isApproved;
  const canValidate = order.canValidatePayment;

  if (!showSection) return null;

  const validatePayment = () => {
    setError(null);
    const payload = parseManualPaymentOption(methodOption);

    startTransition(async () => {
      const result = await registerManualPaymentForOrder({
        orderId: order.id,
        paymentMethod: payload.paymentMethod,
        storeLocation: payload.storeLocation,
        paymentReference: reference.trim() || undefined,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setIsPaid(true);
      router.refresh();
    });
  };

  return (
    <section className={adminShell.cardSection}>
      <h3 className={adminShell.sectionTitleSm}>6. Validar pago</h3>

      {isPaid ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" />
          Pago validado
        </p>
      ) : (
        <div className="mt-3 space-y-4">
          <div className="space-y-2">
            <label htmlFor="manual-payment-method" className={adminShell.fieldLabel}>
              Método de pago
            </label>
            <select
              id="manual-payment-method"
              value={methodOption}
              onChange={(e) => setMethodOption(e.target.value as ManualPaymentOption)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              disabled={isPending}
            >
              <option value="bank_transfer">Transferencia bancaria</option>
              <option value="pay_in_store_chalco">Pago presencial en Chalco</option>
              <option value="pay_in_store_amecameca">Pago presencial en Amecameca</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="manual-payment-reference" className={adminShell.fieldLabel}>
              Referencia / comprobante / nota interna (opcional)
            </label>
            <textarea
              id="manual-payment-reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Folio de transferencia, número de ticket, etc."
              disabled={isPending}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          {!canValidate && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Antes de validar el pago debes confirmar precio final, garantía y forma de pago.
            </p>
          )}

          <AdminButton
            type="button"
            onClick={validatePayment}
            disabled={isPending || !canValidate}
            size="lg"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Validar pago
          </AdminButton>
        </div>
      )}
    </section>
  );
}
