"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Control de cantidad (− valor +). Mínimo 1. Usado en /cotizacion y el drawer.
 * Solo presentacional: delega el cambio al padre vía onChange.
 */
export function QuantityStepper({
  value,
  onChange,
  size = "md",
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const qty = Math.max(1, Math.floor(value || 1));
  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const iconCls = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-background",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Disminuir cantidad"
        onClick={() => onChange(Math.max(1, qty - 1))}
        disabled={qty <= 1}
        className={cn(
          "grid place-items-center rounded-full text-foreground/70 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent",
          dim,
        )}
      >
        <Minus className={iconCls} />
      </button>
      <span
        className={cn(
          "min-w-7 select-none text-center text-sm font-semibold tabular-nums",
          size === "sm" && "text-xs",
        )}
      >
        {qty}
      </span>
      <button
        type="button"
        aria-label="Aumentar cantidad"
        onClick={() => onChange(qty + 1)}
        className={cn(
          "grid place-items-center rounded-full text-foreground/70 transition-colors hover:bg-muted hover:text-foreground",
          dim,
        )}
      >
        <Plus className={iconCls} />
      </button>
    </div>
  );
}
