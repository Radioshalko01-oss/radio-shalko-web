"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Wrench,
  Headphones,
  Sparkles,
  Hand,
  Bookmark,
  ShieldCheck,
  Check,
  ArrowUpRight,
  CreditCard,
  Package,
  MessageCircle,
} from "lucide-react";
import { SitePageHero } from "@/components/site/site-page-hero";
import { SiteClosingCta } from "@/components/site/site-closing-cta";
import { finalizeBreadcrumbs, siteCrumbs } from "@/lib/site/breadcrumbs";
import { siteShell } from "@/lib/design/site-shell";
import { cn } from "@/lib/utils";

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

const TRY_INSTRUMENTS = ["Guitarras", "Bajos", "Ukuleles"];
const TRY_AUDIO = ["Micrófonos", "Mezcladoras", "Bafles"];

const WARRANTY = [
  "1 mes de garantía general",
  "3, 6 y hasta 12 meses en productos seleccionados",
  "Aplica según marca y modelo",
];

const WHY = [
  { title: "Atención personalizada", desc: "Asesoría según tu nivel y presupuesto." },
  { title: "Servicio técnico", desc: "Taller propio de instrumentos y audio." },
  { title: "Garantía real", desc: "Respaldo claro al momento de comprar." },
  { title: "Productos profesionales", desc: "Marcas para estudio y escenario." },
  { title: "Experiencia local", desc: "Años en Chalco y Amecameca." },
] as const;

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
    a: "Aparta con un primer pago y haz abonos parciales a tu ritmo. Tienes hasta 2 meses para liquidar antes de recoger tu producto en tienda.",
  },
  {
    q: "¿Todos los productos tienen garantía?",
    a: "Sí. La cobertura varía según marca y modelo; te informamos al momento de tu compra.",
  },
];

const PAYMENT = [
  "Efectivo en tienda",
  "Transferencia bancaria",
  "Pago presencial en Chalco o Amecameca",
  "Sistema de apartado hasta 2 meses",
];

const PICKUP = [
  "Recolección gratuita en tienda Chalco o Amecameca",
  "Coordinamos fecha y horario contigo antes de recoger",
  "Empaque y revisión de producto al entregarte",
  "Para pedidos especiales, consúltanos por WhatsApp",
];

