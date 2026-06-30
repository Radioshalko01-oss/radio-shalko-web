import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { radius } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

const adminButtonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    radius.buttonAdmin,
  ),
  {
    variants: {
      variant: {
        primary: "bg-foreground text-background hover:bg-foreground/90",
        accent: "bg-copper text-copper-foreground hover:bg-copper/90",
        secondary:
          "border border-border bg-card text-foreground hover:border-copper/30 hover:bg-muted/40",
        ghost: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        danger:
          "border border-red-200/80 bg-red-50 text-red-800 hover:border-red-300 hover:bg-red-100/80",
        dangerSolid: "bg-red-600 text-white hover:bg-red-700",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-9 px-3.5",
        lg: "h-10 px-4",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface AdminButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof adminButtonVariants> {
  asChild?: boolean;
}

export function AdminButton({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: AdminButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(adminButtonVariants({ variant, size, className }))} {...props} />
  );
}

export { adminButtonVariants };
