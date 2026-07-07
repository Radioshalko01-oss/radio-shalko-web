"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Mail, MessageCircle, Phone, MapPin, Clock, ArrowUpRight } from "lucide-react";
import { SitePageHero } from "@/components/site/site-page-hero";
import { finalizeBreadcrumbs, siteCrumbs } from "@/lib/site/breadcrumbs";
import { siteShell } from "@/lib/design/site-shell";
import { cn } from "@/lib/utils";
import { SITE_CONTACT, telHref, whatsappHref, mailtoHref } from "@/lib/site-contact";

const WHATSAPP_E164 = SITE_CONTACT.whatsapp.e164;

export function ContactoPage() {
  const reduceMotion = useReducedMotion();
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
        breadcrumbs={finalizeBreadcrumbs([siteCrumbs.home, siteCrumbs.contacto])}
        title="Contacto"
        description="Estamos a un mensaje. Resolvemos dudas, cotizamos pedidos y agendamos visitas a taller."
      />

      <div className="pb-16 md:pb-20">
        {/* Tiendas */}
        <section id="tiendas" className="mx-auto max-w-7xl px-5 pt-10 md:px-8 md:pt-12">
          <SectionIntro
            align="center"
            eyebrow="Nuestras tiendas"
            title="Visítanos en Chalco o Amecameca"
            description="Dos sucursales en el Estado de México. Mapa, horarios y contacto directo de cada tienda."
          />

          <div className="mt-8 grid gap-6 md:grid-cols-2 md:gap-8">
            {SITE_CONTACT.stores.map((store, index) => (
              <motion.article
                key={store.id}
                {...motionProps}
                transition={{ ...motionProps.transition, delay: index * 0.06 }}
                className="overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-copper/35"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  <iframe
                    title={`Mapa ${store.name}`}
                    src={store.mapEmbedUrl}
                    className="h-full w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                <div className="p-6 md:p-7">
                  <p className={siteShell.brandEyebrow}>Tienda</p>
                  <h3 className="mt-1 font-display text-xl font-semibold tracking-tight md:text-2xl">
                    {store.name}
                  </h3>

                  <ul className="mt-5 space-y-3 border-t border-border pt-5 text-sm">
                    <li className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-copper" />
                      <span className="text-foreground/85">{store.address}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-copper" />
                      <ul className="space-y-1 text-muted-foreground">
                        {store.hours.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                    </li>
                    <li className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-copper" />
                      <a
                        href={telHref(store.phoneE164)}
                        className="font-medium text-foreground/85 transition-colors hover:text-copper"
                      >
                        {store.phoneDisplay}
                      </a>
                    </li>
                    <li className="flex items-start gap-3">
                      <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-copper" />
                      <a
                        href={whatsappHref(WHATSAPP_E164)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-foreground/85 transition-colors hover:text-copper"
                      >
                        {SITE_CONTACT.whatsapp.display}
                      </a>
                    </li>
                  </ul>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <a
                      href={telHref(store.phoneE164)}
                      className={cn(siteShell.ctaDark, "gap-2 px-5 py-2.5 text-sm hover:bg-copper hover:text-copper-foreground")}
                    >
                      <Phone className="h-4 w-4" />
                      Llamar ahora
                    </a>
                    <a
                      href={whatsappHref(WHATSAPP_E164)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(siteShell.ctaSecondary, "gap-2 px-5 py-2.5 text-sm")}
                    >
                      <MessageCircle className="h-4 w-4 text-copper" />
                      Enviar WhatsApp
                    </a>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Escríbenos */}
        <section id="formulario" className="mx-auto mt-12 max-w-7xl px-5 md:mt-14 md:px-8">
          <motion.div
            {...motionProps}
            className="overflow-hidden rounded-2xl bg-[#1a1a1a] px-6 py-10 text-white md:px-10 md:py-12"
          >
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
                Escríbenos
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight md:text-[1.65rem]">
                Cuéntanos qué necesitas
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Asesoría sobre productos, instrumentos o agenda de servicio técnico. Te respondemos
                en horario de tienda.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row sm:flex-wrap">
                <a
                  href={whatsappHref(WHATSAPP_E164)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#1a1a1a] transition-opacity hover:opacity-90 sm:w-auto"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
                <a
                  href={telHref(SITE_CONTACT.phone.e164)}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/25 px-6 text-sm font-medium text-white transition-colors hover:border-white/45 hover:bg-white/5 sm:w-auto"
                >
                  <Phone className="h-4 w-4" />
                  {SITE_CONTACT.phone.displayIntl}
                </a>
                <a
                  href={mailtoHref()}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/25 px-6 text-sm font-medium text-white transition-colors hover:border-white/45 hover:bg-white/5 sm:w-auto"
                >
                  <Mail className="h-4 w-4" />
                  Correo
                </a>
              </div>
              <p className="mt-5 text-xs text-white/50">
                También puedes visitarnos en{" "}
                <Link
                  href="#tiendas"
                  className="text-white/75 underline-offset-2 transition-colors hover:text-white hover:underline"
                >
                  Chalco o Amecameca
                </Link>
              </p>
            </div>
          </motion.div>
        </section>

        {/* Legal */}
        <section className="mx-auto mt-12 max-w-7xl px-5 md:mt-14 md:px-8">
          <motion.div {...motionProps} className="mx-auto max-w-2xl text-center">
            <p className={siteShell.brandEyebrow}>Legal</p>
            <h2 className="mt-3 font-display text-xl font-semibold tracking-tight md:text-2xl">
              Información legal y de privacidad
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Consulta nuestras políticas completas en las páginas dedicadas. Para dudas sobre
              compras, pagos o privacidad, también puedes escribirnos a{" "}
              <a
                href={mailtoHref()}
                className="font-medium text-foreground underline-offset-2 hover:text-copper hover:underline"
              >
                {SITE_CONTACT.email}
              </a>
              .
            </p>
          </motion.div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3 md:mt-8 md:gap-5">
            {[
              {
                href: "/aviso-de-privacidad",
                title: "Aviso de privacidad",
                description: "Cómo usamos y protegemos tus datos personales.",
              },
              {
                href: "/terminos-y-condiciones",
                title: "Términos y condiciones",
                description: "Condiciones de compra, apartados y servicios.",
              },
              {
                href: "/compra-segura",
                title: "Compra segura",
                description: "Cómo funciona la solicitud, confirmación y pago.",
              },
            ].map((card, index) => (
              <motion.article
                key={card.href}
                {...motionProps}
                transition={{ ...motionProps.transition, delay: index * 0.05 }}
                className="rounded-2xl border border-border bg-card p-5 md:p-6"
              >
                <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
                <Link
                  href={card.href}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-copper"
                >
                  Ver más
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </motion.article>
            ))}
          </div>
        </section>
      </div>
    </>
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

