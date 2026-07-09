"use client";

import { useState } from "react";
import { Check, ChevronDown, Circle } from "lucide-react";
import type { AdminOrderDetail } from "@/lib/orders/admin-queries";
import { adminShell } from "@/lib/design/admin-shell";
import { cn } from "@/lib/utils";

type ProgressItem = {
  label: string;
  done: boolean;
};

function buildProgressItems(order: AdminOrderDetail): ProgressItem[] {
  const cancelled = order.status === "cancelled" || order.fulfillmentStatus === "cancelled";
  const pending = order.status === "pending";
  const paid = order.paymentStatus === "paid";
  const fs = order.fulfillmentStatus;

  if (cancelled) {
    return [
      { label: "Solicitud recibida", done: true },
      { label: "Disponibilidad confirmada", done: false },
      { label: "Precio confirmado", done: false },
      { label: "Garantía definida", done: false },
      { label: "Forma de pago confirmada", done: false },
      { label: "Pago validado", done: false },
      { label: "Preparar pedido", done: false },
      { label: "Listo para recoger", done: false },
      { label: "Entregado", done: false },
    ];
  }

  return [
    { label: "Solicitud recibida", done: true },
    { label: "Disponibilidad confirmada", done: !pending },
    { label: "Precio confirmado", done: Boolean(order.confirmedFinalPriceAt) },
    { label: "Garantía definida", done: Boolean(order.warrantyLabel) },
    { label: "Forma de pago confirmada", done: order.paymentMethodConfirmed },
    { label: "Pago validado", done: paid },
    { label: "Preparar pedido", done: ["preparing", "ready_for_pickup", "delivered"].includes(fs) },
    { label: "Listo para recoger", done: ["ready_for_pickup", "delivered"].includes(fs) },
    { label: "Entregado", done: fs === "delivered" },
  ];
}

export function OrderProgressSummary({ order }: { order: AdminOrderDetail }) {
  const [open, setOpen] = useState(false);
  const items = buildProgressItems(order);
  const doneCount = items.filter((item) => item.done).length;

  return (
    <section id="order-progress" className={cn(adminShell.cardSection, "bg-muted/20")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <h3 className={adminShell.sectionTitleSm}>Progreso completo</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {doneCount} de {items.length} pasos completados
          </p>
        </div>
        <ChevronDown
          className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-sm">
              {item.done ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
              )}
              <span className={item.done ? "text-foreground" : "text-muted-foreground"}>
                {item.done ? "✓ " : "○ "}
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
