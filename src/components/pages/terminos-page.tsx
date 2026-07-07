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
    title: "1. Uso del sitio",
    body: [
      "Este sitio web es operado por Radio Shalko para mostrar productos, servicios e información de contacto.",
      "Al usarlo, aceptas hacerlo de forma responsable y conforme a la legislación aplicable.",
      "Podemos actualizar contenidos, precios y disponibilidad sin previo aviso en el catálogo digital.",
    ],
  },
  {
    title: "2. Naturaleza del catálogo",
    body: [
      "Las fichas de producto son referencia informativa. Imágenes, especificaciones y precios pueden variar.",
      "La disponibilidad mostrada en línea no garantiza stock inmediato hasta confirmación de Radio Shalko.",
    ],
  },
  {
    title: "3. Solicitudes y confirmación",
    body: [
      "Enviar una solicitud de compra, cotización o carrito no equivale automáticamente a una compra confirmada.",
      "Radio Shalko revisa cada solicitud y te contacta para confirmar disponibilidad, precio final y condiciones.",
      "Hasta recibir esa confirmación, no debes considerar cerrada ninguna operación.",
    ],
  },
  {
    title: "4. Precios y pagos",
    body: [
      "Los precios publicados pueden estar sujetos a validación final según promociones, tipo de cambio o disponibilidad.",
      "Los pagos deben realizarse únicamente por los métodos y canales oficiales que Radio Shalko indique para tu pedido.",
      "Un pedido se considera avanzado una vez confirmado el pago o el acuerdo presencial según corresponda.",
    ],
  },
  {
    title: "5. Entrega y recolección",
    body: [
      "La recolección en tienda está sujeta a horarios de sucursal y confirmación de pedido.",
      "Cualquier entrega fuera de tienda se coordina según disponibilidad, zona y confirmación previa.",
    ],
  },
  {
    title: "6. Garantías, cambios y devoluciones",
    body: [
      "Las garantías aplican según política de cada marca y las condiciones informadas al momento de la compra.",
      "Cambios, devoluciones o aclaraciones se revisan caso por caso conforme a nuestras políticas publicadas y la normativa aplicable.",
      "Para más detalle sobre garantía, consulta la sección de Garantía del sitio o contáctanos.",
    ],
  },
  {
    title: "7. Responsabilidad del usuario",
    body: [
      "Eres responsable de proporcionar datos de contacto correctos y de verificar la información de tu pedido.",
      "Debes proteger el acceso a tu cuenta cuando uses inicio de sesión en el sitio.",
    ],
  },
  {
    title: "8. Propiedad intelectual",
    body: [
      "El contenido del sitio — textos, imágenes, diseño y marca — pertenece a Radio Shalko o a sus respectivos titulares.",
      "No está permitida su reproducción no autorizada con fines comerciales.",
    ],
  },
  {
    title: "9. Contacto",
    body: [
      `Para dudas sobre estos términos, escríbenos a ${SITE_CONTACT.email} o por los canales oficiales publicados en Contacto.`,
    ],
  },
] as const;

export function TerminosPage() {
  return (
    <>
      <SitePageHero
        breadcrumbs={finalizeBreadcrumbs([siteCrumbs.home, siteCrumbs.terminos])}
        title="Términos y condiciones"
        description="Información clara sobre el uso del sitio, las solicitudes de compra y las condiciones generales de Radio Shalko."
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
            Este documento es una versión informativa inicial y puede actualizarse. Para casos
            específicos, comunícate con Radio Shalko a través de los canales oficiales publicados
            en el sitio.
          </TrustDisclaimer>

          <TrustRelatedLinks
            links={[
              { label: "Aviso de privacidad", href: "/aviso-de-privacidad" },
              { label: "Compra segura", href: "/compra-segura" },
              { label: "Cómo comprar", href: "/como-comprar" },
            ]}
          />
        </TrustSection>

        <SiteClosingCta
          eyebrow="¿Alguna duda?"
          title="Estamos disponibles para aclarar"
          description="Si necesitas orientación sobre una solicitud, pedido o condición específica, contáctanos directamente."
          primary={{
            label: "Escríbenos por correo",
            href: mailtoHref(),
            external: true,
          }}
          secondary={{ label: "Contacto", href: "/contacto" }}
        />
      </TrustPageBody>
    </>
  );
}
