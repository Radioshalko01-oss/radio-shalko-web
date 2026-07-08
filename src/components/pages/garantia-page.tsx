"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useStableMotion } from "@/lib/motion/use-stable-motion";
import {
  ShieldCheck,
  Wrench,
  Clock,
  Check,
  X,
  MessageCircle,
  MapPin,
  Guitar,
} from "lucide-react";
import { SitePageHero } from "@/components/site/site-page-hero";
import { finalizeBreadcrumbs, siteCrumbs } from "@/lib/site/breadcrumbs";
import { siteShell } from "@/lib/design/site-shell";
import { SITE_CONTACT, whatsappHref } from "@/lib/site-contact";
import { cn } from "@/lib/utils";

const COVERAGE_ITEMS = [
  "1 mes de garantía general en toda la tienda",
  "3, 6 y hasta 12 meses en productos y marcas seleccionados",
  "Te confirmamos la cobertura antes de pagar — sin letra pequeña",
] as const;

const PILLARS = [
  {
    title: "Garantía oficial",
    body: "Respaldo directo del fabricante, sumado al de Radio Shalko.",
  },
  {
    title: "Taller autorizado",
    body: "Reparación, ajuste y refacciones originales de las marcas líderes.",
  },
  {
    title: "Atención directa",
    body: "Te acompañamos durante todo el proceso, sin intermediarios.",
  },
] as const;

const PROCESS_STEPS = [
  {
    step: "01",
    label: "Comprobante",
    desc: "Presenta tu ticket o factura de compra.",
    detail:
      "Necesitamos el comprobante original con fecha legible: ticket físico, factura o fotografía clara del mismo. Si compraste en tienda, basta con el ticket; si fue pedido especial, el correo o mensaje de confirmación también aplica.",
  },
  {
    step: "02",
    label: "Diagnóstico",
    desc: "Revisión en nuestro taller autorizado.",
    detail:
      "Nuestro equipo técnico o el proveedor de la marca evalúa el producto para confirmar si la falla es de fabricación y determinar la solución más adecuada.",
  },
  {
    step: "03",
    label: "Solución",
    desc: "Reparación, cambio o refacción sin costo.",
    detail:
      "Si procede la garantía, reparamos o sustituimos el producto según la política de la marca. Te mantenemos informado del avance en cada etapa.",
  },
] as const;

const EXCLUSIONS = [
  {
    title: "Golpes, caídas o rayones",
    desc: "Daños por impacto, caídas, golpes en traslado posterior a la entrega, rayones profundos o fracturas en madera, plástico o hardware del instrumento.",
  },
  {
    title: "Humedad, calor o almacenamiento inadecuado",
    desc: "Deformaciones, grietas o fallas por humedad, exposición al sol, cambios bruscos de temperatura o guardado sin estuche, funda o ambiente adecuado.",
  },
  {
    title: "Modificaciones o reparaciones de terceros",
    desc: "Alteraciones electrónicas, cambios de clavijero, instalación de piezas no originales o cualquier reparación hecha fuera de nuestro taller autorizado.",
  },
  {
    title: "Uso incorrecto del instrumento",
    desc: "Cuerdas de calibre inadecuado, tensión excesiva, conexión eléctrica incorrecta, sobrecarga de amplificadores o uso distinto al recomendado por el fabricante.",
  },
  {
    title: "Desgaste natural por uso",
    desc: "Trasteo desgastado, barniz opacado, cuerdas, cejillas, pads, baquetas, cables y demás componentes consumibles que se deterioran con el uso normal.",
  },
  {
    title: "Vencimiento del plazo de garantía",
    desc: "Reclamos presentados después de concluir el periodo de cobertura acordado al momento de la compra, según marca, modelo y fecha del comprobante.",
  },
] as const;

const INSTRUMENT_POLICY = {
  receptionChecks: [
    "Que el modelo y producto entregado correspondan a tu compra",
    "Que no presente golpes, rayones, fracturas o daños visibles",
    "Que todos sus accesorios y componentes estén completos y funcionando",
  ],
  exchangeConditions: [
    "Encontrarse en buenas condiciones físicas",
    "Sin señales de golpes, humedad, modificaciones o mal uso",
    "Completo: accesorios, empaque y comprobante de compra",
  ],
  serviceTimes: [
    "Tiempo promedio: 15 a 20 días hábiles",
    "Hasta 30 días según disponibilidad de piezas o tiempos del proveedor",
  ],
  exclusions: EXCLUSIONS,
} as const;

