"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Wrench,
  Headphones,
  Sparkles,
  Hand,
  Bookmark,
  ShieldCheck,
  Check,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

const TECH_INSTRUMENTS = {
  equipo: ["Guitarras acústicas", "Guitarras eléctricas", "Electroacústicas", "Bajos acústicos y eléctricos"],
  servicios: [
    "Ajuste y calibración",
    "Reparación de electrónica",
    "Cambio de cuerdas",
    "Mantenimiento preventivo",
    "Ajuste de acción",
  ],
};

const TECH_AUDIO = {
  equipo: ["Mezcladoras", "Bafles amplificados", "Amplificadores", "Interfaces", "Equipo de sonido profesional"],
  servicios: ["Diagnóstico preciso", "Reparación electrónica", "Mantenimiento preventivo"],
};

const ADVICE = [
  "Recomendaciones según tu nivel",
  "Orientación para músicos principiantes y avanzados",
  "Equipamiento ideal según tu presupuesto",
  "Asesoría para proyectos de audio y sonido profesional",
];

const TRY_LIST = ["Guitarras", "Bajos", "Ukuleles", "Micrófonos", "Mezcladoras", "Bafles"];

const WARRANTY = [
  "1 mes de garantía general",
  "3, 6 y hasta 12 meses en productos seleccionados",
  "Aplica según marca y modelo",
];

const WHY = [
  "Atención personalizada",
  "Servicio técnico especializado",
  "Garantía real",
  "Productos profesionales",
  "Experiencia y pasión por la música",
];

const FAQ = [
  {
    q: "¿Puedo probar un instrumento antes de comprarlo?",
    a: "Sí. Visita nuestras tiendas en Chalco o Amecameca y pruébalo con la asesoría de nuestro equipo.",
  },
  {
    q: "¿Ofrecen servicio técnico?",
    a: "Contamos con taller especializado para instrumentos y equipo de audio profesional.",
  },
  {
    q: "¿Cómo funciona el apartado?",
    a: "Aparta tu producto con un primer pago y liquida en hasta 2 meses antes de recogerlo.",
  },
  {
    q: "¿Todos los productos tienen garantía?",
    a: "Sí. La cobertura varía según marca y modelo; te informamos al momento de tu compra.",
  },
];

const PAYMENT = [
  "Efectivo en tienda",
  "Tarjeta de débito y crédito",
  "Transferencia bancaria",
  "Sistema de apartado hasta 2 meses",
];

const SHIPPING = [
  "Entrega en zona metropolitana del Valle de México (consulta disponibilidad)",
  "Recolección gratuita en tienda Chalco o Amecameca",
  "Empaque seguro para instrumentos y equipo de audio",
  "Tiempos de entrega confirmados al cotizar tu pedido",
];

