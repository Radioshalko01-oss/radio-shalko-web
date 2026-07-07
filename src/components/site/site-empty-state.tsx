import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SiteEmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
  className?: string;
};

/** Estado vacío consistente en cuenta, favoritos y listas. */
export function SiteEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: SiteEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/15 px-6 py-14 text-center md:px-10 md:py-16",
        className,
      )}
    >
      <div className="grid h-14 w-14 place-items-center rounded-full bg-muted/80 text-muted-foreground">
        {icon}
      </div>
      <h2 className="mt-5 font-display text-lg font-medium tracking-tight text-foreground md:text-xl">
        {title}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-7 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
