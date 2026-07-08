"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Mail, MessageCircle } from "lucide-react";
import {
  confirmOrderFinalPrice,
  confirmOrderPaymentMethod,
  defineOrderWarranty,
  sendOrderPaymentInstructionsEmail,
} from "@/lib/orders/admin-actions";
import type { AdminOrderDetail } from "@/lib/orders/admin-queries";
import {
  BANK_TRANSFER_DETAILS,
  bankTransferDetailsText,
  bankTransferWhatsAppMessage,
  WARRANTY_HYGIENE_SUGGESTED_COPY,
  type WarrantyCustomUnit,
  type WarrantyOption,
} from "@/lib/orders/operational-metadata";
import { branchDisplayName, customerPaymentPreferenceLabel } from "@/lib/orders/status-labels";
import { AdminButton } from "@/components/admin/admin-button";
import { adminShell } from "@/lib/design/admin-shell";
import { formatPrice } from "@/lib/catalog/format";
import { whatsappHref } from "@/lib/site-contact";

const WARRANTY_SELECT: Array<{ value: WarrantyOption; label: string }> = [
  { value: "none", label: "No aplica garantía" },
  { value: "1_month", label: "1 mes" },
  { value: "2_months", label: "2 meses" },
  { value: "3_months", label: "3 meses" },
  { value: "6_months", label: "6 meses" },
  { value: "1_year", label: "1 año" },
  { value: "custom", label: "Personalizado" },
];

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

