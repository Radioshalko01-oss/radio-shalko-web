"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import type { CatalogImage } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

const ZOOM_LEVEL = 1.85;
const LENS_RATIO = 0.34;
const MOBILE_ZOOM_TARGET = 2.25;
const MOBILE_ZOOM_MAX = 3;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_DISTANCE = 24;

type ImageLayout = {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

function getContainedLayout(
  containerW: number,
  containerH: number,
  imageW: number,
  imageH: number,
): ImageLayout {
  if (!containerW || !containerH || !imageW || !imageH) {
    return { offsetX: 0, offsetY: 0, width: containerW, height: containerH };
  }

  const containerRatio = containerW / containerH;
  const imageRatio = imageW / imageH;

  if (imageRatio > containerRatio) {
    const width = containerW;
    const height = containerW / imageRatio;
    return { offsetX: 0, offsetY: (containerH - height) / 2, width, height };
  }

  const height = containerH;
  const width = containerH * imageRatio;
  return { offsetX: (containerW - width) / 2, offsetY: 0, width, height };
}

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
            <img
              src={img.url}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
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
  enableMobileZoom = false,
  onTouchStart,
  onTouchEnd,
}: {
  main: CatalogImage | undefined;
  name: string;
  className?: string;
  enableLensZoom?: boolean;
  enableMobileZoom?: boolean;
  onTouchStart?: (clientX: number, clientY: number) => void;
  onTouchEnd?: (clientX: number, clientY: number) => void;
}) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [lens, setLens] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [zoomOffset, setZoomOffset] = useState({ x: 0, y: 0 });
  const [mobileScale, setMobileScale] = useState(1);
  const [mobilePan, setMobilePan] = useState({ x: 0, y: 0 });

  const mobileScaleRef = useRef(1);
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const swipeBlockedRef = useRef(false);

  const zoomActive = enableLensZoom && !reduceMotion && hovering && !!main && naturalSize.w > 0;
  const mobileZoomActive = enableMobileZoom && !reduceMotion && mobileScale > 1;

  useEffect(() => {
    mobileScaleRef.current = mobileScale;
  }, [mobileScale]);

  useEffect(() => {
    setNaturalSize({ w: 0, h: 0 });
    setMobileScale(1);
    setMobilePan({ x: 0, y: 0 });
    pinchRef.current = null;
    panStartRef.current = null;
    lastTapRef.current = null;
    swipeBlockedRef.current = false;
  }, [main?.url]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || !enableMobileZoom || reduceMotion) return;

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 2 && pinchRef.current) {
        event.preventDefault();
        const [t1, t2] = [event.touches[0]!, event.touches[1]!];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const next = Math.min(
          MOBILE_ZOOM_MAX,
          Math.max(1, pinchRef.current.scale * (dist / pinchRef.current.dist)),
        );
        setMobileScale(next);
        if (next <= 1.01) {
          setMobilePan({ x: 0, y: 0 });
        }
        return;
      }

      if (event.touches.length === 1 && mobileScaleRef.current > 1 && panStartRef.current) {
        event.preventDefault();
        const touch = event.touches[0]!;
        const dx = touch.clientX - panStartRef.current.x;
        const dy = touch.clientY - panStartRef.current.y;
        setMobilePan({
          x: panStartRef.current.panX + dx,
          y: panStartRef.current.panY + dy,
        });
      }
    };

    node.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => node.removeEventListener("touchmove", handleTouchMove);
  }, [enableMobileZoom, reduceMotion, main?.url]);

  const handleMobileTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (!enableMobileZoom || reduceMotion) {
        const touch = event.touches[0];
        if (touch) onTouchStart?.(touch.clientX, touch.clientY);
        return;
      }

      swipeBlockedRef.current = false;

      if (event.touches.length === 2) {
        const [t1, t2] = [event.touches[0]!, event.touches[1]!];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        pinchRef.current = { dist, scale: mobileScaleRef.current };
        panStartRef.current = null;
        swipeBlockedRef.current = true;
        return;
      }

      const touch = event.touches[0];
      if (!touch) return;

      if (mobileScaleRef.current > 1) {
        panStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          panX: mobilePan.x,
          panY: mobilePan.y,
        };
        swipeBlockedRef.current = true;
        return;
      }

      onTouchStart?.(touch.clientX, touch.clientY);
    },
    [enableMobileZoom, mobilePan.x, mobilePan.y, onTouchStart, reduceMotion],
  );

  const handleMobileTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (!enableMobileZoom || reduceMotion) {
        const touch = event.changedTouches[0];
        if (touch) onTouchEnd?.(touch.clientX, touch.clientY);
        return;
      }

      pinchRef.current = null;
      panStartRef.current = null;

      const touch = event.changedTouches[0];
      if (!touch) return;

      const now = Date.now();
      const last = lastTapRef.current;

      if (last && now - last.time < DOUBLE_TAP_MS) {
        const dist = Math.hypot(touch.clientX - last.x, touch.clientY - last.y);
        if (dist < DOUBLE_TAP_DISTANCE) {
          if (mobileScaleRef.current > 1) {
            setMobileScale(1);
            setMobilePan({ x: 0, y: 0 });
          } else {
            setMobileScale(MOBILE_ZOOM_TARGET);
          }
          lastTapRef.current = null;
          swipeBlockedRef.current = true;
          return;
        }
      }

      lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };

      if (!swipeBlockedRef.current && mobileScaleRef.current <= 1) {
        onTouchEnd?.(touch.clientX, touch.clientY);
      }
    },
    [enableMobileZoom, onTouchEnd, reduceMotion],
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => {
      setContainerSize({ w: node.clientWidth, h: node.clientHeight });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [main?.url]);

  const imageLayout = getContainedLayout(
    containerSize.w,
    containerSize.h,
    naturalSize.w,
    naturalSize.h,
  );

  const handleMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const node = containerRef.current;
      if (!node || !enableLensZoom || reduceMotion || !naturalSize.w) return;

      const rect = node.getBoundingClientRect();
      const layout = getContainedLayout(rect.width, rect.height, naturalSize.w, naturalSize.h);

      const lensW = layout.width * LENS_RATIO;
      const lensH = layout.height * LENS_RATIO;

      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;

      const relX = pointerX - layout.offsetX;
      const relY = pointerY - layout.offsetY;

      const clampedRelX = Math.max(0, Math.min(relX, layout.width));
      const clampedRelY = Math.max(0, Math.min(relY, layout.height));

      let lensX = layout.offsetX + clampedRelX - lensW / 2;
      let lensY = layout.offsetY + clampedRelY - lensH / 2;
      lensX = Math.max(layout.offsetX, Math.min(lensX, layout.offsetX + layout.width - lensW));
      lensY = Math.max(layout.offsetY, Math.min(lensY, layout.offsetY + layout.height - lensH));

      const ratioX = layout.width > 0 ? (clampedRelX / layout.width) * 100 : 50;
      const ratioY = layout.height > 0 ? (clampedRelY / layout.height) * 100 : 50;

      const zoomW = layout.width * ZOOM_LEVEL;
      const zoomH = layout.height * ZOOM_LEVEL;
      const panelW = layout.width;
      const panelH = layout.height;

      const offsetX = Math.max(
        Math.min(-((ratioX / 100) * zoomW - panelW / 2), 0),
        panelW - zoomW,
      );
      const offsetY = Math.max(
        Math.min(-((ratioY / 100) * zoomH - panelH / 2), 0),
        panelH - zoomH,
      );

      setLens({ x: lensX, y: lensY, width: lensW, height: lensH });
      setZoomOffset({ x: offsetX, y: offsetY });
    },
    [enableLensZoom, naturalSize.h, naturalSize.w, reduceMotion],
  );

  return (
    <div
      className={cn(
        "relative aspect-square w-full max-w-[min(100%,24rem)] sm:max-w-[min(100%,28rem)] lg:max-w-[min(100%,32rem)]",
        enableLensZoom && "lg:overflow-visible",
        className,
      )}
    >
      {zoomActive && main && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-full top-0 z-50 ml-10 hidden overflow-hidden rounded-2xl border border-border bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)] lg:block"
          style={{
            width: imageLayout.width,
            height: imageLayout.height,
          }}
        >
          <img
            src={main.url}
            alt=""
            draggable={false}
            className="absolute max-w-none select-none"
            style={{
              width: imageLayout.width * ZOOM_LEVEL,
              height: imageLayout.height * ZOOM_LEVEL,
              left: zoomOffset.x,
              top: zoomOffset.y,
            }}
          />
        </div>
      )}

      <div
        ref={containerRef}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onMouseMove={handleMove}
        onTouchStart={handleMobileTouchStart}
        onTouchEnd={handleMobileTouchEnd}
        className={cn(
          "relative h-full w-full overflow-hidden rounded-2xl bg-[#f3f3f3] touch-pan-y",
          enableLensZoom && !reduceMotion && "lg:cursor-crosshair",
          mobileZoomActive && "touch-none",
        )}
      >
        {main ? (
          <>
            <div
              className={cn(
                "absolute inset-0 transition-transform duration-200 ease-out motion-reduce:transition-none",
                mobileZoomActive && "duration-0",
              )}
              style={
                enableMobileZoom && mobileScale > 1
                  ? {
                      transform: `translate(${mobilePan.x}px, ${mobilePan.y}px) scale(${mobileScale})`,
                      transformOrigin: "center center",
                    }
                  : undefined
              }
            >
              <img
                src={main.url}
                alt={main.alt ?? name}
                draggable={false}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                onLoad={(e) => {
                  setNaturalSize({
                    w: e.currentTarget.naturalWidth,
                    h: e.currentTarget.naturalHeight,
                  });
                }}
                className="absolute inset-0 h-full w-full select-none object-contain p-3 sm:p-4 md:p-6"
              />
            </div>

            {enableMobileZoom && mobileScale <= 1 && !reduceMotion && (
              <p className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-[10px] font-medium text-white/90">
                Doble toque para ampliar
              </p>
            )}

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

export function ProductGallery({
  images,
  name,
  belowImage,
}: {
  images: CatalogImage[];
  name: string;
  /** Contenido bajo la imagen principal (p. ej. nota de confianza en PDP) */
  belowImage?: ReactNode;
}) {
  const { active, setActive, main, hasMultiple, images: imgs, onTouchStart, onTouchEnd } =
    useGalleryState(images);

  return (
    <>
      {/* Mobile / tablet: layout combinado */}
      <div className="lg:hidden">
        <div className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-2 md:gap-3">
          {hasMultiple && (
            <GalleryThumbnails
              images={imgs}
              active={active}
              setActive={setActive}
              className="-ml-1 md:-ml-2"
            />
          )}
          <div className="flex min-w-0 justify-center">
            <GalleryMain
              main={main}
              name={name}
              enableMobileZoom
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            />
          </div>
        </div>
        {belowImage ? (
          <div className="mt-4 flex justify-center">
            <div className="w-full max-w-[min(100%,28rem)]">{belowImage}</div>
          </div>
        ) : null}
      </div>

      {/* Desktop: miniaturas centradas respecto a la imagen */}
      <div className="hidden lg:col-start-1 lg:row-start-1 lg:mt-3 lg:grid lg:w-full lg:grid-cols-[56px_minmax(0,1fr)] lg:gap-x-8 xl:mt-4 xl:gap-x-12">
        {hasMultiple ? (
          <GalleryThumbnails
            images={imgs}
            active={active}
            setActive={setActive}
            className="row-start-1 self-center"
          />
        ) : (
          <div className="row-start-1 w-14 shrink-0" aria-hidden />
        )}
        <div className="row-start-1 flex min-w-0 flex-col items-center">
          <GalleryMain
            main={main}
            name={name}
            enableLensZoom
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          />
        </div>
        {belowImage ? (
          <div className="col-start-2 row-start-2 mt-4 w-full max-w-[min(100%,28rem)] justify-self-center lg:max-w-[min(100%,32rem)]">
            {belowImage}
          </div>
        ) : null}
      </div>
    </>
  );
}
