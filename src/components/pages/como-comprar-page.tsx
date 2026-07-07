"use client";

import { MessageSquare, ShoppingBag, Store } from "lucide-react";
import { SitePageHero } from "@/components/site/site-page-hero";
import { SiteClosingCta } from "@/components/site/site-closing-cta";
import {
  TrustCard,
  TrustFaqList,
  TrustPageBody,
  TrustRelatedLinks,
  TrustSection,
  TrustSectionIntro,
  TrustStepCard,
} from "@/components/trust/trust-page-primitives";
import { finalizeBreadcrumbs, siteCrumbs } from "@/lib/site/breadcrumbs";

const STEPS = [
  {
    step: "01",
    title: "Explora productos",
    description:
      "Navega el catálogo por categoría, marca o búsqueda. Puedes guardar favoritos y revisar fichas con detalle.",
  },
  {
    step: "02",
    title: "Agrega al carrito o cotiza",
    description:
      "Selecciona lo que te interesa. Puedes armar tu carrito o pedir orientación si necesitas una cotización personalizada.",
  },
  {
    step: "03",
    title: "Envía tus datos",
    description:
      "Completa tu solicitud con nombre, correo, teléfono y sucursal de preferencia. Necesitamos contactarte para confirmar.",
  },
  {
    step: "04",
    title: "Revisamos disponibilidad",
    description:
      "Radio Shalko verifica stock, precio final y condiciones. Si algo cambia, te lo comunicamos antes de continuar.",
  },
  {
    step: "05",
    title: "Recibes confirmación",
    description:
      "Te indicamos si tu solicitud puede avanzar, el monto acordado y los siguientes pasos. Hasta aquí no hay compra confirmada.",
  },
  {
    step: "06",
    title: "Eliges método de pago",
    description:
      "Según tu pedido, puedes pagar en tienda, por transferencia previa confirmación o mediante link seguro si está disponible.",
  },
  {
    step: "07",
    title: "Confirmamos tu pedido",
    description:
      "Una vez validado el pago o el acuerdo en tienda, tu pedido queda registrado y te informamos el estado.",
  },
  {
    step: "08",
    title: "Recoges en tienda",
    description:
      "Una vez confirmado tu pedido y el pago, pasas a recogerlo en Chalco o Amecameca. Te avisamos cuando esté listo.",
  },
] as const;

const FAQ = [
  {
    q: "¿Mi solicitud en línea ya es una compra?",
    a: "No automáticamente. Primero revisamos disponibilidad, precio y condiciones. Te confirmamos antes de pedir pago.",
  },
  {
    q: "¿Puedo comprar directamente en sucursal?",
    a: "Sí. En Chalco y Amecameca te atendemos con asesoría personalizada: puedes ver productos, recibir orientación y concretar tu compra sin usar la web.",
  },
  {
    q: "¿Hacen envíos a todo México?",
    a: "No. Por el momento no realizamos envíos. Puedes recoger tu pedido en nuestras tiendas de Chalco o Amecameca una vez confirmada tu compra.",
  },
  {
    q: "¿Puedo cotizar sin comprar de inmediato?",
    a: "Sí. Puedes solicitar orientación o cotización y decidir con calma una vez que tengas la información confirmada.",
  },
] as const;

export function ComoComprarPage() {
  return (
    <>
      <SitePageHero
        breadcrumbs={finalizeBreadcrumbs([siteCrumbs.home, siteCrumbs.comoComprar])}
        title="Cómo comprar"
        description="Un proceso claro, con acompañamiento humano. Te guiamos desde la exploración del catálogo hasta la recolección en tienda."
      />

      <TrustPageBody>
        <TrustSection>
          <TrustSectionIntro
            align="center"
            eyebrow="Paso a paso"
            title="Así funciona una compra con Radio Shalko"
            description="No somos un checkout automático. Cada solicitud pasa por revisión y confirmación de nuestro equipo."
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
            {STEPS.map((step, i) => (
              <TrustStepCard key={step.step} {...step} delay={i * 0.04} />
            ))}
          </div>
        </TrustSection>

        <TrustSection className="mt-4 md:mt-6">
          <div className="grid gap-5 md:grid-cols-3 md:gap-6">
            <TrustCard icon={Store} eyebrow="En tienda" title="Compra presencial" delay={0}>
              <p>
                Visita nuestras sucursales, prueba instrumentos con asesoría y concreta tu compra
                directamente con nuestro equipo. Ideal si prefieres ver y escuchar antes de decidir.
              </p>
            </TrustCard>
            <TrustCard
              icon={MessageSquare}
              eyebrow="A distancia"
              title="Compra remota asistida"
              delay={0.06}
            >
              <p>
                Explora en línea, envía tu solicitud y mantén el contacto por WhatsApp o correo.
                Te confirmamos todo antes de que realices cualquier pago.
              </p>
            </TrustCard>
            <TrustCard
              icon={ShoppingBag}
              eyebrow="Cotizaciones"
              title="Solicitudes y cotizaciones"
              delay={0.12}
            >
              <p>
                Si buscas un equipo específico, paquete o cantidad, podemos prepararte una
                propuesta. La cotización no obliga a comprar hasta que tú la apruebes.
              </p>
            </TrustCard>
          </div>
        </TrustSection>

        <TrustSection narrow center className="mt-4 md:mt-6">
          <TrustSectionIntro
            align="center"
            eyebrow="Preguntas frecuentes"
            title="Lo que más nos preguntan"
            description="Respuestas claras sobre solicitudes, compra en tienda y recolección."
          />
          <div className="w-full max-w-2xl">
            <TrustFaqList items={FAQ} />

            <TrustRelatedLinks
              center
              className="w-full"
              links={[
                { label: "Compra segura", href: "/compra-segura" },
                { label: "Métodos de pago", href: "/metodos-de-pago" },
                { label: "Contacto", href: "/contacto" },
              ]}
            />
          </div>
        </TrustSection>

        <SiteClosingCta
          eyebrow="¿Listo para empezar?"
          title="Explora el catálogo o escríbenos"
          description="Si ya sabes qué buscas, revisa productos. Si prefieres orientación, nuestro equipo te ayuda a elegir con confianza."
          primary={{ label: "Ver productos", href: "/productos" }}
          secondary={{ label: "Compra segura", href: "/compra-segura" }}
          footnote="Las condiciones finales se confirman antes del pago."
        />
      </TrustPageBody>
    </>
  );
}
