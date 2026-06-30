import type { ReactNode } from "react";
import {
  adminStatusBadgeClass,
  type AdminBadgeTone,
  type OrderBadgeTone,
} from "@/lib/design/admin-badges";
import { cn } from "@/lib/utils";

type AdminStatusBadgeProps = {
  tone: AdminBadgeTone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
};

export function AdminStatusBadge({ tone, children, className, dot }: AdminStatusBadgeProps) {
  return (
    <span className={adminStatusBadgeClass(tone, className)}>
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            tone === "active" || tone === "paid" || tone === "ready" || tone === "delivered"
              ? "bg-emerald-500"
              : tone === "inactive" || tone === "cancelled"
                ? "bg-muted-foreground/50"
                : tone === "pending"
                  ? "bg-amber-500/80"
                  : tone === "approved" || tone === "preparing"
                    ? "bg-copper"
                    : "bg-muted-foreground/40",
          )}
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}

/** Order list/detail badge — wraps orderStatusUi tone. */
export function AdminOrderStatusBadge({
  tone,
  children,
  className,
}: {
  tone: OrderBadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AdminStatusBadge tone={tone} className={className}>
      {children}
    </AdminStatusBadge>
  );
}