export function ServiciosPage() {
  return (
    <div className="pt-28 md:pt-32">
      
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-5 md:px-8">
          <PageHeader
            eyebrow="Servicios"
            title="Taller, asesoría y garantía"
            description="Más de 40 años respaldando a músicos y técnicos. Cuidamos tu instrumento como si fuera nuestro."
            titleClassName="max-w-2xl"
          />
        </section>


        {/* Two technical specialties */}
        <section className="mx-auto mt-20 max-w-7xl px-5 md:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            <SpecialtyCard
              icon={Wrench}
              eyebrow="Especialidad"
              title="Técnico de instrumentos"
              tagline="Tu instrumento en manos expertas."
              equipo={TECH_INSTRUMENTS.equipo}
              servicios={TECH_INSTRUMENTS.servicios}
            />
            <SpecialtyCard
              icon={Headphones}
              eyebrow="Especialidad"
              title="Audio profesional"
              tagline="Tu equipo de audio en manos expertas."
              equipo={TECH_AUDIO.equipo}
              servicios={TECH_AUDIO.servicios}
            />
          </div>
        </section>

        {/* Asesoría + Probar */}
        <section className="mx-auto mt-24 max-w-7xl px-5 md:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            <FeatureBlock
              icon={Sparkles}
              eyebrow="Asesoría personalizada"
              title="No solo vendemos. Te ayudamos a elegir."
              desc="En Radio Shalko queremos que inviertas bien tu dinero."
              items={ADVICE}
            />
            <FeatureBlock
              icon={Hand}
              eyebrow="Prueba antes de comprar"
              title="Un instrumento se elige con las manos y el corazón."
              desc="Visita la tienda y prueba lo que estás considerando."
              items={TRY_LIST}
              dense
            />
          </div>
        </section>

        {/* Apartado + Garantía — dark band */}
        <section className="relative mt-24 overflow-hidden bg-foreground py-20 text-background md:py-28">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,170,90,0.18),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(255,170,90,0.12),transparent_50%)]"
          />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-2 md:px-8">
            <DarkBlock
              id="apartado"
              icon={Bookmark}
              eyebrow="Sistema de apartado"
              title="Hasta 2 meses para llevártelo."
              desc="¿Te gustó un producto pero aún no puedes pagarlo completo? Aparta tu instrumento o equipo y asegúralo sin perder la oportunidad."
              chips={["1er pago", "2do pago", "Recoge"]}
            />
            <DarkBlock
              id="garantia"
              icon={ShieldCheck}
              eyebrow="Garantía real"
              title="Respaldados por años, no por letras chiquitas."
              desc="Todos nuestros productos incluyen garantía. La cobertura depende de la marca y del modelo."
              items={WARRANTY}
            />
          </div>
        </section>

        {/* Why us */}
        <section id="por-que-radio-shalko" className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              ¿Por qué Radio Shalko?
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">
              5 razones para elegirnos
            </h2>
          </div>
          <ol className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-5">
            {WHY.map((w, i) => (
              <li key={w} className="bg-background p-6">
                <span className="font-display text-xs font-semibold tracking-wider text-muted-foreground">
                  0{i + 1}
                </span>
                <p className="mt-3 text-sm font-medium leading-snug text-foreground">
                  {w}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-5 border border-border bg-muted/40 p-6 md:p-8">
            <div>
              <h3 className="font-display text-lg font-semibold tracking-tight md:text-xl">
                ¿Listo para que revisemos tu equipo?
              </h3>
              <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
                Agenda una visita o cuéntanos qué necesitas. Te respondemos por WhatsApp o teléfono.
              </p>
            </div>
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 bg-foreground px-5 py-3 text-xs font-semibold uppercase tracking-wider text-background transition-colors hover:bg-foreground/85"
            >
              Contactar taller <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* Preguntas frecuentes */}
        <section id="preguntas-frecuentes" className="border-t border-border bg-muted/30 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Preguntas frecuentes
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Resolvemos tus dudas
            </h2>
            <dl className="mt-10 grid gap-6 md:grid-cols-2">
              {FAQ.map(({ q, a }) => (
                <div key={q} className="rounded-2xl border border-border bg-card p-6">
                  <dt className="text-sm font-semibold text-foreground">{q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Formas de pago + envíos */}
        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <div className="grid gap-10 md:grid-cols-2">
            <article id="formas-pago" className="rounded-3xl border border-border bg-card p-7 md:p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Formas de pago
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">
                Paga como te convenga
              </h2>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                {PAYMENT.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-copper" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            <article id="politica-envios" className="rounded-3xl border border-border bg-card p-7 md:p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Política de envíos
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">
                Entrega y recolección
              </h2>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                {SHIPPING.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-copper" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      </div>
  );
}

function SpecialtyCard({
  icon: Icon, eyebrow, title, tagline, equipo, servicios,
}: {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string; title: string; tagline: string;
  equipo: string[]; servicios: string[];
}) {
  return (
    <article className="relative overflow-hidden rounded-3xl border border-border bg-card p-7 md:p-10">
      <div
        aria-hidden
        className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-copper/10 blur-3xl"
      />
      <div className="relative">
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-copper/30 bg-copper/10 text-copper">
          <Icon className="h-5 w-5" />
        </div>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-copper">
          {eyebrow}
        </p>
        <h3 className="mt-2 font-display text-3xl font-medium leading-tight md:text-4xl">
          {title}
        </h3>
        <p className="mt-3 text-sm italic text-muted-foreground">{tagline}</p>

        <div className="mt-7 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Equipo
            </p>
            <ul className="mt-3 space-y-1.5">
              {equipo.map((e) => (
                <li key={e} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-copper" />
                  {e}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Servicios
            </p>
            <ul className="mt-3 space-y-1.5">
              {servicios.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-copper" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}

function FeatureBlock({
  icon: Icon, eyebrow, title, desc, items, dense,
}: {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string; title: string; desc: string; items: string[]; dense?: boolean;
}) {
  return (
    <article className="rounded-3xl border border-border bg-card p-7 md:p-10">
      <div className="grid h-12 w-12 place-items-center rounded-xl border border-copper/30 bg-copper/10 text-copper">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-copper">
        {eyebrow}
      </p>
      <h3 className="mt-2 font-display text-3xl font-medium leading-tight md:text-4xl">
        {title}
      </h3>
      <p className="mt-3 text-sm text-muted-foreground">{desc}</p>
      {dense ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {items.map((i) => (
            <span key={i} className="rounded-full border border-border bg-background px-4 py-1.5 text-sm">
              {i}
            </span>
          ))}
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {items.map((i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-copper" />
              {i}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function DarkBlock({
  id,
  icon: Icon, eyebrow, title, desc, items, chips,
}: {
  id?: string;
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string; title: string; desc: string; items?: string[]; chips?: string[];
}) {
  return (
    <article id={id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur md:p-10">
      <div className="grid h-12 w-12 place-items-center rounded-xl border border-copper/40 bg-copper/15 text-copper">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-copper">
        {eyebrow}
      </p>
      <h3 className="mt-2 font-display text-3xl font-medium leading-tight text-background md:text-4xl">
        {title}
      </h3>
      <p className="mt-3 text-sm text-background/70">{desc}</p>
      {items && (
        <ul className="mt-6 space-y-2">
          {items.map((i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-background/85">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-copper" />
              {i}
            </li>
          ))}
        </ul>
      )}
      {chips && (
        <div className="mt-6 flex items-center gap-2">
          {chips.map((c, i) => (
            <span key={c} className="flex items-center gap-2">
              <span className="rounded-full border border-copper/40 bg-copper/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-copper">
                {c}
              </span>
              {i < chips.length - 1 && <span className="text-copper/50">→</span>}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
