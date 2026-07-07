"use client";

import {
  AlertTriangle,
  MapPin,
  ShieldCheck,
  Store,
  UserCheck,
} from "lucide-react";
import { SitePageHero } from "@/components/site/site-page-hero";
import { SiteClosingCta } from "@/components/site/site-closing-cta";
import {
  TrustBulletList,
  TrustCard,
  TrustPageBody,
  TrustRelatedLinks,
  TrustSection,
  TrustSectionIntro,
} from "@/components/trust/trust-page-primitives";
import { finalizeBreadcrumbs, siteCrumbs } from "@/lib/site/breadcrumbs";
import { CONTACT_CHANNELS, SITE_CONTACT } from "@/lib/site-contact";

const PROTECTION = [
  "Radio Shalko es una tienda física con más de 40 años en Chalco y Amecameca.",
  "La web sirve para explorar el catálogo y enviar solicitudes de compra o cotización.",
  "Tu pedido se revisa antes de confirmarse: disponibilidad, precio final y entrega.",
  "Solo debes pagar por los canales oficiales que Radio Shalko te indique para tu solicitud.",
] as const;

const OFFICIAL_CHANNELS = [
  `WhatsApp: ${SITE_CONTACT.whatsapp.display}`,
  `Correo: ${SITE_CONTACT.email}`,
  `Teléfono: ${SITE_CONTACT.phone.displayIntl}`,
  "Tiendas físicas en Valle de Chalco y Amecameca",
] as const;

const BEFORE_PAY = [
  "Verifica que la persona que te contacta represente a Radio Shalko.",
  "Confirma el monto, productos y forma de entrega antes de transferir o pagar.",
  "No deposites a cuentas que no hayan sido confirmadas dentro de tu pedido.",
  "Si tienes duda, escríbenos por WhatsApp o correo antes de pagar.",
] as const;

const AFTER_PAY = [
  "Guarda tu comprobante de pago o ticket.",
  "Espera la confirmación de Radio Shalko sobre el estado de tu pedido.",
  "Coordinamos recolección en tienda o entrega según lo acordado previamente.",
  "Si algo no coincide, contáctanos de inmediato por un canal oficial.",
] as const;

const WARNING_SIGNS = [
  "Te piden pagar a una cuenta distinta a la confirmada en tu pedido.",
  "Presionan para pagar sin confirmar disponibilidad o precio final.",
  "Te contactan desde números o correos que no coinciden con los oficiales.",
  "Prometen entrega o condiciones que no fueron validadas por Radio Shalko.",
] as const;

export function CompraSeguraPage() {
  return (
    <>
      <SitePageHero
        breadcrumbs={finalizeBreadcrumbs([siteCrumbs.home, siteCrumbs.compraSegura])}
        title="Compra segura"
        description="Radio Shalko es una tienda real, con atención personalizada. Aquí te explicamos cómo cuidamos tu compra en cada paso."
      />

      <TrustPageBody>
        <TrustSection>
          <div className="grid gap-5 md:grid-cols-2 md:gap-6">
            <TrustCard
              icon={Store}
              eyebrow="Tienda real"
              title="Más que un catálogo en línea"
              delay={0}
            >
              <p>
                Somos una tienda especializada en instrumentos y audio con presencia física en el
                Estado de México. La web te ayuda a elegir productos y enviar tu solicitud; el
                seguimiento lo hace nuestro equipo.
              </p>
              <TrustBulletList items={PROTECTION} />
            </TrustCard>

            <TrustCard
              icon={ShieldCheck}
              eyebrow="Protección"
              title="Cómo protegemos tu compra"
              delay={0.06}
            >
              <p>
                Una solicitud en línea no equivale automáticamente a una compra confirmada.
                Validamos disponibilidad, precio y condiciones antes de pedirte cualquier pago.
              </p>
              <TrustBulletList
                items={[
                  "Atención humana en cada etapa del proceso.",
                  "Historial de tienda y asesoría especializada.",
                  "Canales oficiales verificables en todo momento.",
                ]}
              />
            </TrustCard>
          </div>
        </TrustSection>

        <TrustSection className="mt-4 md:mt-6">
          <TrustSectionIntro
            eyebrow="Canales oficiales"
            title="Comunícate solo por vías confirmadas"
            description="Estos son los medios que Radio Shalko utiliza para atender solicitudes, pedidos y cotizaciones."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2 md:gap-6">
            <TrustCard icon={UserCheck} title="Medios de contacto" delay={0}>
              <TrustBulletList items={OFFICIAL_CHANNELS} />
            </TrustCard>
            <TrustCard icon={MapPin} title="Visítanos en tienda" delay={0.06}>
              <p>
                Puedes acudir a nuestras sucursales para asesoría, compra presencial o seguimiento
                de tu solicitud. Nuestro equipo conoce el catálogo y te orienta sin intermediarios.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-foreground/85">
                {SITE_CONTACT.stores.map((store) => (
                  <li key={store.id}>
                    <span className="font-medium text-foreground">{store.displayName}</span>
                    <span className="text-muted-foreground"> — {store.address}</span>
                  </li>
                ))}
              </ul>
            </TrustCard>
          </div>
        </TrustSection>

        <TrustSection className="mt-4 md:mt-6">
          <div className="grid gap-5 md:grid-cols-2 md:gap-6">
            <TrustCard title="Antes de pagar" delay={0}>
              <TrustBulletList items={BEFORE_PAY} />
            </TrustCard>
            <TrustCard title="Después de pagar" delay={0.06}>
              <TrustBulletList items={AFTER_PAY} />
            </TrustCard>
          </div>
        </TrustSection>

        <TrustSection narrow className="mt-4 md:mt-6">
          <TrustCard icon={AlertTriangle} eyebrow="Precaución" title="Señales de alerta" delay={0}>
            <p>Si algo no te parece correcto, detente y contáctanos por un canal oficial.</p>
            <TrustBulletList items={WARNING_SIGNS} />
          </TrustCard>

          <TrustRelatedLinks
            links={[
              { label: "Métodos de pago", href: "/metodos-de-pago" },
              { label: "Cómo comprar", href: "/como-comprar" },
              { label: "Contacto", href: "/contacto" },
            ]}
          />
        </TrustSection>

        <SiteClosingCta
          eyebrow="¿Tienes dudas?"
          title="Estamos para ayudarte antes de que pagues"
          description="Si necesitas confirmar un mensaje, una cuenta o el estado de tu solicitud, escríbenos. Preferimos resolver tus dudas a que pagues con incertidumbre."
          primary={{
            label: "WhatsApp oficial",
            href: CONTACT_CHANNELS[1].href,
            external: true,
          }}
          secondary={{ label: "Ver métodos de pago", href: "/metodos-de-pago" }}
        />
      </TrustPageBody>
    </>
  );
}
