import { catalogHref } from "@/lib/navigation/catalog-taxonomy";

export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  image: string;
  alt: string;
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "radio-shalko",
    eyebrow: "Estudio · instrumentos · audio",
    title: "Instrumentos y audio profesional para crear sin límites",
    subtitle:
      "Más de 40 años acompañando a músicos, estudios y profesionales con equipo seleccionado, calidad y experiencia.",
    primaryCta: { label: "Explorar catálogo", href: "/productos" },
    secondaryCta: { label: "Conocer la tienda", href: "/contacto" },
    image: "/images/hero/hero-radio-shalko-premium.webp",
    alt: "Instrumentos musicales premium en estudio editorial",
  },
  {
    id: "instrumentos",
    eyebrow: "Guitarras, teclados y baterías",
    title: "Todo para llevar tu música al siguiente nivel",
    subtitle:
      "Encuentra instrumentos cuidadosamente seleccionados para tocar, grabar, practicar y presentarte con confianza.",
    primaryCta: {
      label: "Ver instrumentos",
      href: catalogHref({ cat: "Instrumentos" }),
    },
    secondaryCta: { label: "Explorar categorías", href: "/#categorias" },
    image: "/images/hero/hero-instrumentos-premium.webp",
    alt: "Guitarras, teclados y baterías profesionales",
  },
  {
    id: "audio-accesorios",
    eyebrow: "Audio, accesorios y equipo profesional",
    title: "Todo el audio profesional para completar tu setup",
    subtitle:
      "Micrófonos, interfaces, audífonos, cables y accesorios para completar tu setup con calidad profesional.",
    primaryCta: {
      label: "Ver accesorios",
      href: catalogHref({ cat: "Accesorios" }),
    },
    secondaryCta: {
      label: "Equipo de audio",
      href: catalogHref({ cat: "Equipos de Audio" }),
    },
    image: "/images/hero/hero-audio-accesorios-premium.webp",
    alt: "Accesorios y equipo de audio profesional",
  },
];
