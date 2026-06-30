import { radius, shadow, spacing, typography } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

/** Public site shell class bundles — DESIGN-3 */
export const siteShell = {
  page: cn(spacing.pageContainer, spacing.pageX, spacing.pageTop, "pb-24 md:pb-28"),
  pageNarrow: cn("mx-auto w-full max-w-3xl", spacing.pageX, spacing.pageTop, "pb-24 md:pb-28"),
  pageWide: cn("mx-auto w-full max-w-6xl", spacing.pageX, "py-16 md:py-20 lg:px-8"),

  section: cn(spacing.sectionLg, "border-b border-border"),
  sectionInner: cn(spacing.pageContainer, spacing.pageX),

  card: cn(radius.card, "border border-border bg-card", shadow.card),
  cardMuted: cn(radius.card, "border border-border bg-card/60"),
  summaryPanel: cn(radius.card, "border border-border bg-card p-5 md:p-6", shadow.card),

  emptyState: cn(
    radius.card,
    "border border-dashed border-border bg-muted/20 px-6 py-16 text-center",
  ),

  iconButton:
    "grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground",
  iconButtonSm:
    "grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",

  ctaPrimary: cn(
    radius.button,
    "inline-flex items-center justify-center gap-2 bg-copper px-6 py-2.5 text-sm font-semibold text-copper-foreground transition-colors hover:bg-copper/90",
  ),
  ctaSecondary: cn(
    radius.button,
    "inline-flex items-center justify-center gap-2 border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-copper/40 hover:text-copper",
  ),
  ctaDark: cn(
    radius.button,
    "inline-flex items-center justify-center gap-2 bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90",
  ),

  brandEyebrow: "text-[10px] font-semibold uppercase tracking-[0.16em] text-copper",
  labelCaps: typography.labelCaps,
  priceInline: typography.priceInline,
  priceHero: typography.priceHero,
  priceTotal: typography.priceTotal,
  pageTitle: typography.pageTitle,
  sectionTitle: typography.sectionTitle,
  eyebrow: typography.eyebrow,
} as const;
