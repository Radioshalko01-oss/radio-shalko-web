"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import type { CatalogImage } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

const ZOOM_SCALE = 2.4;
const LENS_RATIO = 0.34;

function useGalleryState(images: CatalogImage[]) {
  const [active, setActive] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const main = images[active] ?? images[0];

  const goTo = useCallback(
    (index: number) => {
      if (images.length === 0) return;
      const next = ((index % images.length) + images.length) % images.length;
      setActive(next);
    },
    [images.length],
  );

  const onTouchStart = useCallback((clientX: number, clientY: number) => {
    touchStart.current = { x: clientX, y: clientY };
  }, []);

  const onTouchEnd = useCallback(
    (clientX: number, clientY: number) => {
      if (touchStart.current === null || images.length < 2) return;
      const deltaX = clientX - touchStart.current.x;
      const deltaY = clientY - touchStart.current.y;
      touchStart.current = null;
      if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY)) return;
      goTo(active + (deltaX < 0 ? 1 : -1));
    },
    [active, goTo, images.length],
  );

  return {
    active,
    setActive: goTo,
    main,
    hasMultiple: images.length > 1,
    images,
    onTouchStart,
    onTouchEnd,
  };
}

function GalleryThumbnails({
  images,
  active,
  setActive,
  className,
}: {
  images: CatalogImage[];
  active: number;
  setActive: (i: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex shrink-0 flex-col items-center gap-2", className)}>
      <div className="flex max-h-[min(520px,60vh)] flex-col gap-2 overflow-y-auto overscroll-contain py-0.5">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Ver imagen ${i + 1}`}
            aria-current={i === active}
            className={cn(
              "relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-lg border bg-[#f3f3f3] transition-colors md:h-14 md:w-14",
              i === active
                ? "border-foreground ring-1 ring-foreground"
                : "border-border/70 hover:border-foreground/40",
            )}
          >
            <img src={img.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      {images.length > 4 && (
        <ChevronDown className="h-4 w-4 text-muted-foreground/50" aria-hidden />
      )}
    </div>
  );
}

function GalleryMain({
  main,
  name,
  className,
  enableLensZoom = false,
  onTouchStart,
  onTouchEnd,
}: {
  main: CatalogImage | undefined;
  name: string;
  className?: string;
  enableLensZoom?: boolean;
  onTouchStart?: (clientX: number, clientY: number) => void;
  onTouchEnd?: (clientX: number, clientY: number) => void;
}) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [lens, setLens] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [focus, setFocus] = useState({ x: 50, y: 50 });

  const zoomActive = enableLensZoom && !reduceMotion && hovering && !!main;

  const handleMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const node = containerRef.current;
      if (!node || !enableLensZoom || reduceMotion) return;

      const rect = node.getBoundingClientRect();
      const lensW = rect.width * LENS_RATIO;
      const lensH = rect.height * LENS_RATIO;

      let x = event.clientX - rect.left - lensW / 2;
      let y = event.clientY - rect.top - lensH / 2;
      x = Math.max(0, Math.min(x, rect.width - lensW));
      y = Math.max(0, Math.min(y, rect.height - lensH));

      const focusX = ((x + lensW / 2) / rect.width) * 100;
      const focusY = ((y + lensH / 2) / rect.height) * 100;

      setLens({ x, y, width: lensW, height: lensH });
      setFocus({ x: focusX, y: focusY });
    },
    [enableLensZoom, reduceMotion],
  );

  return (
    <div
      className={cn(
        "relative aspect-square w-full max-w-[min(100%,28rem)] lg:max-w-[min(100%,32rem)]",
        enableLensZoom && "lg:overflow-visible",
        className,
      )}
    >
      {zoomActive && main && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-full top-0 z-50 ml-10 hidden h-full w-[min(35rem,60vw)] overflow-hidden rounded-2xl border border-border bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)] lg:block"
          style={{
            backgroundImage: `url(${main.url})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${ZOOM_SCALE * 100}%`,
            backgroundPosition: `${focus.x}% ${focus.y}%`,
          }}
        />
      )}

      <div
        ref={containerRef}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onMouseMove={handleMove}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          if (touch) onTouchStart?.(touch.clientX, touch.clientY);
        }}
        onTouchEnd={(e) => {
          const touch = e.changedTouches[0];
          if (touch) onTouchEnd?.(touch.clientX, touch.clientY);
        }}
        className={cn(
          "relative h-full w-full overflow-hidden rounded-2xl bg-[#f3f3f3] touch-pan-y",
          enableLensZoom && !reduceMotion && "lg:cursor-crosshair",
        )}
      >
        {main ? (
          <>
            <img
              src={main.url}
              alt={main.alt ?? name}
              draggable={false}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-full w-full select-none object-contain p-3 sm:p-4 md:p-6"
            />

            {zoomActive && (
              <div
                aria-hidden
                className="pointer-events-none absolute hidden border border-white/40 bg-black/20 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)] lg:block"
                style={{
                  left: lens.x,
                  top: lens.y,
                  width: lens.width,
                  height: lens.height,
                }}
              />
            )}

          </>
        ) : (
          <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">
            Sin imagen
          </div>
        )}
      </div>
    </div>
  );
}

export function ProductGallery({ images, name }: { images: CatalogImage[]; name: string }) {
  const { active, setActive, main, hasMultiple, images: imgs, onTouchStart, onTouchEnd } =
    useGalleryState(images);

  return (
    <>
      {/* Mobile / tablet: layout combinado */}
      <div className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-2 md:gap-3 lg:hidden">
        {hasMultiple && (
          <GalleryThumbnails
            images={imgs}
            active={active}
            setActive={setActive}
            className="-ml-1 md:-ml-2"
          />
        )}
        <div className="flex min-w-0 justify-center">
          <GalleryMain main={main} name={name} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} />
        </div>
      </div>

      {/* Desktop: columnas separadas del grid padre (miniaturas | imagen | info) */}
      {hasMultiple ? (
        <GalleryThumbnails
          images={imgs}
          active={active}
          setActive={setActive}
          className="hidden lg:flex lg:col-start-1 lg:row-start-1"
        />
      ) : (
        <div className="hidden lg:block lg:col-start-1 lg:row-start-1" aria-hidden />
      )}
      <div className="relative hidden overflow-visible lg:col-start-2 lg:row-start-1 lg:flex lg:min-w-0 lg:justify-center lg:justify-self-stretch lg:z-20">
        <GalleryMain
          main={main}
          name={name}
          enableLensZoom
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        />
      </div>
    </>
  );
}
