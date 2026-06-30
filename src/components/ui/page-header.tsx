import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { color, typography } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

export type PageHeaderBackLink = {
  href: string;
  label: string;
  icon?: "chevron" | "arrow";
};

export type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  backLink?: PageHeaderBackLink;
  actions?: ReactNode;
  children?: ReactNode;
  /** Visual context — admin keeps zinc copy colors until DESIGN-2B */
  variant?: "site" | "account" | "admin";
  className?: string;
  titleClassName?: string;
};

const variantStyles = {
  site: {
    title: typography.pageTitle,
    description: cn(typography.muted, "mt-3 max-w-xl md:text-base"),
    eyebrow: typography.eyebrow,
    backLink: "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
    headerGap: "mt-2",
    titleAfterEyebrow: "mt-2",
  },
  account: {
    title: cn(typography.pageTitle, "text-foreground"),
    description: "mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground",
    eyebrow: typography.eyebrow,
    backLink: "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
    headerGap: "mt-4",
    titleAfterEyebrow: "mt-2",
  },
  admin: {
    title: cn(typography.pageTitle, color.adminText),
    description: cn("mt-1 max-w-2xl text-sm leading-relaxed", color.adminMuted),
    eyebrow: typography.eyebrow,
    backLink: cn("text-sm font-medium transition-colors", color.adminMuted, "hover:text-foreground"),
    headerGap: "",
    titleAfterEyebrow: "mt-1",
  },
} as const;

export function PageHeader({
  title,
  description,
  eyebrow,
  backLink,
  actions,
  children,
  variant = "site",
  className,
  titleClassName,
}: PageHeaderProps) {
  const styles = variantStyles[variant];
  const BackIcon = backLink?.icon === "arrow" ? ArrowLeft : ChevronLeft;

  return (
    <div className={className}>
      {backLink && (
        <Link href={backLink.href} className={cn("inline-flex items-center gap-1.5", styles.backLink)}>
          <BackIcon className="h-4 w-4" />
          {backLink.label}
        </Link>
      )}

      <header
        className={cn(
          backLink ? styles.headerGap : "",
          actions && "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        )}
      >
        <div className="min-w-0 flex-1">
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          <h1
            className={cn(
              eyebrow ? styles.titleAfterEyebrow : "",
              styles.title,
              titleClassName,
            )}
          >
            {title}
          </h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>

      {children}
    </div>
  );
}
