"use client";

import { Check, Share2 } from "lucide-react";
import { useCartShare } from "@/hooks/use-cart-share";
import type { SharedCartLineInput } from "@/lib/shared-cart/messages";
import { cn } from "@/lib/utils";

type CartShareActionsProps = {
  lines: SharedCartLineInput[];
  disabled?: boolean;
  compact?: boolean;
  variant?: "default" | "primary";
};

export function CartShareActions({
  lines,
  disabled,
  compact,
  variant = "default",
}: CartShareActionsProps) {
  const { loading, toast, shareCart } = useCartShare(lines);

  if (!lines.length) return null;

  const isPrimary = variant === "primary";

  return (
    <div className="relative">
      {toast && (
        <p
          role="status"
          className={cn(
            "mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-800",
            compact && "text-xs",
          )}
        >
          <Check className="mr-1.5 inline h-3.5 w-3.5" />
          {toast}
        </p>
      )}
      <button
        type="button"
        onClick={shareCart}
        disabled={disabled || loading}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-40",
          compact ? "h-10" : "h-11",
          isPrimary
            ? "bg-copper text-copper-foreground hover:bg-copper/90"
            : "border border-border bg-background font-medium text-foreground hover:bg-muted",
        )}
      >
        <Share2 className="h-4 w-4" />
        {loading ? "Generando…" : "Compartir carrito"}
      </button>
    </div>
  );
}
