"use client";

import { Banknote, Lock, Store } from "lucide-react";
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

const IN_STORE = [
  "Paga directamente en nuestras tiendas de Chalco o Amecameca.",
  "Recibe asesoría y comprobante al momento de tu compra.",
  "Ideal si prefieres ver el producto antes de pagar.",
] as const;

const SPEI = [
  "La transferencia o SPEI solo aplica cuando Radio Shalko te confirme los datos oficiales.",
  "No deposites hasta recibir instrucciones vinculadas a tu pedido o solicitud.",
  "Verifica nombre del beneficiario, CLABE o cuenta y monto antes de transferir.",
  "Envía tu comprobante únicamente por los canales oficiales que te indiquemos.",
] as const;

const PROCESS = [
  "No hay pago automático en línea en el sitio web.",
  "Radio Shalko confirma disponibilidad, precio y garantía antes de pedir el pago.",
  "Recibirás instrucciones oficiales por los canales que acordemos contigo.",
  "La compra se confirma hasta que validemos tu pago.",
  "La entrega y recolección es en nuestras tiendas físicas de Chalco o Amecameca.",
] as const;

const SECURITY = [
  "No compartas datos bancarios sensibles por mensajes no oficiales.",
  "No envíes comprobantes a números o correos que no reconozcas como Radio Shalko.",
  "Desconfía de presiones para pagar sin confirmación de pedido.",
  "Ante cualquier duda, contacta primero por WhatsApp o correo oficial.",
] as const;

export function MetodosDePagoPage() {
  return (
    <>
      <SitePageHero
        breadcrumbs={finalizeBreadcrumbs([siteCrumbs.home, siteCrumbs.metodosDePago])}
        title="Métodos de pago"
        description="Transferencia bancaria y pago presencial en tienda, siempre con confirmación previa de Radio Shalko. Nunca pagues sin validar tu pedido."
      />

      <TrustPageBody>
        <TrustSection>
          <div className="grid gap-5 md:grid-cols-2 md:gap-6">
            <TrustCard icon={Store} eyebrow="Presencial" title="Pago en tienda Chalco" delay={0}>
              <p>
                Puedes pagar en persona en Radio Shalko Chalco una vez que confirmemos
                disponibilidad, precio y garantía de tu pedido.
              </p>
              <TrustBulletList items={IN_STORE} />
            </TrustCard>

            <TrustCard
              icon={Store}
              eyebrow="Presencial"
              title="Pago en tienda Amecameca"
              delay={0.06}
            >
              <p>
                También puedes concretar tu pago en Radio Shalko Amecameca con asesoría
                personalizada y comprobante al momento.
              </p>
              <TrustBulletList items={IN_STORE} />
            </TrustCard>
          </div>
        </TrustSection>

        <TrustSection className="mt-4 md:mt-6">
          <div className="grid gap-5 md:grid-cols-2 md:gap-6">
            <TrustCard icon={Banknote} eyebrow="Transferencia" title="SPEI / transferencia bancaria" delay={0}>
              <p>
                Cuando aplique, te compartimos los datos oficiales para transferir. Este método
                requiere confirmación explícita de Radio Shalko; no está automatizado en el sitio.
              </p>
              <TrustBulletList items={SPEI} />
            </TrustCard>

            <TrustCard icon={Lock} eyebrow="Proceso" title="Cómo funciona el pago" delay={0.06}>
              <TrustBulletList items={PROCESS} />
            </TrustCard>
          </div>
        </TrustSection>

        <TrustSection className="mt-4 md:mt-6">
          <TrustCard icon={Lock} eyebrow="Seguridad" title="Recomendaciones importantes" delay={0} center>
            <TrustBulletList center items={SECURITY} />
          </TrustCard>
        </TrustSection>

        <TrustSection narrow center className="mt-4 md:mt-6">
          <TrustSectionIntro
            align="center"
            eyebrow="Recuerda"
            title="Solo paga cuando tu pedido esté confirmado"
            description="Los métodos disponibles son transferencia bancaria y pago presencial en Chalco o Amecameca. Si algo cambia, te lo decimos antes de que pagues."
          />

          <TrustRelatedLinks
            center
            className="w-full max-w-2xl"
            links={[
              { label: "Cómo comprar", href: "/como-comprar" },
              { label: "Compra segura", href: "/compra-segura" },
              { label: "Términos y condiciones", href: "/terminos-y-condiciones" },
            ]}
          />
        </TrustSection>

        <SiteClosingCta
          eyebrow="Antes de transferir"
          title="¿Ya tienes instrucciones de pago?"
          description="Si aún no has recibido confirmación oficial de Radio Shalko, escríbenos antes de pagar. Preferimos aclarar todo contigo."
          primary={{ label: "Cómo comprar", href: "/como-comprar" }}
          secondary={{ label: "Compra segura", href: "/compra-segura" }}
        />
      </TrustPageBody>
    </>
  );
}
