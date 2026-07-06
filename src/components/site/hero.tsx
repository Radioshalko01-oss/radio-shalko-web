"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { HERO_SLIDES } from "@/lib/data/hero-slides";
import { cn } from "@/lib/utils";

const SLIDE_INTERVAL_MS = 8000;
const FADE_MS = 1400;
const CROSSFADE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

export function Hero() {
  const [index, setIndex] = useState(0);
  const [textKey, setTextKey] = useState(0);
  const slideCount = HERO_SLIDES.length;

  const goToSlide = useCallback((next: number) => {
    setIndex(next);
    setTextKey((key) => key + 1);
  }, []);

  useEffect(() => {
    const slide = HERO_SLIDES[index];
    const nextSlide = HERO_SLIDES[(index + 1) % slideCount];
    const preload = (src: string) => {
      const img = new Image();
      img.src = src;
    };
    preload(slide.image);
    if (nextSlide.image !== slide.image) preload(nextSlide.image);
  }, [index, slideCount]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => {
        const next = (current + 1) % slideCount;
        setTextKey((key) => key + 1);
        return next;
      });
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [slideCount]);

  const activeSlide = HERO_SLIDES[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Presentación principal de Radio Shalko"
      className="relative h-[100svh] min-h-[100svh] w-full overflow-hidden bg-[#111]"
    >
      <div className="absolute inset-0" aria-hidden="true">
        {HERO_SLIDES.map((slide, i) => {
          const isActive = i === index;
          const isNext = i === (index + 1) % slideCount;
          const shouldRender = isActive || isNext;

          return (
            <div
              key={slide.id}
              className={cn(
                "absolute inset-0 transition-opacity motion-reduce:transition-none",
                isActive ? "opacity-100" : "opacity-0",
              )}
              style={{
                transitionDuration: `${FADE_MS}ms`,
                transitionTimingFunction: CROSSFADE_EASING,
                zIndex: isActive ? 2 : 1,
              }}
            >
              {shouldRender ? (
                <img
                  src={slide.image}
                  alt=""
                  width={1920}
                  height={1080}
                  fetchPriority={i === 0 ? "high" : "low"}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover brightness-[0.76] motion-safe:animate-hero-ken-burns [backface-visibility:hidden] [transform:translateZ(0)]"
                />
              ) : null}
            </div>
          );
        })}

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.28) 48%, rgba(0,0,0,0.52) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 42%, rgba(0,0,0,0.26) 0%, transparent 72%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex h-full min-h-[100svh] max-w-[820px] flex-col items-center justify-center px-5 pb-20 pt-24 text-center md:px-8 md:pb-24 md:pt-28">
        <div key={textKey} className="flex w-full flex-col items-center">
          <p
            className="hero-text-in text-[11px] font-semibold uppercase tracking-[0.22em] text-white motion-reduce:animate-none md:text-xs"
            style={{ animationDelay: "320ms" }}
          >
            {activeSlide.eyebrow}
          </p>

          <h1
            className="hero-text-in mt-5 max-w-[16ch] text-balance font-display text-[2rem] font-semibold leading-[1.06] tracking-[-0.03em] text-white motion-reduce:animate-none md:mt-6 md:max-w-[15ch] md:text-[3.35rem] md:leading-[1.04] md:tracking-[-0.035em] lg:text-[4rem]"
            style={{ animationDelay: "480ms" }}
          >
            {activeSlide.title}
          </h1>

          <p
            className="hero-text-in mt-5 max-w-[38ch] text-pretty text-[15px] font-normal leading-relaxed text-white/95 motion-reduce:animate-none md:mt-6 md:max-w-[42ch] md:text-[17px] md:leading-[1.7]"
            style={{ animationDelay: "620ms" }}
          >
            {activeSlide.subtitle}
          </p>

          <div
            className="hero-text-in mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:mt-10 motion-reduce:animate-none"
            style={{ animationDelay: "760ms" }}
          >
            <Link
              href={activeSlide.primaryCta.href}
              className="inline-flex min-w-[200px] items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#111] transition-colors hover:bg-white/92 motion-reduce:transition-none"
            >
              {activeSlide.primaryCta.label}
            </Link>
            <Link
              href={activeSlide.secondaryCta.href}
              className="inline-flex min-w-[200px] items-center justify-center rounded-full border border-white/55 px-7 py-3.5 text-sm font-medium text-white transition-colors duration-300 ease-out hover:border-white hover:bg-white hover:text-[#111] focus-visible:border-white focus-visible:bg-white focus-visible:text-[#111] active:bg-white active:text-[#111] motion-reduce:transition-none"
            >
              {activeSlide.secondaryCta.label}
            </Link>
          </div>
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-8 z-20 flex justify-center gap-1 pb-[env(safe-area-inset-bottom)] md:bottom-10"
        role="tablist"
        aria-label="Seleccionar slide del hero"
      >
        {HERO_SLIDES.map((slide, i) => {
          const isActive = i === index;

          return (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Ir al slide ${i + 1}: ${slide.eyebrow}`}
              onClick={() => goToSlide(i)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full"
            >
              <span
                className={cn(
                  "block h-1 rounded-full transition-all duration-300 ease-out motion-reduce:transition-none",
                  isActive ? "w-9 bg-white" : "w-4 bg-white/40",
                )}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
