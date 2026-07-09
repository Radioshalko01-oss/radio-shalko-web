"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { HERO_SLIDES } from "@/lib/data/hero-slides";
import {
  HOME_CAROUSEL_INTERVAL_MS,
  HOME_EASING,
  HOME_IMAGE_CROSSFADE_MS,
  HOME_MOBILE_FADE_TRANSITION,
} from "@/lib/site/home-motion";
import { cn } from "@/lib/utils";

const CROSSFADE_EASING = HOME_EASING;

export function Hero() {
  const [index, setIndex] = useState(0);
  const [textKey, setTextKey] = useState(0);
  const [textVisible, setTextVisible] = useState(true);
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
    }, HOME_CAROUSEL_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [slideCount]);

  useEffect(() => {
    setTextVisible(false);
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        setTextVisible(true);
      });
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
    };
  }, [textKey]);

  const activeSlide = HERO_SLIDES[index];

  const mobileTextClass = cn(
    HOME_MOBILE_FADE_TRANSITION,
    textVisible
      ? "max-md:translate-y-0 max-md:opacity-100"
      : "max-md:translate-y-3 max-md:opacity-[0.001]",
  );

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Presentación principal de Radio Shalko"
      className="hero-mobile-full relative max-md:h-[100svh] max-md:max-h-[100svh] max-md:min-h-[100svh] max-md:shrink-0 md:h-[100svh] md:min-h-[100svh] w-full overflow-hidden bg-[#111]"
    >
      <div className="absolute inset-0 max-md:h-[100svh] pointer-events-none" aria-hidden="true">
        {HERO_SLIDES.map((slide, i) => {
          const isActive = i === index;

          return (
            <div
              key={slide.id}
              className={cn(
                "absolute inset-0 max-md:h-[100svh] bg-[#111] transition-opacity motion-reduce:transition-none max-md:[-webkit-transition:opacity_var(--hero-crossfade)_cubic-bezier(0.22,1,0.36,1)]",
                isActive ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              style={{
                transitionDuration: `${HOME_IMAGE_CROSSFADE_MS}ms`,
                ["--hero-crossfade" as string]: `${HOME_IMAGE_CROSSFADE_MS}ms`,
                transitionTimingFunction: CROSSFADE_EASING,
                zIndex: isActive ? 2 : 1,
                willChange: "opacity",
              }}
            >
              <div
                className="absolute inset-0 max-md:h-[100svh] max-md:overflow-hidden hero-ken-burns-wrap md:motion-safe:animate-hero-ken-burns [transform:translateZ(0)]"
                style={
                  slide.mobileObjectPosition
                    ? ({ "--hero-object-position": slide.mobileObjectPosition } as CSSProperties)
                    : undefined
                }
              >
                <img
                  src={slide.image}
                  alt=""
                  width={1920}
                  height={1080}
                  fetchPriority={i === 0 ? "high" : "auto"}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="absolute inset-0 h-full w-full min-h-full min-w-full object-cover object-center brightness-[0.76] [backface-visibility:hidden] max-md:[object-position:var(--hero-object-position,center_center)] md:scale-100 md:animate-none"
                />
              </div>
            </div>
          );
        })}

        <div
          className="absolute inset-0 max-md:h-[100svh] bg-[#111]"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.22) 45%, rgba(0,0,0,0.5) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex h-full max-md:h-[100svh] max-md:max-h-[100svh] max-w-[820px] flex-col items-center justify-center px-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-[calc(3.5rem+1rem+env(safe-area-inset-top,0px))] text-center max-md:pointer-events-auto max-md:justify-center md:min-h-[100svh] md:px-8 md:pb-24 md:pt-28">
        <div key={textKey} className="flex w-full flex-col items-center">
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.22em] text-white md:hero-text-in md:text-xs md:motion-reduce:animate-none",
              mobileTextClass,
            )}
            style={{ animationDelay: "320ms" }}
          >
            {activeSlide.eyebrow}
          </p>

          <h1
            className={cn(
              "mt-5 max-w-[16ch] text-balance font-display text-[2rem] font-semibold leading-[1.06] tracking-[-0.03em] text-white md:hero-text-in md:mt-6 md:max-w-[15ch] md:text-[3.35rem] md:leading-[1.04] md:tracking-[-0.035em] md:motion-reduce:animate-none lg:text-[4rem]",
              mobileTextClass,
            )}
            style={{ animationDelay: "480ms" }}
          >
            {activeSlide.title}
          </h1>

          <p
            className={cn(
              "mt-5 max-w-[38ch] text-pretty text-[15px] font-normal leading-relaxed text-white/95 md:hero-text-in md:mt-6 md:max-w-[42ch] md:text-[17px] md:leading-[1.7] md:motion-reduce:animate-none",
              mobileTextClass,
            )}
            style={{ animationDelay: "620ms" }}
          >
            {activeSlide.subtitle}
          </p>

          <div
            className={cn(
              "mt-8 flex w-full max-w-[20rem] flex-col items-stretch gap-3 md:hero-text-in md:mt-10 md:items-center md:gap-3 md:motion-reduce:animate-none sm:max-w-none sm:flex-row sm:items-center sm:justify-center",
              mobileTextClass,
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
        className="absolute inset-x-0 bottom-6 z-20 flex justify-center gap-1 pb-[env(safe-area-inset-bottom)] md:bottom-10"
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
