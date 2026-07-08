"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BRANDS_MARQUEE_SECONDS,
  nodeContains,
} from "@/lib/site/home-motion";

const behringer = "/images/brands/behringer.png";
const yamaha = "/images/brands/yamaha.png";
const casio = "/images/brands/casio.png";
const shure = "/images/brands/shure.png";
const ibanez = "/images/brands/ibanez.png";
const extreme = "/images/brands/extreme.png";
const century = "/images/brands/century.png";
const mccartney = "/images/brands/mccartney.png";
const segovia = "/images/brands/segovia.png";
const epiphone = "/images/brands/epiphone.png";
const tagima = "/images/brands/tagima.png";
const roland = "/images/brands/roland.png";
const fender = "/images/brands/fender.png";

type Brand = { name: string; logo: string; slug: string; scale?: number };

const BRANDS: Brand[] = [
  { name: "Behringer", logo: behringer, slug: "Behringer", scale: 0.95 },
  { name: "Yamaha", logo: yamaha, slug: "Yamaha", scale: 0.7 },
  { name: "Casio", logo: casio, slug: "Casio", scale: 0.58 },
  { name: "Shure", logo: shure, slug: "Shure", scale: 0.58 },
  { name: "Ibanez", logo: ibanez, slug: "Ibanez", scale: 0.75 },
  { name: "Extreme", logo: extreme, slug: "Extreme", scale: 0.85 },
  { name: "Century", logo: century, slug: "Century", scale: 0.78 },
  { name: "McCartney", logo: mccartney, slug: "McCartney", scale: 1 },
  { name: "Segovia", logo: segovia, slug: "Segovia", scale: 1 },
  { name: "Epiphone", logo: epiphone, slug: "Epiphone", scale: 1 },
  { name: "Tagima", logo: tagima, slug: "Tagima", scale: 1 },
  { name: "Roland", logo: roland, slug: "Roland", scale: 0.55 },
  { name: "Fender", logo: fender, slug: "Fender", scale: 0.95 },
];

const MARQUEE_COPIES = 2;
const LOOP_SECONDS = BRANDS_MARQUEE_SECONDS;
const RESUME_DELAY_MS = 180;

function BrandLogo({ brand, copyIndex }: { brand: Brand; copyIndex: number }) {
  return (
    <Link
      href={`/marcas?b=${encodeURIComponent(brand.slug)}`}
      className="group/logo flex h-14 shrink-0 items-center justify-center px-2 select-none md:h-16"
      aria-label={brand.name}
      tabIndex={copyIndex === 0 ? 0 : -1}
    >
      <img
        src={brand.logo}
        alt=""
        loading="eager"
        decoding="async"
        style={{ height: `${(brand.scale ?? 1) * 90}%` }}
        className="w-auto object-contain opacity-[0.48] transition-opacity duration-200 group-hover/logo:opacity-100 group-focus-visible/logo:opacity-100"
        draggable={false}
      />
    </Link>
  );
}

