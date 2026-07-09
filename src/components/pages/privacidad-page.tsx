"use client";

import { SitePageHero } from "@/components/site/site-page-hero";
import { SiteClosingCta } from "@/components/site/site-closing-cta";
import {
  TrustDisclaimer,
  TrustPageBody,
  TrustProseBlock,
  TrustRelatedLinks,
  TrustSection,
} from "@/components/trust/trust-page-primitives";
import { finalizeBreadcrumbs, siteCrumbs } from "@/lib/site/breadcrumbs";
import { mailtoHref, SITE_CONTACT } from "@/lib/site-contact";

const SECTIONS = [
  {
    title: "1. Responsable del tratamiento",
    body: [
      "Radio Shalko, con tiendas físicas en el Estado de México, es responsable del tratamiento de los datos personales que nos proporciones a través de este sitio, por correo, WhatsApp, teléfono o en tienda.",
    ],
  },
  {
    title: "2. Datos que podemos recopilar",
    body: [
      "Nombre y apellidos.",
      "Correo electrónico.",
      "Número de teléfono o WhatsApp.",
      "Información relacionada con solicitudes, cotizaciones y pedidos.",
      "Sucursal de preferencia o datos de entrega, cuando aplique.",
      "Información de cuenta si inicias sesión en el sitio (por ejemplo, correo vinculado a Google).",
    ],
  },
  {
    title: "3. Finalidad del tratamiento",
    body: [
      "Atender solicitudes de compra, cotizaciones y consultas.",
      "Dar seguimiento a pedidos y comunicarte actualizaciones.",
      "Coordinar pagos, recolección en tienda o entrega según lo acordado.",
      "Brindar servicio al cliente y soporte postventa.",
      "Mejorar la experiencia del sitio y la comunicación contigo.",
    ],
  },
  {
    title: "4. Uso y conservación",
    body: [
      "Utilizamos tus datos únicamente para las finalidades descritas y mientras sean necesarios para atender tu relación con Radio Shalko.",
      "No vendemos ni comercializamos tus datos personales.",
      "Podemos compartir información únicamente cuando sea necesario para procesar un pedido (por ejemplo, proveedores logísticos o plataformas de pago autorizadas) y bajo obligaciones de confidencialidad razonables.",
    ],
  },
  {
    title: "5. Seguridad",
    body: [
      "Aplicamos medidas técnicas y organizativas razonables para proteger tu información.",
      "Ningún sistema en internet es 100% infalible; te recomendamos no compartir contraseñas ni datos sensibles por canales no oficiales.",
    ],
  },
  {
    title: "6. Derechos ARCO",
    body: [
      "Puedes solicitar acceso, rectificación, cancelación u oposición al tratamiento de tus datos personales, así como revocar consentimientos cuando proceda.",
      "Para ejercer estos derechos, contáctanos por los canales oficiales indicados abajo. Responderemos conforme a los plazos aplicables.",
    ],
  },
  {
    title: "7. Cookies y tecnologías similares",
    body: [
      "El sitio puede utilizar cookies o tecnologías similares para funcionamiento, preferencias y analítica básica.",
      "Puedes configurar tu navegador para limitar cookies; algunas funciones del sitio podrían verse afectadas.",
    ],
  },
  {
    title: "8. Contacto de privacidad",
    body: [
      `Correo: ${SITE_CONTACT.email}`,
      `WhatsApp: ${SITE_CONTACT.whatsapp.display}`,
      "También puedes acudir a nuestras tiendas físicas en Chalco o Amecameca.",
    ],
  },
] as const;

export function PrivacidadPage() {
  return (
    <>
      <SitePageHero
        breadcrumbs={finalizeBreadcrumbs([siteCrumbs.home, siteCrumbs.privacidad])}
        title="Aviso de privacidad"
        description="Cómo recopilamos, usamos y protegemos tu información cuando interactúas con Radio Shalko."
      />

      <TrustPageBody>
        <TrustSection narrow>
          <div className="space-y-4">
            {SECTIONS.map((section, i) => (
              <TrustProseBlock key={section.title} title={section.title} delay={i * 0.03}>
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </TrustProseBlock>
            ))}
          </div>

          <TrustDisclaimer>
            Este aviso es una versión informativa inicial y puede actualizarse. Para consultas
            específicas sobre privacidad, comunícate con Radio Shalko por los canales oficiales
            publicados en este sitio.
          </TrustDisclaimer>

          <TrustRelatedLinks
            links={[
              { label: "Términos y condiciones", href: "/terminos-y-condiciones" },
              { label: "Compra segura", href: "/compra-segura" },
              { label: "Contacto", href: "/contacto" },
            ]}
          />
        </TrustSection>

        <SiteClosingCta
          eyebrow="Privacidad"
          title="¿Quieres ejercer tus derechos?"
          description="Escríbenos con tu solicitud y te orientamos sobre los siguientes pasos."
          primary={{
            label: "Correo de privacidad",
            href: mailtoHref(),
            external: true,
          }}
          secondary={{ label: "Contacto", href: "/contacto" }}
        />
      </TrustPageBody>
    </>
  );
}
