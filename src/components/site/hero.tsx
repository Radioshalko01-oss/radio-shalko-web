"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Sube este valor cuando cambies imágenes en /public/images/ para evitar caché del navegador */
const HERO_ASSET_VERSION = "20260611-v3-4k";

const heroGuitars = `/images/hero-guitars.png?v=${HERO_ASSET_VERSION}`;
const heroPianos = `/images/hero-pianos.jpg?v=${HERO_ASSET_VERSION}`;
const heroDrumkit = `/images/hero-drumkit.png?v=${HERO_ASSET_VERSION}`;

type Slide = {
  src: string;
  alt: string;
  eyebrow: string;
  title: string;
  width: number;
  height: number;
};

const SLIDES: Slide[] = [
  {
    src: heroGuitars,
    alt: "Guitarras y bajos profesionales",
    eyebrow: "Guitarras y bajos",
    title: "Lo nuevo en cuerdas",
    width: 3840,
    height: 2160,
  },
  {
    src: heroPianos,
    alt: "Teclados y sintetizadores profesionales",
    eyebrow: "Teclados y sintes",
    title: "Sonidos infinitos",
    width: 1920,
    height: 1080,
  },
  {
    src: heroDrumkit,
    alt: "Baterías acústicas profesionales",
    eyebrow: "Baterías y percusión",
    title: "El ritmo que define",
    width: 2752,
    height: 1536,
  },
];

export function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-muted">
      {SLIDES.map((slide, i) => (
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          width={slide.width}
          height={slide.height}
          fetchPriority={i === 0 ? "high" : "low"}
          loading={i === 0 ? "eager" : "lazy"}
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-in-out [backface-visibility:hidden] [transform:translateZ(0)] ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/15 to-black/55" />

      <div className="relative z-10 mx-auto h-full max-w-7xl px-5 md:px-8">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.eyebrow}
            className={`absolute inset-x-5 top-1/2 flex -translate-y-1/2 flex-col items-center text-center transition-opacity duration-700 ease-out md:inset-x-8 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-white/85">
              {slide.eyebrow}
            </p>
            <h1 className="mt-4 max-w-4xl font-display text-4xl uppercase leading-[1.05] text-white md:text-6xl lg:text-7xl">
              {slide.title}
            </h1>
            <div className="mt-8 flex items-center justify-center">
              <Link
                href="/productos"
                className="inline-flex items-center justify-center rounded-full border border-white/80 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-white transition-all hover:border-white hover:bg-white hover:text-foreground"
              >
                Ver catálogo
              </Link>
            </div>
          </div>
        ))}

        <div className="absolute inset-x-0 bottom-8 z-20 flex justify-center gap-2 md:bottom-10">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.eyebrow}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ir a slide ${i + 1}`}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === index ? "w-8 bg-white" : "w-4 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