export function GarantiaPage() {
  const reduceMotion = useStableMotion();

  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-40px" },
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <>
      <SitePageHero
        breadcrumbs={finalizeBreadcrumbs([siteCrumbs.home, siteCrumbs.garantia])}
        title="Garantía"
        description="Compras tranquilo. Toda nuestra línea está respaldada por garantía oficial, servicio técnico autorizado y atención directa."
      />

      <div className="max-lg:isolate bg-white pb-16 md:pb-20">
        {/* Cobertura */}
        <section className="mx-auto max-w-7xl px-5 pt-10 md:px-8 md:pt-12">
          <div className="grid gap-5 md:grid-cols-2 md:gap-6">
            <AnimatedArticle
              reduceMotion={reduceMotion}
              {...motionProps}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 md:p-7"
            >
              <div className="flex items-center gap-3">
                <IconBadge icon={ShieldCheck} />
                <p className={siteShell.brandEyebrow}>Garantía real</p>
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold tracking-tight md:text-2xl">
                Garantía clara, con respaldo real.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Toda nuestra línea incluye garantía. La extensión depende de la marca y el modelo,
                y te confirmamos el plazo exacto antes de que pagues.
              </p>
              <ul className="mt-5 space-y-2.5 border-t border-border pt-5">
                {COVERAGE_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/85">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-copper" />
                    {item}
                  </li>
                ))}
              </ul>
            </AnimatedArticle>

            <AnimatedArticle
              reduceMotion={reduceMotion}
              {...motionProps}
              transition={{ ...(motionProps as { transition?: object }).transition, delay: 0.06 }}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 md:p-7"
            >
              <div className="flex items-center gap-3">
                <IconBadge icon={Wrench} />
                <p className={siteShell.brandEyebrow}>Por qué comprar aquí</p>
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold tracking-tight md:text-2xl">
                Respaldo que puedes comprobar
              </h2>
              <ul className="mt-5 space-y-4 border-t border-border pt-5">
                {PILLARS.map((item) => (
                  <li key={item.title} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-copper" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </AnimatedArticle>
          </div>
        </section>

        {/* Proceso */}
        <section className="mx-auto mt-14 max-w-7xl px-5 md:mt-20 md:px-8">
          <SectionIntro
            align="center"
            eyebrow="Cómo funciona"
            title="Haz válida tu garantía en 3 pasos"
            description="Un proceso claro de principio a fin. Te guiamos en cada etapa para que tu caso se resuelva con transparencia."
          />

          <div className="mt-8 grid gap-5 md:grid-cols-3 md:gap-6">
            {PROCESS_STEPS.map((s, i) => (
              <AnimatedArticle
                key={s.step}
                reduceMotion={reduceMotion}
                {...motionProps}
                transition={{ ...(motionProps as { transition?: object }).transition, delay: i * 0.06 }}
                className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 md:p-7"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-1 shrink-0 font-mono text-[11px] font-semibold tracking-wider text-copper">
                    {s.step}
                  </span>
                  <h3 className="min-w-0 font-display text-lg font-semibold tracking-tight md:text-xl">
                    {s.label}
                  </h3>
                </div>
                <p className="mt-2 text-sm font-medium text-foreground/90">{s.desc}</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {s.detail}
                </p>
              </AnimatedArticle>
            ))}
          </div>
        </section>

        {/* Guitarras y violines */}
        <section
          id="garantia-instrumentos"
          className="mx-auto mt-14 max-w-7xl px-5 md:mt-20 md:px-8"
        >
          <SectionIntro
            align="center"
            eyebrow="Instrumentos"
            title="Garantía de guitarras y violines"
            description="Política específica para instrumentos: qué revisar al recibir, cuándo aplica un cambio físico, los tiempos de servicio y las exclusiones."
          />

          <div className="mt-8 space-y-5 md:mt-10 md:space-y-6">
            <div className="grid gap-5 md:grid-cols-2 md:gap-6">
              <PolicyCard
                reduceMotion={reduceMotion}
                {...motionProps}
                icon={Guitar}
                eyebrow="Al recibir"
                title="Revisión al recibir tu producto"
                intro="Verifica tu instrumento al momento de la entrega y confirma:"
                footer="Después de recibirlo, los daños por uso, transporte posterior o mal manejo no se consideran defecto de fábrica."
              >
                <CheckList items={INSTRUMENT_POLICY.receptionChecks} />
              </PolicyCard>

              <PolicyCard
                reduceMotion={reduceMotion}
                {...motionProps}
                transition={{ ...(motionProps as { transition?: object }).transition, delay: 0.06 }}
                icon={ShieldCheck}
                eyebrow="Primeros 7 días"
                title="Cambio físico por falla de fábrica"
                intro="Si presenta una falla de fabricación dentro de los 7 días naturales tras la compra, el cambio procede si el instrumento cumple:"
              >
                <CheckList items={INSTRUMENT_POLICY.exchangeConditions} />
              </PolicyCard>
            </div>

            <div className="grid gap-5 md:grid-cols-2 md:gap-6">
              <PolicyCard
                reduceMotion={reduceMotion}
                {...motionProps}
                transition={{ ...(motionProps as { transition?: object }).transition, delay: 0.1 }}
                icon={Wrench}
                eyebrow="Tras el cambio inmediato"
                title="Proceso de garantía"
                intro="Pasados los 7 días, atendemos cada caso por el proceso de garantía: nuestro equipo técnico o el proveedor autorizado revisa el instrumento para determinar el origen de la falla."
              />

              <PolicyCard
                reduceMotion={reduceMotion}
                {...motionProps}
                transition={{ ...(motionProps as { transition?: object }).transition, delay: 0.14 }}
                icon={Clock}
                eyebrow="Tiempos"
                title="Tiempo estimado de atención"
              >
                <CheckList items={INSTRUMENT_POLICY.serviceTimes} />
              </PolicyCard>
            </div>

            <PolicyCard
              reduceMotion={reduceMotion}
              {...motionProps}
              transition={{ ...(motionProps as { transition?: object }).transition, delay: 0.18 }}
              icon={X}
              eyebrow="Exclusiones"
              title="La garantía no aplica en casos de"
              intro="Estas situaciones quedan fuera de cobertura porque no corresponden a defectos de fabricación. Si tienes duda sobre tu caso, consúltanos antes de enviar el instrumento."
              headerAlign="center"
            >
              <ExclusionList items={INSTRUMENT_POLICY.exclusions} />
            </PolicyCard>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto mt-14 max-w-7xl px-5 md:mt-20 md:px-8">
          <AnimatedDiv
            reduceMotion={reduceMotion}
            {...motionProps}
            className="overflow-hidden rounded-2xl bg-[#1a1a1a] px-6 py-10 text-white md:px-10 md:py-12"
          >
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
                Soporte
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight md:text-[1.65rem]">
                ¿Necesitas hacer válida tu garantía?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Escríbenos por WhatsApp o visita Chalco o Amecameca con tu comprobante de compra.
                Te orientamos durante todo el proceso.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row sm:flex-wrap">
                <a
                  href={whatsappHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#1a1a1a] transition-opacity hover:opacity-90 sm:w-auto"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
                <Link
                  href="/contacto#tiendas"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/25 px-6 text-sm font-medium text-white transition-colors hover:border-white/45 hover:bg-white/5 sm:w-auto"
                >
                  <MapPin className="h-4 w-4" />
                  Ver sucursales
                </Link>
              </div>
              <p className="mt-5 text-xs text-white/50">
                WhatsApp: {SITE_CONTACT.whatsapp.display}
              </p>
            </div>
          </AnimatedDiv>
        </section>
      </div>
    </>
  );
}

function PolicyCard({
  reduceMotion = false,
  icon: Icon,
  eyebrow,
  title,
  intro,
  footer,
  tone = "default",
  headerAlign = "left",
  children,
  ...motionProps
}: {
  reduceMotion?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  intro?: string;
  footer?: string;
  tone?: "default" | "muted";
  headerAlign?: "left" | "center";
  children?: React.ReactNode;
} & Record<string, unknown>) {
  const centered = headerAlign === "center";
  const className = cn(
    "flex h-full flex-col rounded-2xl border border-border p-6 md:p-7",
    tone === "muted" ? "bg-muted/30" : "bg-card",
  );

  const content = (
    <>
      <div className={cn("flex items-center gap-3", centered && "justify-center")}>
        <IconBadge icon={Icon} />
        <p className={siteShell.brandEyebrow}>{eyebrow}</p>
      </div>
      <h3
        className={cn(
          "mt-4 font-display text-lg font-semibold tracking-tight md:text-xl",
          centered && "text-center",
        )}
      >
        {title}
      </h3>
      {intro ? (
        <p
          className={cn(
            "mt-2 text-sm leading-relaxed text-muted-foreground",
            centered && "mx-auto max-w-2xl text-center",
          )}
        >
          {intro}
        </p>
      ) : null}
      {children ? (
        <div className={cn("mt-6 w-full", centered && "mt-8")}>{children}</div>
      ) : null}
      {footer ? (
        <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
          {footer}
        </p>
      ) : null}
    </>
  );

  if (reduceMotion) {
    return <article className={className}>{content}</article>;
  }

  return (
    <motion.article {...motionProps} className={className}>
      {content}
    </motion.article>
  );
}

function AnimatedArticle({
  reduceMotion,
  className,
  children,
  ...motionProps
}: {
  reduceMotion: boolean;
  className?: string;
  children: React.ReactNode;
} & Record<string, unknown>) {
  if (reduceMotion) {
    return <article className={className}>{children}</article>;
  }

  return (
    <motion.article className={className} {...motionProps}>
      {children}
    </motion.article>
  );
}

function AnimatedDiv({
  reduceMotion,
  className,
  children,
  ...motionProps
}: {
  reduceMotion: boolean;
  className?: string;
  children: React.ReactNode;
} & Record<string, unknown>) {
  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} {...motionProps}>
      {children}
    </motion.div>
  );
}

function CheckList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/85">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-copper" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function ExclusionList({
  items,
}: {
  items: readonly { title: string; desc: string }[];
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li
          key={item.title}
          className="rounded-xl border border-border/60 bg-muted/15 p-4"
        >
          <div className="flex items-start gap-2.5">
            <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
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
