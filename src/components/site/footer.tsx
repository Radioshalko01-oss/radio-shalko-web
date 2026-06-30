"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ChevronRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import {
  SITE_CONTACT,
  mailtoHref,
  telHref,
  whatsappHref,
} from "@/lib/site-contact";

const HELP = [
  { label: "Preguntas frecuentes", to: "/servicios#preguntas-frecuentes" },
  { label: "Contacto y atención", to: "/contacto#canales" },
  { label: "Garantía y servicios", to: "/garantia#servicio-tecnico" },
  { label: "Formas de pago", to: "/servicios#formas-pago" },
  { label: "Recolección en tienda", to: "/servicios#recoleccion-tienda" },
];

const ABOUT = [
  { label: "¿Por qué Radio Shalko?", to: "/servicios#por-que-radio-shalko" },
  { label: "Nuestro catálogo", to: "/productos#catalogo" },
  { label: "Marcas oficiales", to: "/marcas#marcas" },
  { label: "Apartado de productos", to: "/servicios#apartado" },
  { label: "Otros", to: "/contacto#formulario" },
];

const LEGAL = [
  { label: "Aviso de privacidad", to: "/contacto#aviso-privacidad" },
  { label: "Términos y condiciones", to: "/contacto#terminos" },
];

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const SOCIALS = [
  {
    label: "Correo electrónico",
    href: mailtoHref(),
    external: false,
    Icon: Mail,
  },
  {
    label: "WhatsApp",
    href: whatsappHref(),
    external: true,
    Icon: IconWhatsApp,
  },
  {
    label: "Teléfono",
    href: telHref(SITE_CONTACT.phone.e164),
    external: false,
    Icon: Phone,
  },
] as const;

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <h4 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
      {children}
    </h4>
  );
}

function FooterLink({ label, to }: { label: string; to: string }) {
  return (
    <li>
      <Link
        href={to}
        className="group flex items-center justify-between gap-3 py-2.5 text-sm text-white/75 transition-colors hover:text-white"
      >
        <span>{label}</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/35 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
      </Link>
    </li>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-white selection:bg-white selection:text-[#1a1a1a]">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div>
            <Link href="/" className="inline-block transition-opacity hover:opacity-90">
              <p className="font-display text-[1.75rem] font-semibold leading-none tracking-tight text-white">
                Radio Shalko
              </p>
              <p className="mt-2 text-sm italic text-white/70">
                Make noise, make history.
              </p>
            </Link>

            <p className="mt-5 text-sm leading-relaxed text-white/70">
              Más de 40 años acompañando a músicos con instrumentos, audio profesional y
              asesoría especializada.
            </p>

            <ul className="mt-6 space-y-4 text-sm text-white/85">
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-white/90" aria-hidden />
                <div className="space-y-1 leading-relaxed text-white/80">
                  {SITE_CONTACT.footerHoursSummary.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-white/90" aria-hidden />
                <a
                  href={telHref(SITE_CONTACT.phone.e164)}
                  className="text-white/80 hover:text-white"
                >
                  {SITE_CONTACT.phone.display}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-white/90" aria-hidden />
                <a
                  href={mailtoHref()}
                  className="break-all text-white/80 hover:text-white"
                >
                  {SITE_CONTACT.email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <FooterHeading>¿Necesitas ayuda?</FooterHeading>
            <ul className="mt-5">
              {HELP.map((item) => (
                <FooterLink key={item.label} {...item} />
              ))}
            </ul>
          </div>

          <div>
            <FooterHeading>Conócenos</FooterHeading>
            <ul className="mt-5">
              {ABOUT.map((item) => (
                <FooterLink key={item.label} {...item} />
              ))}
            </ul>
          </div>

          <div>
            <FooterHeading>Contacto</FooterHeading>
            <p className="mt-5 text-sm leading-relaxed text-white/70">
              Escríbenos por WhatsApp o correo. Te respondemos en horario de tienda.
            </p>
            <a
              href={whatsappHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#1a1a1a] transition-colors hover:bg-white/90 md:w-auto"
            >
              Escribir por WhatsApp
            </a>

            <div className="mt-8">
              <FooterHeading>Síguenos</FooterHeading>
            </div>
            <ul className="mt-4 flex flex-wrap gap-3">
              {SOCIALS.map(({ label, href, external, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/10 text-white transition-all hover:border-white hover:bg-white hover:text-[#1a1a1a]"
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-white/20 pt-10 lg:mt-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start lg:gap-8">
            <div className="lg:col-span-2">
              <FooterHeading>Nuestras tiendas</FooterHeading>
            </div>

            {SITE_CONTACT.stores.map((store) => (
              <div key={store.id} className="flex gap-4 lg:col-span-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/25 bg-white/5">
                  <MapPin className="h-4 w-4 text-white/90" aria-hidden />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                    {store.displayName}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    {store.address}
                    <br />
                    {store.region}
                  </p>
                  <a
                    href={store.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 transition-colors hover:text-white"
                  >
                    Ver en mapa
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}

            <p className="text-sm leading-relaxed text-white/70 lg:col-span-4 lg:pt-1">
              Visítanos en nuestras tiendas físicas. Nuestro equipo estará encantado de
              ayudarte.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-white/20 pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-xs text-white/60">
              Radio Shalko © {new Date().getFullYear()} — Todos los derechos reservados.
            </p>

            <nav
              aria-label="Legal"
              className="flex flex-wrap items-center gap-x-1 gap-y-2 text-xs text-white/65"
            >
              {LEGAL.map((item, i) => (
                <span key={item.label} className="inline-flex items-center">
                  {i > 0 && <span className="mx-2 text-white/30" aria-hidden>|</span>}
                  <Link href={item.to} className="transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </span>
              ))}
            </nav>

            <p className="text-xs text-white/55 lg:text-right">Música · Audio · Pasión</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
