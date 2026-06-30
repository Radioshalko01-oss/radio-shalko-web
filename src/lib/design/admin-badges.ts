import { radius } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

/** Order status tones used by Sales OS admin + cliente mapping. */
export type OrderBadgeTone =
  | "pending"
  | "paid"
  | "cancelled"
  | "neutral"
  | "approved"
  | "ready";

/** Extended admin UI tones (catalog, sidebar, etc.). */
export type AdminBadgeTone =
  | OrderBadgeTone
  | "unpaid"
  | "preparing"
  | "delivered"
  | "soon"
  | "active"
  | "inactive"
  | "danger";

const BADGE_BASE = cn(
  "inline-flex shrink-0 items-center gap-1",
  radius.badge,
  "border px-2.5 py-0.5 text-xs font-medium leading-none",
);

const BADGE_STYLES: Record<AdminBadgeTone, string> = {
  pending: "border-amber-200/70 bg-amber-50/90 text-amber-900/90",
  approved: "border-copper/25 bg-copper/8 text-copper",
  unpaid: "border-border bg-muted/50 text-muted-foreground",
  paid: "border-emerald-200/70 bg-emerald-50/90 text-emerald-800",
  ready: "border-emerald-200/70 bg-emerald-50 text-emerald-900",
  preparing: "border-copper/20 bg-copper/5 text-foreground/85",
  delivered: "border-emerald-200/70 bg-emerald-50/90 text-emerald-800",
  cancelled: "border-border bg-muted/40 text-muted-foreground line-through decoration-muted-foreground/40",
  neutral: "border-border bg-muted/40 text-muted-foreground",
  soon: "border-border bg-card text-muted-foreground uppercase tracking-wide text-[10px]",
  active: "border-emerald-200/70 bg-emerald-50/90 text-emerald-800",
  inactive: "border-border bg-muted/40 text-muted-foreground",
  danger: "border-red-200/70 bg-red-50/90 text-red-800",
};

export function adminStatusBadgeClass(tone: AdminBadgeTone, className?: string): string {
  return cn(BADGE_BASE, BADGE_STYLES[tone], className);
}

/** Alias for order status helpers in status-labels.ts */
export function orderStatusBadgeClass(tone: OrderBadgeTone, className?: string): string {
  return adminStatusBadgeClass(tone, className);
}

export function publishedStatusBadgeClass(published: boolean): string {
  return adminStatusBadgeClass(published ? "active" : "inactive");
}

export const PUBLISHED_STATUS_LABELS = {
  true: "Publicado",
  false: "Oculto",
} as const;

export const ACTIVE_STATUS_LABELS = {
  true: "Activa",
  false: "Oculta",
} as const;
