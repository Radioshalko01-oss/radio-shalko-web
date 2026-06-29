"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Info, Store } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { CheckoutSubmitBlock } from "@/components/checkout/checkout-submit-block";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartProducts } from "@/hooks/use-cart-products";
import { useQuote } from "@/hooks/use-quote";
import {
  CHECKOUT_GENERAL_NOTE,
  pickupStoreLabel,
  PICKUP_STORE_HINTS,
} from "@/lib/checkout/constants";
import type { CheckoutFormState } from "@/lib/checkout/types";
import { validatePurchaseRequestForm } from "@/lib/checkout/validate";
import { formatPrice } from "@/lib/catalog/format";
import { createOrderFromCart } from "@/lib/orders/actions";
import type { CreateOrderSuccess } from "@/lib/orders/types";
import { whatsappHref } from "@/lib/site-contact";
import { cn } from "@/lib/utils";

const INITIAL_FORM: CheckoutFormState = {
  contact: { name: "", email: "", phone: "", notes: "" },
  deliveryMethod: "pickup",
  branchSlug: "chalco",
  localAddress: { street: "", neighborhood: "", postalCode: "" },
  nationalAddress: {
    recipientName: "",
    recipientPhone: "",
    street: "",
    exteriorNumber: "",
    neighborhood: "",
    city: "",
    state: "Estado de México",
    postalCode: "",
  },
  paymentMethod: "pay_in_store",
};

type CheckoutPageProps = {
  isAuthed: boolean;
  defaultEmail?: string | null;
};

