"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import type { CatalogImage } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

const ZOOM_LEVEL = 1.85;
const LENS_RATIO = 0.34;
/** Panel de lupa desktop — cubre la columna de info del producto (solo lg+). */
const DESKTOP_ZOOM_PANEL_MIN = 528;
const MOBILE_ZOOM_TARGET = 2.25;
const MOBILE_ZOOM_MAX = 3;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_DISTANCE = 24;
const MOBILE_THUMB_SIZE = 52;
const MOBILE_THUMB_GAP = 8;
const MOBILE_THUMB_VISIBLE = 5;

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

function MobileGalleryThumbnails({
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
  const listRef = useRef<HTMLDivElement>(null);
  const thumbStep = MOBILE_THUMB_SIZE + MOBILE_THUMB_GAP;
  const visibleCount = Math.min(images.length, MOBILE_THUMB_VISIBLE);
  const maxHeight =
    visibleCount * MOBILE_THUMB_SIZE + Math.max(0, visibleCount - 1) * MOBILE_THUMB_GAP;
  const showChevron = images.length > MOBILE_THUMB_VISIBLE;

  const scrollThumbIntoView = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const list = listRef.current;
      if (!list || images.length <= MOBILE_THUMB_VISIBLE) return;

      const maxScroll = (images.length - MOBILE_THUMB_VISIBLE) * thumbStep;
      let target = 0;

      if (index >= MOBILE_THUMB_VISIBLE - 1) {
        target = Math.min((index - (MOBILE_THUMB_VISIBLE - 1)) * thumbStep, maxScroll);
      }

      list.scrollTo({ top: target, behavior });
    },
    [images.length, thumbStep],
  );

  useEffect(() => {
    scrollThumbIntoView(active);
  }, [active, scrollThumbIntoView]);

  const handleChevron = () => {
    const next = active + 1 < images.length ? active + 1 : 0;
    setActive(next);
    scrollThumbIntoView(next);
  };

  return (
    <div className={cn("flex shrink-0 flex-col items-center gap-1 self-center", className)}>
      <div
        ref={listRef}
        className="flex flex-col gap-2 overflow-y-auto overscroll-contain py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ maxHeight }}
      >
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Ver imagen ${i + 1}`}
            aria-current={i === active}
            className={cn(
              "relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-lg border bg-[#f3f3f3] transition-[border-color,box-shadow] duration-150",
              i === active
                ? "border-foreground"
                : "border-border/50 hover:border-foreground/30",
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
      {showChevron ? (
        <button
          type="button"
          onClick={handleChevron}
          aria-label="Ver siguiente imagen"
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <ChevronDown className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
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
              "relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-[#f3f3f3] transition-colors",
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

function MobileZoomLightbox({
  open,
  onClose,
  images,
  active,
  onActiveChange,
  name,
}: {
  open: boolean;
  onClose: () => void;
  images: CatalogImage[];
  active: number;
  onActiveChange: (index: number) => void;
  name: string;
}) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);

  const image = images[active];
  const hasMultiple = images.length > 1;

  const goTo = useCallback(
    (index: number) => {
      if (images.length === 0) return;
      const next = ((index % images.length) + images.length) % images.length;
      onActiveChange(next);
    },
    [images.length, onActiveChange],
  );

  const goPrev = useCallback(() => goTo(active - 1), [active, goTo]);
  const goNext = useCallback(() => goTo(active + 1), [active, goTo]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    if (!open) {
      setScale(1);
      setPan({ x: 0, y: 0 });
      pinchRef.current = null;
      panStartRef.current = null;
      swipeStartRef.current = null;
      lastTapRef.current = null;
      return;
    }

    setScale(1);
    setPan({ x: 0, y: 0 });
    pinchRef.current = null;
    panStartRef.current = null;
    swipeStartRef.current = null;
    lastTapRef.current = null;
  }, [open, active, image?.url]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [open]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node || !open || reduceMotion) return;

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        event.preventDefault();
        const [t1, t2] = [event.touches[0]!, event.touches[1]!];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        pinchRef.current = { dist, scale: scaleRef.current };
        panStartRef.current = null;
        swipeStartRef.current = null;
      } else if (event.touches.length === 1) {
        const touch = event.touches[0]!;
        if (scaleRef.current > 1) {
          panStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            panX: panRef.current.x,
            panY: panRef.current.y,
          };
          swipeStartRef.current = null;
        } else {
          swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
          panStartRef.current = null;
        }
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 2 && pinchRef.current) {
        event.preventDefault();
        const [t1, t2] = [event.touches[0]!, event.touches[1]!];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const next = Math.min(
          MOBILE_ZOOM_MAX,
          Math.max(1, pinchRef.current.scale * (dist / pinchRef.current.dist)),
        );
        setScale(next);
        if (next <= 1.01) setPan({ x: 0, y: 0 });
        return;
      }

      if (event.touches.length === 1 && scaleRef.current > 1 && panStartRef.current) {
        event.preventDefault();
        const touch = event.touches[0]!;
        setPan({
          x: panStartRef.current.panX + touch.clientX - panStartRef.current.x,
          y: panStartRef.current.panY + touch.clientY - panStartRef.current.y,
        });
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (event.touches.length > 0) return;
      const touch = event.changedTouches[0];
      if (!touch) return;

      const swipeStart = swipeStartRef.current;
      swipeStartRef.current = null;

      if (scaleRef.current <= 1.01 && swipeStart && hasMultiple) {
        const dx = touch.clientX - swipeStart.x;
        const dy = touch.clientY - swipeStart.y;
        if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) goNext();
          else goPrev();
          pinchRef.current = null;
          panStartRef.current = null;
          lastTapRef.current = null;
          return;
        }
      }

      const now = Date.now();
      const last = lastTapRef.current;
      if (last && now - last.time < DOUBLE_TAP_MS) {
        const dist = Math.hypot(touch.clientX - last.x, touch.clientY - last.y);
        if (dist < DOUBLE_TAP_DISTANCE) {
          event.preventDefault();
          if (scaleRef.current > 1) {
            setScale(1);
            setPan({ x: 0, y: 0 });
          } else {
            setScale(MOBILE_ZOOM_TARGET);
          }
          lastTapRef.current = null;
          return;
        }
      }
      lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };
      pinchRef.current = null;
      panStartRef.current = null;
    };

    const blockGesture = (event: Event) => event.preventDefault();

    node.addEventListener("touchstart", handleTouchStart, { passive: false });
    node.addEventListener("touchmove", handleTouchMove, { passive: false });
    node.addEventListener("touchend", handleTouchEnd, { passive: false });
    node.addEventListener("gesturestart", blockGesture, { passive: false });
    node.addEventListener("gesturechange", blockGesture, { passive: false });

    return () => {
      node.removeEventListener("touchstart", handleTouchStart);
      node.removeEventListener("touchmove", handleTouchMove);
      node.removeEventListener("touchend", handleTouchEnd);
      node.removeEventListener("gesturestart", blockGesture);
      node.removeEventListener("gesturechange", blockGesture);
    };
  }, [open, reduceMotion, image?.url, hasMultiple, goNext, goPrev]);

  if (!mounted || !open || !image) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex touch-none flex-col bg-white pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={`Ampliar ${name}`}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          {hasMultiple ? (
            <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
              {active + 1} / {images.length}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar vista ampliada"
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div ref={viewportRef} className="relative min-h-0 flex-1 touch-none overflow-hidden bg-white">
        {hasMultiple && scale <= 1.01 && (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                goPrev();
              }}
              aria-label="Imagen anterior"
              className="absolute left-2 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-border/80 bg-white/95 text-foreground shadow-sm"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                goNext();
              }}
              aria-label="Imagen siguiente"
              className="absolute right-2 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-border/80 bg-white/95 text-foreground shadow-sm"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </>
        )}
        <div
          className="absolute inset-0 flex items-center justify-center bg-white"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <img
            src={image.url}
            alt={image.alt ?? name}
            draggable={false}
            className="max-h-full max-w-full select-none object-contain px-4"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function GalleryMain({
  main,
  name,
  className,
  enableLensZoom = false,
  enableMobileZoom = false,
  mobileGalleryImages,
  mobileGalleryActive = 0,
  onMobileGalleryActiveChange,
  onTouchStart,
  onTouchEnd,
}: {
  main: CatalogImage | undefined;
  name: string;
  className?: string;
  enableLensZoom?: boolean;
  enableMobileZoom?: boolean;
  mobileGalleryImages?: CatalogImage[];
  mobileGalleryActive?: number;
  onMobileGalleryActiveChange?: (index: number) => void;
  onTouchStart?: (clientX: number, clientY: number) => void;
  onTouchEnd?: (clientX: number, clientY: number) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [lens, setLens] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [zoomOffset, setZoomOffset] = useState({ x: 0, y: 0 });
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const tapStartRef = useRef<{ x: number; y: number } | null>(null);

  const zoomActive = enableLensZoom && mounted && !reduceMotion && hovering && !!main && naturalSize.w > 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setNaturalSize({ w: 0, h: 0 });
    tapStartRef.current = null;
  }, [main?.url]);

  const openLightbox = useCallback(() => {
    setLightboxOpen(true);
  }, []);

  const handleMobileTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      const touch = event.touches[0];
      if (!touch) return;

      tapStartRef.current = { x: touch.clientX, y: touch.clientY };
      onTouchStart?.(touch.clientX, touch.clientY);
    },
    [onTouchStart],
  );

  const handleMobileTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      const touch = event.changedTouches[0];
      if (!touch) return;

      const start = tapStartRef.current;
      tapStartRef.current = null;

      if (!enableMobileZoom || reduceMotion) {
        onTouchEnd?.(touch.clientX, touch.clientY);
        return;
      }

      if (start) {
        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;
        const dist = Math.hypot(dx, dy);

        if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy)) {
          onTouchEnd?.(touch.clientX, touch.clientY);
        }
        return;
      }
    },
    [enableMobileZoom, onTouchEnd, openLightbox, reduceMotion],
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
      const panelW = enableLensZoom
        ? Math.max(layout.width, DESKTOP_ZOOM_PANEL_MIN)
        : layout.width;
      const panelH = enableLensZoom
        ? Math.max(layout.height, DESKTOP_ZOOM_PANEL_MIN)
        : layout.height;

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

  const zoomPanelSize = enableLensZoom
    ? {
        width: Math.max(imageLayout.width, DESKTOP_ZOOM_PANEL_MIN),
        height: Math.max(imageLayout.height, DESKTOP_ZOOM_PANEL_MIN),
      }
    : { width: imageLayout.width, height: imageLayout.height };

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
          className="pointer-events-none absolute left-full -top-3 z-[60] ml-10 hidden overflow-hidden rounded-2xl border border-border bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)] lg:block xl:ml-12"
          style={{
            width: zoomPanelSize.width,
            height: zoomPanelSize.height,
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

      {enableMobileZoom && main && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openLightbox();
          }}
          aria-label="Ampliar imagen"
          className="absolute right-2 top-2 z-30 grid h-11 w-11 place-items-center rounded-full border border-border/80 bg-white text-foreground shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition-colors hover:bg-muted lg:hidden"
        >
          <Maximize2 className="h-5 w-5" aria-hidden />
        </button>
      )}

      <div
        ref={containerRef}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onMouseMove={handleMove}
        onTouchStart={handleMobileTouchStart}
        onTouchEnd={handleMobileTouchEnd}
        className={cn(
          "relative h-full w-full overflow-hidden rounded-2xl bg-[#f3f3f3]",
          enableLensZoom && mounted && !reduceMotion && "lg:cursor-crosshair",
          enableMobileZoom && "max-lg:touch-manipulation",
        )}
      >
        {main ? (
          <>
            <div className="absolute inset-0">
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
                className="absolute inset-0 h-full w-full select-none object-contain p-3 sm:p-4 md:p-6 [backface-visibility:hidden]"
              />
            </div>

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

      <MobileZoomLightbox
        open={enableMobileZoom && lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={mobileGalleryImages ?? (main ? [main] : [])}
        active={mobileGalleryActive}
        onActiveChange={onMobileGalleryActiveChange ?? (() => undefined)}
        name={name}
      />
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
  belowImage?: ReactNode;
}) {
  const { active, setActive, main, hasMultiple, images: imgs, onTouchStart, onTouchEnd } =
    useGalleryState(images);

  return (
    <>
      <div className="lg:hidden max-md:-mt-1">
        <div className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2 md:gap-3 max-md:items-start">
          {hasMultiple && (
            <MobileGalleryThumbnails
              images={imgs}
              active={active}
              setActive={setActive}
              className="-ml-1 md:-ml-2"
            />
          )}
          <div className="flex min-w-0 justify-center self-center">
            <GalleryMain
              main={main}
              name={name}
              enableMobileZoom
              mobileGalleryImages={imgs}
              mobileGalleryActive={active}
              onMobileGalleryActiveChange={setActive}
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
