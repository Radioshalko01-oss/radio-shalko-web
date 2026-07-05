import { Brands } from "@/components/site/brands";
import { Categories } from "@/components/site/categories";
import { FeaturedProducts } from "@/components/site/featured-products";
import { Hero } from "@/components/site/hero";
import { StoryStrip } from "@/components/site/story-strip";
import { SiteClosingCta } from "@/components/site/site-closing-cta";
import { getCatalogProducts } from "@/lib/catalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instrumentos y Audio Profesional",
  description:
    "Más de 40 años equipando músicos. Guitarras, baterías, teclados y audio profesional en Chalco y Amecameca.",
  openGraph: {
    title: "Radio Shalko · Instrumentos y Audio Profesional",
    description:
      "Catálogo premium de instrumentos y audio profesional. Asesoría personalizada, servicio técnico y garantía.",
  },
};

export default async function HomePage() {
  const products = await getCatalogProducts();

  // Novedades: productos is_new (fallback a los primeros publicados).
  const isNew = products.filter((p) => p.isNew).slice(0, 4);
  const novedades = isNew.length > 0 ? isNew : products.slice(0, 4);

  // Destacados: selección por precio (más premium) sobre lo publicado.
  const destacados = [...products].sort((a, b) => b.price - a.price).slice(0, 4);

  return (
    <>
      <Hero />
      <StoryStrip />
      <Brands />
      <FeaturedProducts novedades={novedades} destacados={destacados} />
      <Categories />
      <SiteClosingCta
        className="mt-0 pt-3 pb-14 md:pt-4 md:pb-20"
        eyebrow="40 años acompañando músicos"
        title="Tu música merece quien la entienda"
        description="En Chalco y Amecameca, músicos y técnicos te orientan con criterio para elegir el instrumento o el equipo que realmente necesitas. Escríbenos o visítanos — sin prisa, sin presión."
        secondary={{ label: "Ver catálogo", href: "/productos" }}
      />
    </>
  );
}