export function CheckoutPage({ isAuthed, defaultEmail }: CheckoutPageProps) {
  const router = useRouter();
  const { items, clearCart } = useQuote();
  const { rows, loading, isEmpty, subtotal } = useCartProducts();
  const [form, setForm] = useState<CheckoutFormState>(() => ({
    ...INITIAL_FORM,
    contact: {
      ...INITIAL_FORM.contact,
      email: defaultEmail ?? "",
    },
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderResult, setOrderResult] = useState<CreateOrderSuccess | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthed && defaultEmail && !form.contact.email) {
      setForm((f) => ({
        ...f,
        contact: { ...f.contact, email: defaultEmail },
      }));
    }
  }, [isAuthed, defaultEmail, form.contact.email]);

  useEffect(() => {
    if (isAuthed && !loading && isEmpty && !orderResult) {
      router.replace("/carrito");
    }
  }, [isAuthed, loading, isEmpty, orderResult, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthed) return;

    const result = validatePurchaseRequestForm(form, !isEmpty);
    if (!result.ok) {
      setErrors(result.errors);
      setSubmitError(null);
      const firstKey = Object.keys(result.errors)[0];
      document.querySelector(`[data-field="${firstKey}"]`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    setErrors({});
    setSubmitError(null);
    setSubmitting(true);

    try {
      const created = await createOrderFromCart(form, items);
      if (!created.ok) {
        if (created.fieldErrors) setErrors(created.fieldErrors);
        setSubmitError(created.error);
        return;
      }

      await clearCart();
      setOrderResult(created);
      window.scrollTo({ top: 0 });
    } catch {
      setSubmitError("No pudimos enviar tu solicitud. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted-foreground">
        Cargando…
      </div>
    );
  }

  if (orderResult) {
    return <CheckoutRequestConfirmation order={orderResult} />;
  }

  if (!isAuthed) {
    return <CheckoutLoginGate hasItems={!isEmpty} />;
  }

  if (isEmpty) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 pb-40 sm:px-6 md:py-20 md:pb-24 lg:px-8">
      <Link
        href="/carrito"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al carrito
      </Link>

      <header className="mt-5 md:mt-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
          Solicitar compra
        </h1>
        <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Revisaremos la disponibilidad de tus productos antes de enviarte el método de pago.
        </p>
      </header>

      <div className="mt-6 md:hidden">
        <CheckoutSummary rows={rows} compact />
      </div>

      <form
        id="checkout-form"
        onSubmit={handleSubmit}
        className="mt-5 grid gap-6 md:mt-6 md:grid-cols-[minmax(0,1fr)_300px] md:items-start lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]"
      >
        <div className="space-y-5">
          <CheckoutSection title="¿Cómo te contactamos?">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Nombre completo"
                required
                error={errors.contactName}
                dataField="contactName"
                className="sm:col-span-2"
              >
                <Input
                  value={form.contact.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      contact: { ...f.contact, name: e.target.value },
                    }))
                  }
                  placeholder="Tu nombre"
                  className="h-11 rounded-lg"
                />
              </FormField>
              <FormField
                label="Correo electrónico"
                required
                error={errors.contactEmail}
                dataField="contactEmail"
              >
                <Input
                  type="email"
                  value={form.contact.email}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      contact: { ...f.contact, email: e.target.value },
                    }))
                  }
                  placeholder="tu@correo.com"
                  className="h-11 rounded-lg"
                />
              </FormField>
              <FormField
                label="WhatsApp o teléfono"
                required
                error={errors.contactPhone}
                dataField="contactPhone"
              >
                <Input
                  type="tel"
                  inputMode="tel"
                  value={form.contact.phone}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      contact: { ...f.contact, phone: e.target.value },
                    }))
                  }
                  placeholder="10 dígitos"
                  className="h-11 rounded-lg"
                />
              </FormField>
              <FormField
                label="Horario estimado de recolección"
                hint="Nos ayuda a coordinar la confirmación de tu solicitud."
                className="sm:col-span-2"
              >
                <textarea
                  value={form.contact.notes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      contact: { ...f.contact, notes: e.target.value },
                    }))
                  }
                  rows={2}
                  placeholder="Ej. Hoy por la tarde, mañana después de las 5 p.m. (opcional)"
                  className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </FormField>
            </div>
          </CheckoutSection>

          <CheckoutSection title="¿Dónde quieres recoger tu pedido?">
            <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
              {CHECKOUT_GENERAL_NOTE}
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2" data-field="branchSlug">
              {(["chalco", "amecameca"] as const).map((slug) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, branchSlug: slug }))}
                  className={cn(
                    "rounded-xl border p-3.5 text-left transition-colors duration-150 motion-reduce:transition-none",
                    form.branchSlug === slug
                      ? "border-copper bg-copper/5 ring-1 ring-copper"
                      : "border-border hover:border-foreground/20",
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <Store className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>
                      <span className="block text-sm font-medium">{pickupStoreLabel(slug)}</span>
                      <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                        {PICKUP_STORE_HINTS[slug]}
                      </span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {errors.branchSlug && (
              <p className="mt-2 text-xs text-red-600">{errors.branchSlug}</p>
            )}
          </CheckoutSection>

          <CheckoutSection title="Pago después de confirmación">
            <div className="flex gap-3 rounded-xl border border-border/80 bg-muted/30 p-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-copper/80" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                Cuando Radio Shalko confirme la disponibilidad de tu pedido, recibirás las
                instrucciones de pago. No se realizará ningún cargo en este momento.
              </p>
            </div>
          </CheckoutSection>

          {errors.cart && (
            <p className="text-center text-xs text-red-600 md:text-left">{errors.cart}</p>
          )}
          {submitError && !errors.cart && (
            <p className="text-center text-xs text-red-600 md:text-left">{submitError}</p>
          )}
        </div>

        <aside className="hidden md:block md:sticky md:top-20">
          <CheckoutSummary rows={rows} />
          <CheckoutSubmitBlock submitting={submitting} className="mt-4" />
        </aside>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm md:hidden">
        <div className="mx-auto max-w-6xl space-y-2.5">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Total estimado
              </p>
              <p className="font-display text-xl font-semibold tabular-nums tracking-tight">
                {formatPrice(subtotal)}
              </p>
            </div>
            <p className="text-right text-xs text-muted-foreground">
              {rows.length} producto{rows.length === 1 ? "" : "s"}
            </p>
          </div>
          <Button
            type="submit"
            form="checkout-form"
            disabled={submitting}
            className="h-12 w-full rounded-full text-sm font-semibold"
          >
            {submitting ? "Enviando…" : "Enviar solicitud"}
          </Button>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            No se realizará ningún cobro en este momento.
          </p>
          {submitError && (
            <p className="text-center text-xs text-red-600">{submitError}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckoutLoginGate({ hasItems }: { hasItems: boolean }) {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-border bg-card px-6 py-8 text-center shadow-sm sm:px-8">
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-[1.35rem]">
          Inicia sesión para solicitar tu compra
        </h1>
        <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Necesitamos tu cuenta para guardar la solicitud, confirmar disponibilidad y avisarte
          cuando esté lista para recoger.
        </p>

        {!hasItems && (
          <p className="mt-3 text-xs text-muted-foreground">
            Tu carrito está vacío. Agrega productos antes de continuar.
          </p>
        )}

        <GoogleSignInButton
          next="/checkout"
          className="mt-6"
          buttonClassName="h-12 rounded-full border-border shadow-sm"
        />

        <Link
          href="/carrito"
          className="mt-5 inline-block text-sm text-muted-foreground underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline motion-reduce:transition-none"
        >
          Volver al carrito
        </Link>
      </div>
    </div>
  );
}

function CheckoutRequestConfirmation({ order }: { order: CreateOrderSuccess }) {
  const whatsappMessage = `Hola, acabo de enviar la solicitud de compra ${order.orderNumber}. Quiero confirmar disponibilidad.`;

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 md:py-20">
      <div className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {order.statusLabel}
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight tabular-nums md:text-3xl">
          {order.orderNumber}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          Recibimos tu solicitud de compra. Radio Shalko revisará la disponibilidad de tus
          productos y te avisará cuando tu pedido sea aprobado.
        </p>
      </div>

      <dl className="mt-10 space-y-4 rounded-2xl border border-border bg-card p-6 text-sm">
        <SummaryRow label="Estado" value="Pendiente de revisión" bold />
        <SummaryRow label="Recoger en" value={order.branchDisplayName} />
        <SummaryRow label="Total estimado" value={formatPrice(order.total)} bold />
      </dl>

      <p className="mt-6 rounded-xl border border-border/80 bg-muted/30 px-4 py-3 text-center text-xs leading-relaxed text-muted-foreground">
        No se realizó ningún cobro. El pago se solicitará después de confirmar disponibilidad.
      </p>

      <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild className="h-11 rounded-full">
          <Link href="/productos">Ver catálogo</Link>
        </Button>
        <Button asChild variant="outline" className="h-11 rounded-full">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>

      <div className="mt-4 text-center">
        <Button asChild variant="ghost" className="h-10 rounded-full text-sm text-muted-foreground">
          <a href={whatsappHref(undefined, whatsappMessage)} target="_blank" rel="noopener noreferrer">
            Contactar a Radio Shalko
          </a>
        </Button>
      </div>
    </div>
  );
}

function CheckoutSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 md:p-5">
      <h2 className="border-b border-border pb-3 font-display text-base font-semibold tracking-tight">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FormField({
  label,
  required,
  hint,
  error,
  dataField,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  dataField?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)} data-field={dataField}>
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-copper"> *</span>}
      </Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right", bold && "font-semibold tabular-nums")}>{value}</span>
    </div>
  );
}
