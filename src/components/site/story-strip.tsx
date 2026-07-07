"use client";

import { useEffect, useState } from "react";
import { Music, HeartHandshake, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    icon: Music,
    title: "40 años de experiencia",
    desc: "Más de cuatro décadas acompañando a músicos, artistas y nuevas generaciones con instrumentos seleccionados por su calidad, sonido y esencia.",
  },
  {
    icon: HeartHandshake,
    title: "Asesoría especializada",
    desc: "Recomendaciones honestas y personalizadas para ayudarte a encontrar el instrumento ideal según tu estilo, nivel y visión musical.",
  },
  {
    icon: Wrench,
    title: "Taller técnico profesional",
    desc: "Calibración, ajuste y mantenimiento especializado para instrumentos y equipo de audio, realizados con precisión y experiencia profesional.",
  },
] as const;

const MOBILE_INTERVAL_MS = 5000;

function BenefitItem({
  icon: Icon,
  title,
  desc,
}: {
  icon: (typeof ITEMS)[number]["icon"];
  title: string;
  desc: string;
}) {
  return (
    <div className="flex h-full flex-col items-center gap-2.5 text-center md:gap-2">
      <div className="flex items-center justify-center gap-2.5">
        <Icon className="h-[18px] w-[18px] shrink-0 text-copper" strokeWidth={1.6} aria-hidden />
        <h3 className="font-display text-base font-semibold leading-snug tracking-tight text-foreground md:text-lg">
          {title}
        </h3>
      </div>
      <p className="text-sm leading-[1.65] text-muted-foreground md:text-[15px]">{desc}</p>
    </div>
  );
}

export function StoryStrip() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % ITEMS.length);
    }, MOBILE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <section className="border-b border-border bg-background py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <ul className="hidden grid-cols-1 gap-10 sm:gap-12 md:grid md:grid-cols-3 md:gap-0 md:divide-x md:divide-border">
          {ITEMS.map((item) => (
            <li
              key={item.title}
              className="md:px-6 md:first:pl-0 md:last:pr-0 lg:px-10 lg:first:pl-0 lg:last:pr-0"
            >
              <BenefitItem {...item} />
            </li>
          ))}
        </ul>

        <div className="md:hidden">
          <div className="relative min-h-[9.5rem]">
            {ITEMS.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <div
                  key={item.title}
                  className={cn(
                    "absolute inset-x-0 top-0 transition-all duration-500 ease-out motion-reduce:transition-none",
                    isActive
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none translate-y-2 opacity-0",
                  )}
                  aria-hidden={!isActive}
                >
                  <BenefitItem {...item} />
                </div>
              );
            })}
          </div>

          <div
            className="mt-4 flex justify-center gap-1.5"
            role="tablist"
            aria-label="Beneficios de Radio Shalko"
          >
            {ITEMS.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={item.title}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={item.title}
                  onClick={() => setActiveIndex(index)}
                  className="flex min-h-8 min-w-8 items-center justify-center rounded-full"
                >
                  <span
                    className={cn(
                      "block h-1 rounded-full transition-all duration-300 motion-reduce:transition-none",
                      isActive ? "w-5 bg-copper" : "w-2 bg-border",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
