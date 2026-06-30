"use client";

import { Mail, MessageCircle, Phone, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { siteShell } from "@/lib/design/site-shell";
import { cn } from "@/lib/utils";
import {
  CONTACT_CHANNELS,
  SITE_CONTACT,
  telHref,
  whatsappHref,
  mailtoHref,
} from "@/lib/site-contact";

export function ContactoPage() {
  return (
    <div className="pt-28 md:pt-32">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-5 md:px-8">
        <PageHeader
          eyebrow="Contacto"
          title="Estamos a un mensaje"
          description="Resolvemos dudas, cotizamos pedidos y agendamos visitas a taller. Elige el canal que prefieras."
        />
      </section>

      {/* Two stores */}
      <section id="tiendas" className="mx-auto mt-16 max-w-7xl px-5 md:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {SITE_CONTACT.stores.map((s) => (
            <article
              key={s.id}
              className={cn(siteShell.card, "overflow-hidden transition-colors hover:border-copper/40")}
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <iframe
                  title={`Mapa ${s.name}`}
                  src={s.mapEmbedUrl}
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="p-7 md:p-9">
                <p className={siteShell.eyebrow}>Tienda</p>
                <h3 className="mt-1.5 font-display text-xl font-semibold tracking-tight md:text-2xl">
                  {s.name}
                </h3>

                <ul className="mt-6 space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-copper" />
                    <span className="text-foreground/85">{s.address}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-copper" />
                    <ul className="space-y-1 text-muted-foreground">
                      {s.hours.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  </li>
                  <li className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-copper" />
                    <a
                      href={telHref(s.phoneE164)}
                      className="text-foreground/85 hover:text-foreground"
                    >
                      {s.phoneDisplay}
                    </a>
                  </li>
                </ul>

                <div className="mt-7 flex flex-wrap gap-2">
                  <a
                    href={telHref(s.phoneE164)}
                    className={cn(siteShell.ctaDark, "px-5 py-2.5 hover:bg-copper hover:text-copper-foreground")}
                  >
                    <Phone className="h-4 w-4" /> Llamar ahora
                  </a>
                  <a
                    href={whatsappHref(s.whatsappE164)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(siteShell.ctaSecondary, "px-5 py-2.5")}
                  >
                    <MessageCircle className="h-4 w-4 text-copper" /> Enviar WhatsApp
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Channels */}
      <section id="canales" className="mx-auto mt-20 max-w-7xl px-5 md:px-8">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
          {CONTACT_CHANNELS.map((c) => {
            const Icon =
              c.id === "phone" ? Phone : c.id === "whatsapp" ? MessageCircle : Mail;
            return (
              <a
                key={c.id}
                href={c.href}
                target={c.id === "email" ? undefined : "_blank"}
                rel={c.id === "email" ? undefined : "noopener noreferrer"}
                className="group bg-card p-7 transition-colors hover:bg-muted md:p-8"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl border border-copper/30 bg-copper/10 text-copper transition-all group-hover:bg-copper group-hover:text-copper-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {c.label}
                </div>
                <div className="mt-2 font-display text-xl font-medium md:text-2xl">{c.value}</div>
              </a>
            );
          })}
        </div>
      </section>

      {/* Contacto directo (sin formulario simulado) */}
      <section id="formulario" className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <div className="grid gap-12 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className={siteShell.eyebrow}>Escríbenos</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Cuéntanos qué necesitas
            </h2>
            <p className="mt-3 max-w-md text-sm text-muted-foreground md:text-base">
              Asesoría sobre productos, instrumentos o agenda de servicio técnico. Te
              respondemos en horario de tienda por WhatsApp o correo.
            </p>
          </div>

          <div className={cn(siteShell.card, "p-7 md:p-10")}>
            <p className="text-sm text-muted-foreground">
              Atendemos por WhatsApp y correo electrónico. Recibes respuesta directa de nuestro
              equipo en horario de tienda.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                asChild
                className="h-12 rounded-full bg-foreground px-6 text-background hover:bg-copper hover:text-copper-foreground"
              >
                <a href={whatsappHref()} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  Consultar por WhatsApp
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-full px-6"
              >
                <a href={mailtoHref()}>
                  <Mail className="h-4 w-4" />
                  Enviar correo
                </a>
              </Button>
            </div>
            <p className="mt-4 text-[11px] text-muted-foreground">
              También puedes visitarnos en{" "}
              <a href="#tiendas" className="text-foreground underline-offset-2 hover:underline">
                Chalco o Amecameca
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Legal */}
      <section className="border-t border-border bg-muted/30 py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-2 md:px-8">
          <article id="aviso-privacidad">
            <h2 className="font-display text-xl font-semibold tracking-tight md:text-2xl">
              Aviso de privacidad
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Radio Shalko utiliza tus datos únicamente para responder solicitudes, procesar
              pedidos y mejorar nuestro servicio. No compartimos tu información con terceros sin
              tu consentimiento. Puedes solicitar acceso, rectificación o cancelación escribiendo a{" "}
              <a
                href={mailtoHref()}
                className="text-foreground underline-offset-2 hover:underline"
              >
                {SITE_CONTACT.email}
              </a>
              .
            </p>
          </article>
          <article id="terminos">
            <h2 className="font-display text-xl font-semibold tracking-tight md:text-2xl">
              Términos y condiciones
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Las compras, apartados y servicios técnicos se rigen por las políticas publicadas en
              tienda y en este sitio. Los precios pueden cambiar sin previo aviso. La garantía
              aplica según las condiciones de cada marca y producto adquirido.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
