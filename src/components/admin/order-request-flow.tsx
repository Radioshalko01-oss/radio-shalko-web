import { Check, Circle, CircleDot } from "lucide-react";
import {
  branchDisplayName,
  customerPaymentPreferenceLabel,
  paymentStatusUi,
} from "@/lib/orders/status-labels";
import type { AdminOrderDetail } from "@/lib/orders/admin-queries";
import { adminShell } from "@/lib/design/admin-shell";
import { cn } from "@/lib/utils";

type FlowStepState = "completed" | "current" | "pending";

type FlowStep = {
  id: string;
  title: string;
  state: FlowStepState;
  detail?: string;
};

function buildOrderFlowSteps(order: AdminOrderDetail): FlowStep[] {
  const cancelled = order.status === "cancelled" || order.fulfillmentStatus === "cancelled";
  const pending = order.status === "pending" && order.paymentStatus === "unpaid";
  const approvedUnpaid = order.status === "confirmed" && order.paymentStatus === "unpaid";
  const paid = order.paymentStatus === "paid";
  const fs = order.fulfillmentStatus;

  const step = (
    id: string,
    title: string,
    state: FlowStepState,
    detail?: string,
  ): FlowStep => ({ id, title, state, detail });

  if (cancelled) {
    return [
      step("received", "Solicitud recibida", "completed"),
      step("review", "Revisar disponibilidad", "completed", "Solicitud cerrada"),
      step("price", "Confirmar precio final", "pending"),
      step("warranty", "Definir garantía", "pending"),
      step("payment_method", "Confirmar forma de pago", "pending"),
      step("validate_payment", "Validar pago", "pending"),
      step("prepare", "Preparar pedido", "pending"),
      step("ready", "Listo para recoger", "pending"),
      step("delivered", "Entregado", "pending"),
    ];
  }

  return [
    step("received", "Solicitud recibida", "completed"),
    step(
      "review",
      "Revisar disponibilidad",
      pending ? "current" : "completed",
      pending ? "Acción requerida: revisar productos y disponibilidad." : undefined,
    ),
    step(
      "price",
      "Confirmar precio final",
      pending ? "pending" : "completed",
      pending ? undefined : "Precio acordado con el cliente.",
    ),
    step(
      "warranty",
      "Definir garantía",
      pending ? "pending" : approvedUnpaid || paid ? "completed" : "current",
      approvedUnpaid ? "Confirma garantía al cliente si aún no lo hiciste." : undefined,
    ),
    step(
      "payment_method",
      "Confirmar forma de pago",
      approvedUnpaid ? "current" : paid ? "completed" : "pending",
      approvedUnpaid
        ? "Comparte instrucciones oficiales según la preferencia del cliente."
        : undefined,
    ),
    step(
      "validate_payment",
      "Validar pago",
      paid ? "completed" : approvedUnpaid ? "current" : "pending",
      approvedUnpaid ? "Acción requerida: validar transferencia o pago presencial." : undefined,
    ),
    step(
      "prepare",
      "Preparar pedido",
      fs === "preparing" ? "current" : ["ready_for_pickup", "delivered"].includes(fs)
        ? "completed"
        : paid && fs === "unfulfilled"
          ? "current"
          : "pending",
      paid && fs === "unfulfilled" ? "Acción requerida: iniciar preparación." : undefined,
    ),
    step(
      "ready",
      "Listo para recoger",
      fs === "ready_for_pickup"
        ? "current"
        : fs === "delivered"
          ? "completed"
          : "pending",
      fs === "ready_for_pickup" ? "Avisar al cliente que puede recoger." : undefined,
    ),
    step(
      "delivered",
      "Entregado",
      fs === "delivered" ? "completed" : "pending",
    ),
  ];
}

function recommendedNextAction(order: AdminOrderDetail): string {
  if (order.status === "cancelled") return "Solicitud cerrada. No requiere más acciones.";
  if (order.status === "pending" && order.paymentStatus === "unpaid") {
    return "Revisar disponibilidad y confirmar al cliente.";
  }
  if (order.status === "confirmed" && order.paymentStatus === "unpaid") {
    return "Validar el pago manual cuando hayas confirmado transferencia o pago presencial.";
  }
  if (order.paymentStatus === "paid" && order.fulfillmentStatus === "unfulfilled") {
    return "Iniciar preparación del pedido.";
  }
  if (order.fulfillmentStatus === "preparing") {
    return "Marcar el pedido como listo para recoger.";
  }
  if (order.fulfillmentStatus === "ready_for_pickup") {
    return "Marcar como entregado cuando el cliente recoja.";
  }
  if (order.fulfillmentStatus === "delivered") {
    return "Pedido completado.";
  }
  return "Revisar el estado del pedido.";
}

function StepIcon({ state }: { state: FlowStepState }) {
  if (state === "completed") {
    return <Check className="h-4 w-4 text-emerald-600" />;
  }
  if (state === "current") {
    return <CircleDot className="h-4 w-4 text-copper" />;
  }
  return <Circle className="h-4 w-4 text-muted-foreground/50" />;
}

export function OrderRequestFlow({ order }: { order: AdminOrderDetail }) {
  const steps = buildOrderFlowSteps(order);
  const preference = customerPaymentPreferenceLabel(order.paymentMethod);

  return (
    <section className={adminShell.cardSection}>
      <h3 className={adminShell.sectionTitleSm}>Flujo de solicitud</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Sigue estos pasos para no olvidar acciones operativas.
      </p>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className={adminShell.mutedBox}>
          <dt className={adminShell.fieldLabel}>Preferencia de pago del cliente</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{preference}</dd>
        </div>
        <div className={adminShell.mutedBox}>
          <dt className={adminShell.fieldLabel}>Tienda de recolección</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">
            {branchDisplayName(order.branchSlug, order.branchLabel)}
          </dd>
        </div>
        <div className={adminShell.mutedBox}>
          <dt className={adminShell.fieldLabel}>Estado de pago</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">
            {paymentStatusUi(order.paymentStatus, order.status, {
              fulfillmentStatus: order.fulfillmentStatus,
            })}
          </dd>
        </div>
      </dl>

      <p className="mt-4 rounded-lg bg-copper/5 px-3 py-2 text-sm text-foreground/90">
        <span className="font-medium">Siguiente acción recomendada:</span>{" "}
        {recommendedNextAction(order)}
      </p>

      <ol className="mt-5 space-y-3">
        {steps.map((step, index) => (
          <li key={step.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full border",
                  step.state === "completed" && "border-emerald-100 bg-emerald-50",
                  step.state === "current" && "border-copper/30 bg-copper/5",
                  step.state === "pending" && "border-border bg-muted/30",
                )}
              >
                <StepIcon state={step.state} />
              </div>
              {index < steps.length - 1 && (
                <span className="mt-1 h-full min-h-4 w-px bg-border" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.state === "completed" && "text-foreground",
                  step.state === "current" && "text-foreground",
                  step.state === "pending" && "text-muted-foreground",
                )}
              >
                {index + 1}. {step.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {step.state === "completed"
                  ? "Completado"
                  : step.state === "current"
                    ? "Acción requerida"
                    : "Pendiente"}
              </p>
              {step.detail && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
