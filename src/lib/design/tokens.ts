/**
 * Radio Shalko design tokens — Tailwind class bundles.
 * Aligns with DESIGN-1 audit and globals.css OKLCH palette.
 * Use these helpers for incremental visual consistency (DESIGN-2A+).
 */

export const typography = {
  /** Standard page H1 — mobile 1.5rem, desktop 1.875rem */
  pageTitle: "font-display text-2xl font-semibold tracking-tight md:text-3xl",
  /** Section headings inside a page */
  sectionTitle: "font-display text-lg font-semibold tracking-tight md:text-xl",
  /** Small caps label above page titles */
  eyebrow: "text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground",
  /** Body copy */
  body: "text-sm leading-relaxed md:text-base",
  bodySmall: "text-sm leading-relaxed",
  /** Secondary descriptive text */
  muted: "text-sm text-muted-foreground",
  /** Form field labels */
  label: "text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground",
  /** Summary / table column labels */
  labelCaps: "text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
  /** Button label default */
  button: "text-sm font-medium",
  /** Featured price (PDP, cards) */
  priceHero: "font-display text-xl font-semibold tabular-nums tracking-tight md:text-2xl",
  /** Inline price in lists */
  priceInline: "font-display text-base font-semibold tabular-nums",
  /** Cart / checkout / order totals — important but not billboard-sized */
  priceTotal: "font-display text-xl font-semibold tabular-nums tracking-tight md:text-2xl",
} as const;

export const spacing = {
  pageX: "px-5 md:px-8",
  pageTop: "pt-28 md:pt-32",
  pageContainer: "mx-auto w-full max-w-7xl",
  accountContainer: "mx-auto w-full max-w-3xl px-5 pb-28 pt-28 md:px-8 md:pt-32",
  accountContainerWide: "mx-auto w-full max-w-5xl px-5 pb-28 pt-28 md:px-8 md:pt-32",
  section: "mt-10",
  sectionLg: "mt-16",
  cardPadding: "p-5 md:p-6",
  formStack: "space-y-4",
  stackSm: "space-y-3",
} as const;

export const radius = {
  card: "rounded-2xl",
  cardAdmin: "rounded-xl",
  /** Primary CTAs on the public site */
  button: "rounded-full",
  /** Admin and compact UI actions */
  buttonAdmin: "rounded-lg",
  input: "rounded-lg",
  badge: "rounded-full",
} as const;

export const shadow = {
  card: "shadow-[0_12px_40px_-24px_rgba(0,0,0,0.12)]",
  cardStrong: "shadow-[0_12px_40px_-24px_rgba(0,0,0,0.15)]",
  dropdown: "shadow-lg",
  adminPanel: "shadow-sm",
} as const;

export const color = {
  textPrimary: "text-foreground",
  textMuted: "text-muted-foreground",
  borderSoft: "border-border",
  surface: "bg-card",
  accent: "text-copper",
  accentBg: "bg-copper text-copper-foreground",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-destructive",
  /** Admin shell — semantic tokens (DESIGN-2B) */
  adminText: "text-foreground",
  adminMuted: "text-muted-foreground",
  adminBorder: "border-border",
  adminSurface: "bg-card",
  adminSurfaceMuted: "bg-muted/40",
} as const;

export const tokens = {
  typography,
  spacing,
  radius,
  shadow,
  color,
} as const;

export type DesignTokens = typeof tokens;
