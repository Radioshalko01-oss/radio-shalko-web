import Link from "next/link";
import { cn } from "@/lib/utils";

export type CategoryItem = {
  name: string;
  count: string;
  img: string;
  href: string;
};

type CategoryCardProps = {
  category: CategoryItem;
  className?: string;
  variant?: "hero" | "tall" | "default" | "compact" | "wide";
  imageFit?: "cover" | "contain";
  imagePosition?: string;
  imageScale?: number;
  imageOffsetY?: string;
};

export function CategoryCard({
  category,
  className,
  variant = "default",
  imageFit = "contain",
  imagePosition = "center center",
  imageScale = 1,
  imageOffsetY,
}: CategoryCardProps) {
  const hasCoverTransform =
    imageFit === "cover" && (imageScale !== 1 || Boolean(imageOffsetY));

  return (
    <Link
      href={category.href}
      className={cn(
        "group/cat relative isolate min-h-[200px] overflow-hidden rounded-xl bg-[#f0ede8] transition-shadow duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [--cat-text-zone:4.5rem] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.28)] sm:min-h-[220px] sm:[--cat-text-zone:5rem]",
        variant === "hero" && "min-h-[260px] sm:min-h-[300px] [--cat-text-zone:5rem] sm:[--cat-text-zone:5.5rem] md:[--cat-text-zone:6rem]",
        variant === "tall" && "min-h-[240px] sm:min-h-[280px]",
        variant === "compact" && "min-h-[160px] sm:min-h-[180px] [--cat-text-zone:3.75rem] sm:[--cat-text-zone:4rem]",
        variant === "wide" && "min-h-[140px] sm:min-h-[160px]",
        className,
      )}
      aria-label={`Explorar ${category.name}`}
    >
      <div
        className={cn(
          "absolute inset-0 will-change-transform transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:transform-none group-hover/cat:scale-[1.045]",
          imageFit === "contain"
            ? "flex items-center justify-center px-3 sm:px-4"
            : "overflow-hidden",
        )}
        style={
          imageFit === "contain"
            ? { bottom: "var(--cat-text-zone, 4.5rem)" }
            : undefined
        }
      >
        <img
          src={category.img}
          alt=""
          loading="lazy"
          decoding="async"
          style={{
            objectPosition: imagePosition,
            ...(hasCoverTransform
              ? {
                  transform: `translate(-50%, calc(-50% + ${imageOffsetY ?? "0px"})) scale(${imageScale !== 1 ? imageScale : 1.08})`,
                }
              : undefined),
          }}
          className={cn(
            "origin-center",
            imageFit === "contain"
              ? "max-h-full max-w-full object-contain object-center"
              : hasCoverTransform
                ? "absolute left-1/2 top-1/2 h-full w-full object-cover"
                : "absolute inset-0 h-full w-full object-cover",
          )}
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-black/35 to-black/65 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none group-hover/cat:from-black/20 group-hover/cat:via-black/30 group-hover/cat:to-black/60"
      />

      <div
        className={cn(
          "absolute inset-0 z-10 flex flex-col items-center justify-center text-center",
          variant === "hero"
            ? "p-4 sm:p-5 md:p-6"
            : variant === "compact"
              ? "p-3 sm:p-3.5"
              : "p-3.5 sm:p-4 md:p-5",
        )}
      >
        <h3
          className={cn(
            "max-w-[92%] font-display font-semibold leading-[1.15] tracking-tight text-white/95 [text-wrap:balance] drop-shadow-sm transition-[transform,color,letter-spacing] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:transform-none group-hover/cat:-translate-y-1 group-hover/cat:text-white group-hover/cat:tracking-wide",
            variant === "hero"
              ? "text-2xl sm:text-3xl md:text-4xl"
              : variant === "tall"
                ? "text-xl sm:text-2xl md:text-3xl"
                : variant === "compact"
                  ? "text-lg sm:text-xl"
                  : "text-lg sm:text-xl md:text-2xl",
          )}
        >
          {category.name}
        </h3>

        <p
          className={cn(
            "mt-2.5 inline-flex items-center gap-1 font-medium tracking-wide text-white/75 transition-[transform,color,gap,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] delay-75 motion-reduce:transition-none motion-reduce:transform-none group-hover/cat:translate-y-0.5 group-hover/cat:gap-2.5 group-hover/cat:text-white",
            variant === "compact" ? "text-sm" : "text-sm sm:text-base",
          )}
        >
          Explorar
          <span
            aria-hidden
            className="inline-block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] delay-150 motion-reduce:transition-none motion-reduce:transform-none group-hover/cat:translate-x-1"
          >
            →
          </span>
        </p>
      </div>
    </Link>
  );
}
