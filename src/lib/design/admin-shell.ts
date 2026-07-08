import { radius, typography } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

/** Shared admin shell class bundles — DESIGN-2B */
export const adminShell = {
  layoutBg: "bg-background",
  sidebar:
    "shrink-0 border-b border-border/80 bg-card max-lg:backdrop-blur-none lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:flex-col lg:border-b-0 lg:border-r lg:bg-card/40 lg:backdrop-blur-sm",
  main: "min-w-0 flex-1 bg-background",
  mainPadding: "px-4 py-6 sm:px-6 sm:py-7 md:px-8 md:py-8",

  card: cn(radius.cardAdmin, "border border-border bg-card"),
  cardInteractive: cn(
    radius.cardAdmin,
    "border border-border bg-card max-lg:transition-none max-lg:hover:shadow-none lg:transition-all lg:hover:border-copper/25 lg:hover:shadow-[0_8px_30px_-20px_rgba(0,0,0,0.1)]",
  ),
  cardSection: cn(radius.cardAdmin, "border border-border bg-card p-5"),
  cardToolbar: cn(radius.cardAdmin, "border border-border bg-card p-3"),

  sectionTitle: cn(typography.sectionTitle, "text-base md:text-lg text-foreground"),
  sectionTitleSm: "text-sm font-semibold text-foreground",
  sectionDesc: "mt-1 text-sm leading-relaxed text-muted-foreground",
  fieldLabel: "text-xs text-muted-foreground",
  groupLabel: typography.eyebrow,

  input: cn(
    radius.input,
    "h-9 w-full border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-copper/40 focus:outline-none focus:ring-2 focus:ring-copper/10",
  ),
  select: cn(
    radius.input,
    "h-9 border border-border bg-card px-2.5 text-sm text-foreground focus:border-copper/40 focus:outline-none focus:ring-2 focus:ring-copper/10",
  ),
  textarea: cn(
    radius.input,
    "w-full border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-copper/40 focus:outline-none focus:ring-2 focus:ring-copper/10",
  ),
  inputError: "border-red-300 focus:border-red-400 focus:ring-red-100",

  tableShell: cn(radius.cardAdmin, "overflow-x-auto border border-border bg-card"),
  tableHeadCell:
    "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
  tableCell: "px-4 py-3 text-sm text-foreground",
  tableRow: "border-b border-border/60 transition-colors hover:bg-muted/20 last:border-b-0",

  modalOverlay:
    "fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 max-lg:backdrop-blur-none lg:backdrop-blur-sm sm:p-6",
  modalPanel: cn(
    radius.cardAdmin,
    "mt-6 w-full max-w-md border border-border bg-card shadow-2xl sm:mt-10",
  ),
  dangerZone: cn(radius.cardAdmin, "border border-red-200/70 bg-red-50/40 p-5"),

  filterActive: cn(radius.badge, "bg-foreground px-3 text-xs font-medium text-background"),
  filterInactive: cn(
    radius.badge,
    "border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-copper/30 hover:text-foreground",
  ),

  alertBanner: cn(radius.cardAdmin, "border border-copper/20 bg-copper/5"),
  divider: "border-border/60",
  dividerSoft: "border-border/40",
  emptyState: cn(radius.cardAdmin, "border border-dashed border-border bg-card/60"),

  statValue: "text-2xl font-semibold tabular-nums leading-none text-foreground",
  statLabel: "text-sm text-muted-foreground",
  statSub: "mt-1 text-[11px] text-muted-foreground/80",

  backLink:
    "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
  mutedBox: cn(radius.input, "bg-muted/40 px-3 py-2"),

  /** Icon-only action in tables/lists */
  iconAction:
    "grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:opacity-40",
  iconActionActive: "border-copper/30 bg-copper/5 text-foreground",
} as const;
