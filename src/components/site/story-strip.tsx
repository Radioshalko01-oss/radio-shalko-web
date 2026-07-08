"use client";

import { useEffect, useState } from "react";
import { Music, HeartHandshake, Wrench } from "lucide-react";
import { HOME_CAROUSEL_INTERVAL_MS, HOME_TOUCH_FADE_TRANSITION } from "@/lib/site/home-motion";
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

function BenefitItem({
  icon: Icon,
  title,
  desc,
  compact = false,
}: {
  icon: (typeof ITEMS)[number]["icon"];
  title: string;
  desc: string;
  compact?: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center gap-1.5 text-center md:gap-2">
      <div className="flex items-center justify-center gap-2">
        <Icon className="h-[18px] w-[18px] shrink-0 text-copper" strokeWidth={1.6} aria-hidden />
        <h3
          className={cn(
            "font-display font-semibold leading-snug tracking-tight text-foreground",
            compact ? "text-[15px]" : "text-base md:text-lg",
          )}
        >
          {title}
        </h3>
      </div>
      <p
        className={cn(
          "leading-snug text-muted-foreground",
          compact ? "line-clamp-2 text-[13px] md:line-clamp-3 md:text-sm" : "text-sm leading-[1.65] md:text-[15px]",
        )}
      >
        {desc}
      </p>
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
    }, HOME_CAROUSEL_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <section className="border-b border-border bg-background py-5 md:py-8 lg:py-12">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <ul className="hidden grid-cols-1 gap-10 sm:gap-12 xl:grid xl:grid-cols-3 xl:gap-0 xl:divide-x xl:divide-border">
          {ITEMS.map((item) => (
            <li
              key={item.title}
              className="xl:px-6 xl:first:pl-0 xl:last:pr-0 2xl:px-10 2xl:first:pl-0 2xl:last:pr-0"
            >
              <BenefitItem {...item} />
            </li>
          ))}
        </ul>

        <div className="xl:hidden">
          <div className="relative min-h-[5.5rem] md:min-h-[6.5rem]">
            {ITEMS.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <div
                  key={item.title}
                  className={cn(
                    "absolute inset-x-0 top-0",
                    HOME_TOUCH_FADE_TRANSITION,
                    isActive
                      ? "z-10 opacity-100"
                      : "pointer-events-none invisible z-0 opacity-0",
                  )}
                  aria-hidden={!isActive}
                >
                  <BenefitItem {...item} compact />
                </div>
              );
            })}
          </div>

          <div
            className="mt-2 flex justify-center gap-1.5 md:mt-3"
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
                      isActive ? "w-6 bg-copper md:w-7" : "w-2 bg-border",
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