export function Brands() {
  const sectionRef = useRef<HTMLElement>(null);
  const mobileTrackRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const segmentRef = useRef<HTMLDivElement>(null);
  const segmentWidthRef = useRef(0);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const pointerInsideRef = useRef(false);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotionRef = useRef(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const applyTransform = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
  }, []);

  const measure = useCallback(() => {
    const segment = segmentRef.current;
    if (!segment) return;

    const width = Math.round(segment.getBoundingClientRect().width);
    if (width <= 0) return;

    segmentWidthRef.current = width;
    if (offsetRef.current >= width) {
      offsetRef.current %= width;
    }
    applyTransform();
  }, [applyTransform]);

  const setPaused = useCallback(
    (paused: boolean) => {
      pausedRef.current = paused;
      if (!paused) {
        lastTimeRef.current = 0;
      }
    },
    [],
  );

  const pauseMarquee = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    pointerInsideRef.current = true;
    setPaused(true);
  }, [setPaused]);

  const handlePointerEnter = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType !== "mouse") return;
      pauseMarquee();
    },
    [pauseMarquee],
  );

  const scheduleResume = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      resumeTimerRef.current = null;
      if (!pointerInsideRef.current) {
        setPaused(false);
      }
    }, RESUME_DELAY_MS);
  }, [setPaused]);

  const handleSectionPointerLeave = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType !== "mouse") return;

      const next = event.relatedTarget;
      if (nodeContains(sectionRef.current, next)) return;

      pointerInsideRef.current = false;
      scheduleResume();
    },
    [scheduleResume],
  );

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reduceMotionRef.current = reduced;
    setPrefersReducedMotion(reduced);
    measure();

    const segment = segmentRef.current;
    if (!segment) return;

    const observer = new ResizeObserver(measure);
    observer.observe(segment);

    return () => observer.disconnect();
  }, [measure]);

  /** Marquee mobile con Web Animations API (Safari iOS no anima bien % en CSS). */
  useEffect(() => {
    if (prefersReducedMotion) return;

    const track = mobileTrackRef.current;
    const segment = track?.firstElementChild as HTMLElement | null;
    if (!track || !segment) return;

    const mq = window.matchMedia("(max-width: 767px)");
    if (!mq.matches) return;

    let animation: Animation | null = null;

    const start = () => {
      animation?.cancel();
      const width = Math.round(segment.getBoundingClientRect().width);
      if (width <= 0) return;

      track.style.setProperty("--marquee-distance", `-${width}px`);
      animation = track.animate(
        [
          { transform: "translate3d(0, 0, 0)" },
          { transform: `translate3d(-${width}px, 0, 0)` },
        ],
        {
          duration: LOOP_SECONDS * 1000,
          iterations: Infinity,
          easing: "linear",
        },
      );
    };

    start();

    const observer = new ResizeObserver(start);
    observer.observe(segment);
    window.addEventListener("load", start);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        animation?.play();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      animation?.cancel();
      observer.disconnect();
      window.removeEventListener("load", start);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    window.addEventListener("load", measure);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        lastTimeRef.current = 0;
        measure();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    const tick = (time: number) => {
      const track = trackRef.current;
      const segmentWidth = segmentWidthRef.current;

      if (
        track &&
        segmentWidth > 0 &&
        !pausedRef.current &&
        !reduceMotionRef.current
      ) {
        if (lastTimeRef.current > 0) {
          const delta = (time - lastTimeRef.current) / 1000;
          offsetRef.current += (segmentWidth / LOOP_SECONDS) * delta;

          while (offsetRef.current >= segmentWidth) {
            offsetRef.current -= segmentWidth;
          }

          track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
        }
        lastTimeRef.current = time;
      } else if (pausedRef.current || reduceMotionRef.current) {
        lastTimeRef.current = 0;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("load", measure);
      document.removeEventListener("visibilitychange", onVisible);
      cancelAnimationFrame(rafRef.current);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [measure]);

  return (
    <section
      ref={sectionRef}
      className="overflow-hidden border-b border-border bg-muted/30 pt-8 pb-6 md:pt-12 md:pb-9"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handleSectionPointerLeave}
      onFocusCapture={(event) => {
        if (event.target instanceof HTMLElement && event.target.matches(":focus-visible")) {
          pauseMarquee();
        }
      }}
      onBlurCapture={(event) => {
        if (nodeContains(sectionRef.current, event.relatedTarget)) return;
        pointerInsideRef.current = false;
        scheduleResume();
      }}
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="relative mb-5 flex -translate-y-3 items-center justify-center md:mb-6 md:-translate-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Marcas oficiales
          </p>
          <Link
            href="/marcas"
            className="absolute right-0 text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Ver todas →
          </Link>
        </div>
      </div>

      <div
        className="relative isolate h-14 w-full overflow-hidden md:h-16"
        aria-label="Carrusel de marcas oficiales"
      >
        {prefersReducedMotion ? (
          <div className="flex h-full items-center gap-10 overflow-x-auto overscroll-x-contain px-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-16 md:px-8">
            {BRANDS.map((brand) => (
              <BrandLogo key={brand.name} brand={brand} copyIndex={0} />
            ))}
          </div>
        ) : (
          <>
            <div
              ref={mobileTrackRef}
              className="brands-marquee-track flex w-max items-center md:hidden [transform:translateZ(0)]"
            >
              {Array.from({ length: MARQUEE_COPIES }, (_, copyIndex) => (
                <div
                  key={copyIndex}
                  className="flex shrink-0 items-center gap-12 pr-12"
                  aria-hidden={copyIndex === 1}
                >
                  {BRANDS.map((brand) => (
                    <BrandLogo
                      key={`${brand.name}-mobile-${copyIndex}`}
                      brand={brand}
                      copyIndex={copyIndex}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div
              ref={trackRef}
              className="hidden w-max items-center will-change-transform motion-reduce:transform-none md:flex"
            >
              {Array.from({ length: MARQUEE_COPIES }, (_, copyIndex) => (
                <div
                  key={copyIndex}
                  ref={copyIndex === 0 ? segmentRef : undefined}
                  className="flex shrink-0 items-center gap-12 pr-12 md:gap-16 md:pr-16"
                  aria-hidden={copyIndex === 1}
                >
                  {BRANDS.map((brand) => (
                    <BrandLogo key={`${brand.name}-${copyIndex}`} brand={brand} copyIndex={copyIndex} />
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
