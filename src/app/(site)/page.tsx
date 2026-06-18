import { Brands } from "@/components/site/brands";
import { Categories } from "@/components/site/categories";
import { FeaturedProducts } from "@/components/site/featured-products";
import { Hero } from "@/components/site/hero";
import { StoryStrip } from "@/components/site/story-strip";
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

export default function HomePage() {
  return (
    <>
      <Hero />
      <StoryStrip />
      <Brands />
      <FeaturedProducts />
      <Categories />
    </>
  );
}
