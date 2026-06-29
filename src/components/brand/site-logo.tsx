import { cn } from "@/lib/utils";
import {
  BRAND_ALT,
  BRAND_ICON_SRC,
  BRAND_WORDMARK_SRC,
} from "@/lib/brand/assets";

export type SiteLogoVariant = "horizontal" | "icon";
export type SiteLogoSize = "sm" | "md" | "lg";
export type SiteLogoContext = "default" | "header" | "admin" | "login";

type SiteLogoProps = {
  variant?: SiteLogoVariant;
  size?: SiteLogoSize;
  context?: SiteLogoContext;
  className?: string;
  /** Aplica fade en hover cuando el padre tiene `group`. */
  interactive?: boolean;
};

const SIZE: Record<
  SiteLogoSize,
  { icon: string; wordmark: string; gap: string }
> = {
  sm: {
    icon: "h-8 w-8 shrink-0",
    wordmark: "h-6 w-auto max-w-[112px] shrink-0",
    gap: "gap-2",
  },
  md: {
    icon: "h-11 w-11 shrink-0 md:h-[52px] md:w-[52px]",
    wordmark:
      "ml-0.5 h-7 w-auto max-w-[140px] shrink-0 md:ml-1 md:h-9 md:max-w-[175px]",
    gap: "gap-2 md:gap-2.5",
  },
  lg: {
    icon: "h-12 w-12 shrink-0 md:h-14 md:w-14",
    wordmark:
      "ml-1 h-9 w-auto max-w-[175px] shrink-0 md:ml-1.5 md:h-10 md:max-w-[210px]",
    gap: "gap-2.5 md:gap-3",
  },
};

function resolveSize(
  size: SiteLogoSize | undefined,
  context: SiteLogoContext,
): SiteLogoSize {
  if (size) return size;
  if (context === "admin") return "sm";
  if (context === "login") return "md";
  if (context === "header") return "md";
  return "md";
}

export function SiteLogo({
  variant = "horizontal",
  size,
  context = "default",
  className,
  interactive = false,
}: SiteLogoProps) {
  const resolved = resolveSize(size, context);
  const tokens = SIZE[resolved];
  const imgFade = interactive
    ? "transition-opacity duration-300 ease-out group-hover:opacity-80"
    : "";

  if (variant === "icon") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={BRAND_ICON_SRC}
        alt={BRAND_ALT}
        width={resolved === "sm" ? 32 : resolved === "lg" ? 56 : 52}
        height={resolved === "sm" ? 32 : resolved === "lg" ? 56 : 52}
        className={cn(
          tokens.icon,
          "object-contain",
          imgFade,
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center",
        tokens.gap,
        context === "login" && "mx-auto",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_ICON_SRC}
        alt=""
        aria-hidden
        width={resolved === "sm" ? 32 : resolved === "lg" ? 56 : 52}
        height={resolved === "sm" ? 32 : resolved === "lg" ? 56 : 52}
        className={cn(tokens.icon, "object-contain", imgFade)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_WORDMARK_SRC}
        alt={BRAND_ALT}
        width={resolved === "sm" ? 140 : resolved === "lg" ? 210 : 180}
        height={resolved === "sm" ? 24 : resolved === "lg" ? 40 : 36}
        className={cn(
          tokens.wordmark,
          "object-contain object-left",
          imgFade,
        )}
      />
    </span>
  );
}
