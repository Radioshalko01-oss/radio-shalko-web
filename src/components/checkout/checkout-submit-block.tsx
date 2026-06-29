"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CheckoutSubmitBlockProps = {
  submitting?: boolean;
  className?: string;
  buttonClassName?: string;
  compact?: boolean;
};

export function CheckoutSubmitBlock({
  submitting,
  className,
  buttonClassName,
  compact,
}: CheckoutSubmitBlockProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Button
        type="submit"
        disabled={submitting}
        className={cn(
          "h-12 w-full rounded-full text-sm font-semibold",
          compact && "h-11",
          buttonClassName,
        )}
      >
        {submitting ? "Enviando…" : "Enviar solicitud"}
      </Button>
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        No se realizará ningún cobro en este momento.
      </p>
    </div>
  );
}