const APARTADO_STEPS = [
  { step: "01", label: "1er pago", desc: "Aparta tu producto" },
  { step: "02", label: "Abonos", desc: "Pagos parciales a tu ritmo" },
  { step: "03", label: "Recoge", desc: "Retira en tienda" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export function ServiciosPage() {
  const reduceMotion = useReducedMotion();

  const motionProps = reduceMotion
    ? {}
    : {
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: true, margin: "-40px" },
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <>
      <SitePageHero
        breadcrumbs={finalizeBreadcrumbs([siteCrumbs.home, siteCrumbs.servicios])}
        title="Servicios"
        description="Todo lo que tu sonido necesita, en un solo lugar: instrumentos, audio profesional, servicio técnico y asesoría especializada."
      />

      <div className="pb-16 md:pb-20">
        {/* Taller */}
        <section className="mx-auto max-w-7xl px-5 pt-10 md:px-8 md:pt-12">
          <SectionIntro
            align="center"
            eyebrow="Taller especializado"
            title="Instrumentos y audio, un mismo nivel de cuidado"
            description="Especialistas en instrumentos y en electrónica de audio. Atendemos tu instrumento y tu equipo con el mismo rigor."
          />

          <div className="mt-8 grid gap-5 md:grid-cols-2 md:gap-6">
            <div className="flex flex-col gap-5">
              <WorkshopPanel
                icon={Wrench}
                title="Técnico de instrumentos"
                tagline="Tu instrumento en manos expertas."
                equipo={TECH_INSTRUMENTS.equipo}
                servicios={TECH_INSTRUMENTS.servicios}
                motionProps={motionProps}
                delay={0}
              />
              <WorkshopPhoto
                src="/images/servicios/taller-instrumentos.png"
                alt="Técnico reparando la electrónica de una guitarra eléctrica en taller"
                motionProps={motionProps}
                delay={0.04}
              />
            </div>
            <div className="flex flex-col gap-5">
              <WorkshopPanel
                icon={Headphones}
                title="Audio profesional"
                tagline="Tu equipo de audio en manos expertas."
                equipo={TECH_AUDIO.equipo}
                servicios={TECH_AUDIO.servicios}
                motionProps={motionProps}
                delay={0.08}
              />
              <WorkshopPhoto
                src="/images/servicios/taller-audio-profesional.png"
                alt="Técnico revisando equipo de audio profesional en taller"
                motionProps={motionProps}
                delay={0.12}
              />
            </div>
          </div>
        </section>

        {/* Experiencia en tienda */}
        <section className="mx-auto mt-12 max-w-7xl px-5 md:mt-14 md:px-8">
          <div className="grid gap-5 md:grid-cols-2 md:gap-6">
            <motion.article
              {...motionProps}
              transition={{ ...motionProps.transition, delay: 0 }}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 md:p-7"
            >
              <div className="flex items-center gap-3">
                <IconBadge icon={Sparkles} />
                <p className={siteShell.brandEyebrow}>Asesoría personalizada</p>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-tight md:text-2xl">
                No solo vendemos. Te ayudamos a elegir.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                En Radio Shalko queremos que inviertas bien tu dinero.
              </p>
              <ul className="mt-5 flex-1 space-y-2.5 border-t border-border pt-5">
                {ADVICE.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/85">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-copper" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.article>

            <motion.article
              {...motionProps}
              transition={{ ...motionProps.transition, delay: 0.06 }}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 md:p-7"
            >
              <div className="flex items-center gap-3">
                <IconBadge icon={Hand} />
                <p className={siteShell.brandEyebrow}>Prueba antes de comprar</p>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-tight md:text-2xl">
                Un instrumento se elige con las manos y el corazón.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Visita la tienda y prueba lo que estás considerando.
              </p>
              <div className="mt-5 grid flex-1 gap-5 border-t border-border pt-5 sm:grid-cols-2 sm:gap-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Instrumentos
                  </p>
                  <ul className="mt-3 space-y-2">
                    {TRY_INSTRUMENTS.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-foreground/85">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-copper" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Audio
                  </p>
                  <ul className="mt-3 space-y-2">
                    {TRY_AUDIO.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-foreground/85">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-copper" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.article>
          </div>
        </section>

        {/* Apartado + Garantía */}
        <section className="mx-auto mt-12 max-w-7xl px-5 md:mt-14 md:px-8">
          <div className="grid gap-5 md:grid-cols-2 md:gap-6">
            <motion.article
              id="apartado"
              {...motionProps}
              transition={{ ...motionProps.transition, delay: 0 }}
              className="group flex flex-col rounded-2xl border border-border bg-card p-6 md:p-7"
            >
              <div className="flex items-center gap-3">
                <IconBadge icon={Bookmark} />
                <p className={siteShell.brandEyebrow}>Sistema de apartado</p>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-tight md:text-2xl">
                Hasta 2 meses para llevártelo.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                ¿Te gustó un producto pero aún no puedes pagarlo completo? Aparta tu instrumento o
                equipo y asegúralo sin perder la oportunidad.
              </p>
              <ol className="relative mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5">
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-[16.666%] right-[16.666%] top-[calc(1.25rem+1rem)] hidden h-px bg-border md:block"
                />
                {APARTADO_STEPS.map((s) => (
                  <li key={s.step} className="relative z-[1] text-center">
                    <span className="mx-auto grid h-8 w-8 place-items-center rounded-full border border-copper/30 bg-copper/5 font-mono text-[11px] font-semibold text-copper transition-colors group-hover:border-copper/50 group-hover:bg-copper/10">
                      {s.step}
                    </span>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground">
                      {s.label}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{s.desc}</p>
                  </li>
                ))}
              </ol>
            </motion.article>

            <motion.article
              id="garantia"
              {...motionProps}
              transition={{ ...motionProps.transition, delay: 0.06 }}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 md:p-7"
            >
              <div className="flex items-center gap-3">
                <IconBadge icon={ShieldCheck} />
                <p className={siteShell.brandEyebrow}>Garantía real</p>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-tight md:text-2xl">
                Garantía clara, con respaldo real.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Todos nuestros productos incluyen garantía. La cobertura depende de la marca y del
                modelo.
              </p>
              <ul className="mt-5 space-y-2.5 border-t border-border pt-5">
                {WARRANTY.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/85">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-copper" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.article>
          </div>
        </section>

        {/* Por qué Radio Shalko */}
        <section id="por-que-radio-shalko" className="mx-auto mt-12 max-w-7xl px-5 md:mt-14 md:px-8">
          <SectionIntro
            align="center"
            eyebrow="¿Por qué Radio Shalko?"
            title="5 razones para elegirnos"
          />

          <WhyReasonsStrip motionProps={motionProps} />

        </section>

        {/* FAQ */}
        <section
          id="preguntas-frecuentes"
          className="mx-auto mt-12 max-w-7xl px-5 md:mt-14 md:px-8"
        >
          <SectionIntro align="center" eyebrow="Preguntas frecuentes" title="Resolvemos tus dudas" />

          <motion.div
            variants={reduceMotion ? undefined : { visible: { transition: { staggerChildren: 0.05 } } }}
            {...motionProps}
            className="mt-7 grid gap-4 md:grid-cols-2"
          >
            {FAQ.map(({ q, a }) => (
              <motion.article
                key={q}
                variants={reduceMotion ? undefined : fadeUp}
                className="rounded-2xl border border-border bg-card p-5 md:p-6"
              >
                <h3 className="text-sm font-semibold leading-snug text-foreground">{q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </motion.article>
            ))}
          </motion.div>
        </section>

        {/* Pago + recolección + contacto taller */}
        <section className="mx-auto mt-12 max-w-7xl px-5 md:mt-14 md:px-8">
          <div className="grid gap-4 md:grid-cols-3 md:gap-5">
            <InfoCard
              id="formas-pago"
              icon={CreditCard}
              eyebrow="Formas de pago"
              title="Paga como te convenga"
              items={PAYMENT}
              motionProps={motionProps}
              delay={0}
            />
            <InfoCard
              id="recoleccion-tienda"
              icon={Package}
              eyebrow="Recolección"
              title="Recolección en tienda"
              items={PICKUP}
              motionProps={motionProps}
              delay={0.05}
            />
            <InfoCard
              id="contacto-taller"
              icon={MessageCircle}
              eyebrow="Taller"
              title="¿Listo para que revisemos tu equipo?"
              items={[
                "Agenda una visita o cuéntanos qué necesitas",
                "Te respondemos por WhatsApp o teléfono",
              ]}
              motionProps={motionProps}
              delay={0.1}
              footer={
                <div className="flex justify-center">
                  <Link
                    href="/contacto"
                    className="inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-copper"
                  >
                    Contactar taller
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              }
            />
          </div>
        </section>

        <SiteClosingCta
          className="mt-0 pt-3 md:pt-4"
          eyebrow="Más que una venta"
          title="Te acompañamos antes, durante y después"
          description="Desde elegir tu primer instrumento hasta mantener tu equipo profesional en forma. Con taller propio, asesoría honesta y garantía real, estamos contigo en cada etapa de tu música."
          secondary={{ label: "Ir a contacto", href: "/contacto" }}
        />
      </div>
    </>
  );
}

function WhyReasonsStrip({ motionProps }: { motionProps: Record<string, unknown> }) {
  return (
    <motion.article
      {...motionProps}
      className="mt-6 rounded-2xl border border-border/80 bg-card px-5 py-6 md:px-6 md:py-7"
    >
      <ol className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-5 lg:gap-5">
        {WHY.map((item, i) => (
          <li
            key={item.title}
            className="group flex min-w-0 items-start gap-3 lg:flex-col lg:gap-2"
          >
            <span className="shrink-0 font-mono text-[10px] font-semibold tabular-nums tracking-[0.2em] text-copper/75 transition-colors group-hover:text-copper">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-medium leading-snug text-foreground">{item.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </motion.article>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <header className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-[1.65rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}

function IconBadge({ icon: Icon }: { icon: React.ComponentType<{ className?: string }> }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-copper/25 bg-copper/5 text-copper">
      <Icon className="h-4 w-4" />
    </span>
  );
}

function InfoCard({
  id,
  icon: Icon,
  eyebrow,
  title,
  items,
  motionProps,
  delay,
  footer,
}: {
  id?: string;
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  items: readonly string[];
  motionProps: Record<string, unknown>;
  delay: number;
  footer?: React.ReactNode;
}) {
  return (
    <motion.article
      id={id}
      {...motionProps}
      transition={{
        ...(motionProps.transition as object),
        delay,
      }}
      className="flex h-full flex-col rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-center gap-3">
        <IconBadge icon={Icon} />
        <p className={siteShell.brandEyebrow}>{eyebrow}</p>
      </div>
      <h2 className="mt-3 font-display text-lg font-semibold leading-snug tracking-tight">
        {title}
      </h2>
      <ul className="mt-4 flex-1 space-y-2 border-t border-border pt-4">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm leading-snug text-foreground/85">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-copper" />
            {item}
          </li>
        ))}
      </ul>
      {footer ? <div className="mt-4 border-t border-border pt-4">{footer}</div> : null}
    </motion.article>
  );
}

function WorkshopPanel({
  icon: Icon,
  title,
  tagline,
  equipo,
  servicios,
  motionProps,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tagline: string;
  equipo: string[];
  servicios: string[];
  motionProps: Record<string, unknown>;
  delay: number;
}) {
  return (
    <motion.article
      {...motionProps}
      transition={{
        ...(motionProps.transition as object),
        delay,
      }}
      className="flex flex-col rounded-2xl border border-border bg-card p-6 md:p-7"
    >
      <div className="flex items-start gap-4 border-b border-border pb-5">
        <IconBadge icon={Icon} />
        <div className="min-w-0">
          <p className={siteShell.brandEyebrow}>Especialidad</p>
          <h3 className="mt-1 font-display text-xl font-semibold tracking-tight md:text-2xl">
            {title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>
        </div>
      </div>

      <div className="mt-5 grid flex-1 gap-5 sm:grid-cols-2 sm:gap-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Equipo
          </p>
          <ul className="mt-3 space-y-2">
            {equipo.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-foreground/85">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-copper" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Servicios
          </p>
          <ul className="mt-3 space-y-2">
            {servicios.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-foreground/85">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-copper" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.article>
  );
}

function WorkshopPhoto({
  src,
  alt,
  motionProps,
  delay,
}: {
  src: string;
  alt: string;
  motionProps: Record<string, unknown>;
  delay: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      {...motionProps}
      transition={{
        ...(motionProps.transition as object),
        delay,
      }}
      className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[0_16px_40px_-32px_rgba(0,0,0,0.12)]"
    >
      <img
        src={src}
        alt={alt}
        className={cn(
          "aspect-[16/9] w-full object-cover object-center",
          !reduceMotion &&
            "transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:scale-[1.02]",
        )}
      />
    </motion.div>
  );
}
