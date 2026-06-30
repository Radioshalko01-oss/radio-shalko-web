"use client";

import { ShieldCheck, Wrench, Clock, FileText } from "lucide-react";
import { whatsappHref } from "@/lib/site-contact";
import { PageHeader } from "@/components/ui/page-header";

const BLOCKS = [
  {
    id: "garantia-oficial",
    icon: ShieldCheck,
    title: "Garantía oficial",
    body: "Todos nuestros productos cuentan con garantía directa del fabricante y respaldo de Radio Shalko.",
  },
  {
    id: "plazos-garantia",
    icon: Clock,
    title: "Plazos claros",
    body: "Cobertura típica de 12 a 24 meses según marca y categoría. Consulta el detalle de tu producto.",
  },
  {
    id: "servicio-tecnico",
    icon: Wrench,
    title: "Servicio técnico",
    body: "Reparación, ajuste y refacciones originales en nuestro taller autorizado por las marcas líderes.",
  },
  {
    id: "proceso-garantia",
    icon: FileText,
    title: "Proceso simple",
    body: "Presenta tu ticket o factura. Diagnosticamos, informamos y procedemos sin costo adicional.",
  },
];

export function GarantiaPage() {
  return (
    <div className="pt-28 md:pt-32">
      <section id="garantia-oficial" className="border-b border-border py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <PageHeader
            eyebrow="Soporte y respaldo"
            title="Garantía Radio Shalko"
            description="Compras tranquilo. Toda nuestra línea está respaldada por garantía oficial, servicio técnico autorizado y atención directa."
            titleClassName="max-w-3xl"
          />
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 md:grid-cols-2 md:gap-6 md:px-8">
          {BLOCKS.map(({ icon: Icon, title, body, id }) => (
            <div
              key={title}
              id={id}
              className="rounded-2xl border border-border bg-card p-6 md:p-8"
            >
              <Icon className="h-6 w-6 text-foreground" />
              <h2 className="mt-4 font-display text-xl font-semibold tracking-tight md:text-2xl">
                {title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/40 py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            ¿Necesitas hacer válida tu garantía?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            Escríbenos por WhatsApp o visita cualquiera de nuestras sucursales con tu
            comprobante de compra. Te orientamos durante todo el proceso.
          </p>
          <a
            href={whatsappHref()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-background transition-opacity hover:opacity-90"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
