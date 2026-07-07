"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { HERO_SLIDES } from "@/lib/data/hero-slides";
import { cn } from "@/lib/utils";

const SLIDE_INTERVAL_MS = 8000;
const CROSSFADE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

export function Hero() {
  const [index, setIndex] = useState(0);
  const [textKey, setTextKey] = useState(0);
  const [textVisible, setTextVisible] = useState(true);
  const skipTextFadeRef = useRef(true);
  const slideCount = HERO_SLIDES.length;

  const goToSlide = useCallback((next: number) => {
    setIndex(next);
    setTextKey((key) => key + 1);
  }, []);

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

  useEffect(() => {
    if (skipTextFadeRef.current) {
      skipTextFadeRef.current = false;
      return;
    }
    setTextVisible(false);
    const id = window.setTimeout(() => setTextVisible(true), 140);
    return () => window.clearTimeout(id);
  }, [index]);

  const activeSlide = HERO_SLIDES[index];

  const mobileTextMotion = cn(
    "max-md:transition-all max-md:duration-[650ms] max-md:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:max-md:transition-none",
    textVisible
      ? "max-md:translate-y-0 max-md:opacity-100"
      : "max-md:translate-y-3 max-md:opacity-0",
  );

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
                "absolute inset-0 transition-opacity motion-reduce:transition-none max-md:duration-[1800ms] md:duration-[1400ms]",
                isActive ? "opacity-100" : "opacity-0",
              )}
              style={{
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
                  fetchPriority={isActive && index === 0 ? "high" : "auto"}
                  loading={isActive ? "eager" : "lazy"}
                  decoding="async"
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover brightness-[0.76] [backface-visibility:hidden] [transform:translateZ(0)]",
                    "max-md:object-[center_36%] max-md:transition-transform max-md:duration-[7000ms] max-md:ease-out motion-reduce:max-md:transition-none",
                    isActive ? "max-md:scale-[1.05]" : "max-md:scale-100",
                    "md:motion-safe:animate-hero-ken-burns",
                  )}
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

      <div className="relative z-10 mx-auto flex h-full min-h-[100svh] max-w-[820px] flex-col items-center justify-center px-5 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-[calc(3.5rem+2rem)] text-center max-md:justify-center md:px-8 md:pb-24 md:pt-28">
        <div key={textKey} className="flex w-full flex-col items-center">
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.22em] text-white md:hero-text-in md:text-xs md:motion-reduce:animate-none",
              mobileTextMotion,
            )}
            style={{ animationDelay: "320ms" }}
          >
            {activeSlide.eyebrow}
          </p>

          <h1
            className={cn(
              "mt-5 max-w-[16ch] text-balance font-display text-[2rem] font-semibold leading-[1.06] tracking-[-0.03em] text-white md:hero-text-in md:mt-6 md:max-w-[15ch] md:text-[3.35rem] md:leading-[1.04] md:tracking-[-0.035em] md:motion-reduce:animate-none lg:text-[4rem]",
              mobileTextMotion,
            )}
            style={{ animationDelay: "480ms" }}
          >
            {activeSlide.title}
          </h1>

          <p
            className={cn(
              "mt-5 max-w-[38ch] text-pretty text-[15px] font-normal leading-relaxed text-white/95 md:hero-text-in md:mt-6 md:max-w-[42ch] md:text-[17px] md:leading-[1.7] md:motion-reduce:animate-none",
              mobileTextMotion,
            )}
            style={{ animationDelay: "620ms" }}
          >
            {activeSlide.subtitle}
          </p>

          <div
            className={cn(
              "mt-8 flex w-full max-w-[20rem] flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center md:hero-text-in md:mt-10 md:items-center md:gap-3 md:motion-reduce:animate-none",
              mobileTextMotion,
            )}
            style={{ animationDelay: "760ms" }}
          >
            <Link
              href={activeSlide.primaryCta.href}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#111] transition-colors hover:bg-white/92 motion-reduce:transition-none sm:min-w-[200px] sm:w-auto"
            >
              {activeSlide.primaryCta.label}
            </Link>
            <Link
              href={activeSlide.secondaryCta.href}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/55 px-7 py-3.5 text-sm font-medium text-white transition-colors duration-300 ease-out hover:border-white hover:bg-white hover:text-[#111] focus-visible:border-white focus-visible:bg-white focus-visible:text-[#111] active:bg-white active:text-[#111] motion-reduce:transition-none sm:min-w-[200px] sm:w-auto"
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