function StepBadge({ done, label }: { done: boolean; label: string }) {
  return (
    <p
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        done ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
      }`}
    >
      {done && <Check className="h-3.5 w-3.5" />}
      {label}
    </p>
  );
}

export function OrderFinalPriceSection({ order }: { order: AdminOrderDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState(
    String(order.confirmedFinalPrice ?? order.total ?? ""),
  );
  const [note, setNote] = useState(order.confirmedFinalPriceNote ?? "");
  const confirmed = Boolean(order.confirmedFinalPriceAt);

  if (order.status !== "confirmed" && !confirmed) return null;

  const submit = () => {
    setError(null);
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Ingresa un precio final válido.");
      return;
    }

    startTransition(async () => {
      const result = await confirmOrderFinalPrice({
        orderId: order.id,
        amount: parsed,
        note: note.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <section className={adminShell.cardSection}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={adminShell.sectionTitleSm}>3. Confirmar precio final</h3>
        <StepBadge done={confirmed} label={confirmed ? "Completado" : "Pendiente"} />
      </div>

      {confirmed ? (
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className={adminShell.fieldLabel}>Precio final confirmado con el cliente</dt>
            <dd className="font-medium text-foreground">
              {formatPrice(order.confirmedFinalPrice ?? Number(amount))}
            </dd>
          </div>
          {order.confirmedFinalPriceNote && (
            <div>
              <dt className={adminShell.fieldLabel}>Nota de ajuste</dt>
              <dd className="text-foreground/90">{order.confirmedFinalPriceNote}</dd>
              <dd className="mt-1 text-xs text-muted-foreground">
                El cliente debe aceptar el precio final antes de continuar con el pago.
              </dd>
            </div>
          )}
          {order.confirmedFinalPriceAt && (
            <div>
              <dt className={adminShell.fieldLabel}>Confirmado</dt>
              <dd className="text-muted-foreground">
                {formatDateTime(order.confirmedFinalPriceAt)}
              </dd>
            </div>
          )}
        </dl>
      ) : (
        <div className="mt-3 space-y-4">
          <p className="text-sm text-muted-foreground">
            Registra el precio acordado y aceptado por el cliente. No continúes con garantía ni
            pago hasta confirmarlo aquí.
          </p>
          <div className="space-y-2">
            <label htmlFor="final-price-amount" className={adminShell.fieldLabel}>
              Precio final confirmado con el cliente (MXN)
            </label>
            <input
              id="final-price-amount"
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="final-price-note" className={adminShell.fieldLabel}>
              Nota de ajuste (opcional)
            </label>
            <p className="text-xs text-muted-foreground">
              Si hubo ajuste respecto al estimado inicial, documenta el acuerdo. El cliente debe
              aceptar el precio final antes de continuar con el pago.
            </p>
            <textarea
              id="final-price-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Ej. descuento acordado por pago en efectivo, cambio de modelo confirmado con el cliente, etc."
              disabled={isPending}
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <AdminButton type="button" onClick={submit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar precio final con el cliente
          </AdminButton>
        </div>
      )}
    </section>
  );
}

export function OrderWarrantySection({ order }: { order: AdminOrderDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const defined = Boolean(order.warrantyLabel);
  const [type, setType] = useState<WarrantyOption>(
    order.operational.warranty?.type ?? "1_month",
  );
  const [noneReason, setNoneReason] = useState(order.operational.warranty?.noneReason ?? "");
  const [customValue, setCustomValue] = useState(
    String(order.operational.warranty?.customValue ?? ""),
  );
  const [customUnit, setCustomUnit] = useState<WarrantyCustomUnit>(
    order.operational.warranty?.customUnit ?? "months",
  );
  const [note, setNote] = useState(order.operational.warranty?.note ?? "");

  if (order.status !== "confirmed") return null;
  if (!order.confirmedFinalPriceAt && !defined) return null;

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await defineOrderWarranty({
        orderId: order.id,
        type,
        noneReason: type === "none" ? noneReason : undefined,
        customValue: type === "custom" ? Number(customValue) : undefined,
        customUnit: type === "custom" ? customUnit : undefined,
        note: note.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <section className={adminShell.cardSection}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={adminShell.sectionTitleSm}>4. Definir garantía</h3>
        <StepBadge done={defined} label={defined ? "Completado" : "Pendiente"} />
      </div>

      {defined && order.warrantyLabel ? (
        <p className="mt-3 text-sm font-medium text-foreground">{order.warrantyLabel}</p>
      ) : (
        <div className="mt-3 space-y-4">
          <div className="space-y-2">
            <label htmlFor="warranty-type" className={adminShell.fieldLabel}>
              Garantía
            </label>
            <select
              id="warranty-type"
              value={type}
              onChange={(e) => setType(e.target.value as WarrantyOption)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              disabled={isPending}
            >
              {WARRANTY_SELECT.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {type === "none" && (
            <div className="space-y-2">
              <p className="text-xs text-amber-900/80 rounded-lg bg-amber-50 px-3 py-2">
                Usar solo en casos especiales y explicar el motivo.
              </p>
              <label htmlFor="warranty-none-reason" className={adminShell.fieldLabel}>
                Motivo / nota
              </label>
              <textarea
                id="warranty-none-reason"
                value={noneReason}
                onChange={(e) => setNoneReason(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder={WARRANTY_HYGIENE_SUGGESTED_COPY}
                disabled={isPending}
              />
            </div>
          )}

          {type === "custom" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="warranty-custom-value" className={adminShell.fieldLabel}>
                  Duración
                </label>
                <input
                  id="warranty-custom-value"
                  type="number"
                  min={1}
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="warranty-custom-unit" className={adminShell.fieldLabel}>
                  Unidad
                </label>
                <select
                  id="warranty-custom-unit"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value as WarrantyCustomUnit)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  disabled={isPending}
                >
                  <option value="days">Días</option>
                  <option value="months">Meses</option>
                  <option value="years">Años</option>
                </select>
              </div>
            </div>
          )}

          {type !== "none" && (
            <div className="space-y-2">
              <label htmlFor="warranty-note" className={adminShell.fieldLabel}>
                Nota adicional (opcional)
              </label>
              <textarea
                id="warranty-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                disabled={isPending}
              />
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <AdminButton type="button" onClick={submit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Definir garantía
          </AdminButton>
        </div>
      )}
    </section>
  );
}

export function OrderPaymentInstructionsSection({ order }: { order: AdminOrderDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const confirmed = order.paymentMethodConfirmed;

  const isTransfer = order.paymentMethod === "bank_transfer";
  const amount = order.confirmedFinalPrice ?? order.total;
  const bankText = useMemo(
    () => bankTransferDetailsText(order.orderNumber, amount),
    [order.orderNumber, amount],
  );
  const waMessage = useMemo(
    () => bankTransferWhatsAppMessage(order.orderNumber, amount, order.customerName),
    [order.orderNumber, amount, order.customerName],
  );

  if (order.status !== "confirmed" || order.paymentStatus === "paid") {
    if (!confirmed) return null;
  }
  if (order.status !== "confirmed") return null;
  if (!order.warrantyLabel && !confirmed) return null;

  const copyBankDetails = async () => {
    try {
      await navigator.clipboard.writeText(bankText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No se pudo copiar al portapapeles.");
    }
  };

  const markInstructionsOrConfirm = (instructionsSent: boolean) => {
    setError(null);
    startTransition(async () => {
      const result = await confirmOrderPaymentMethod({
        orderId: order.id,
        instructionsSent,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const customerMailto = `mailto:${encodeURIComponent(order.customerEmail)}?subject=${encodeURIComponent(`Instrucciones de pago · ${order.orderNumber}`)}&body=${encodeURIComponent(bankText)}`;

  const sendEmail = () => {
    setError(null);
    startTransition(async () => {
      const result = await sendOrderPaymentInstructionsEmail(order.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <section className={adminShell.cardSection}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={adminShell.sectionTitleSm}>5. Confirmar forma de pago</h3>
        <StepBadge done={confirmed} label={confirmed ? "Completado" : "Pendiente"} />
      </div>

      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className={adminShell.mutedBox}>
          <dt className={adminShell.fieldLabel}>Preferencia del cliente</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">
            {customerPaymentPreferenceLabel(order.paymentMethod)}
          </dd>
        </div>
        <div className={adminShell.mutedBox}>
          <dt className={adminShell.fieldLabel}>Tienda de recolección</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">
            {branchDisplayName(order.branchSlug, order.branchLabel)}
          </dd>
        </div>
      </dl>

      {confirmed ? (
        <p className="mt-3 text-sm text-emerald-700">
          Forma de pago confirmada
          {order.paymentInstructionsSent && isTransfer
            ? " · Instrucciones enviadas al cliente"
            : ""}
          .
        </p>
      ) : isTransfer ? (
        <div className="mt-4 space-y-4">
          <div className={adminShell.mutedBox}>
            <p className={adminShell.fieldLabel}>Datos bancarios oficiales</p>
            <ul className="mt-2 space-y-1 text-sm text-foreground/90">
              <li>Banco: {BANK_TRANSFER_DETAILS.bank}</li>
              <li>Titular: {BANK_TRANSFER_DETAILS.holder}</li>
              <li>Cuenta: {BANK_TRANSFER_DETAILS.account}</li>
              <li>Tarjeta: {BANK_TRANSFER_DETAILS.card}</li>
              <li>CLABE: {BANK_TRANSFER_DETAILS.clabe}</li>
            </ul>
            <p className="mt-2 text-sm font-medium text-foreground">
              Monto: {formatPrice(amount)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <AdminButton type="button" variant="secondary" onClick={copyBankDetails} disabled={isPending}>
              <Copy className="h-4 w-4" />
              {copied ? "Copiado" : "Copiar datos bancarios"}
            </AdminButton>
            <AdminButton asChild variant="secondary">
              <a href={whatsappHref(undefined, waMessage)} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                Enviar por WhatsApp
              </a>
            </AdminButton>
            <AdminButton asChild variant="secondary">
              <a href={customerMailto}>
                <Mail className="h-4 w-4" />
                Enviar por correo
              </a>
            </AdminButton>
            <AdminButton type="button" variant="secondary" onClick={sendEmail} disabled={isPending}>
              Enviar email automático
            </AdminButton>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <AdminButton
            type="button"
            onClick={() => markInstructionsOrConfirm(true)}
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Marcar instrucciones enviadas
          </AdminButton>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            El cliente eligió pago presencial. Confirma la sucursal de pago y recolección antes de
            validar el pago.
          </p>
          <p className="text-sm font-medium text-foreground">
            Sucursal: {branchDisplayName(order.branchSlug, order.branchLabel)}
          </p>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <AdminButton type="button" onClick={() => markInstructionsOrConfirm(false)} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar forma de pago
          </AdminButton>
        </div>
      )}
    </section>
  );
}
