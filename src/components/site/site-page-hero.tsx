import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import type { SiteBreadcrumbItem } from "@/lib/site/breadcrumbs";
import { cn } from "@/lib/utils";

export type SitePageHeroProps = {
  id?: string;
  breadcrumbs?: SiteBreadcrumbItem[];
  title: string;
  description?: ReactNode;
  /** default: hero centrado amplio; compact: más bajo */
  variant?: "default" | "compact";
  /** start: título alineado al inicio; center: título centrado en el panel (laptop+) */
  align?: "start" | "center";
  showBreadcrumbs?: boolean;
  className?: string;
};

export function SitePageHero({
  id,
  breadcrumbs = [],
  title,
  description,
  variant = "default",
  align = "start",
  showBreadcrumbs = true,
  className,
}: SitePageHeroProps) {
  const compact = variant === "compact";
  const centered = align === "center";

  return (
    <section
      id={id}
      className={cn(
        "bg-[#1a1a1a] pt-[calc(3.5rem+1.25rem+env(safe-area-inset-top,0px))] text-white max-md:pt-[calc(3.5rem+0.75rem+env(safe-area-inset-top,0px))] md:pt-36 lg:pt-32",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto px-5 md:px-8",
          compact ? "max-w-3xl" : "max-w-7xl",
        )}
      >
        <header
          className={cn(
            "border-b border-white/15",
            centered && compact
              ? "flex min-h-[7.5rem] flex-col items-center justify-center pb-5 text-center md:min-h-[8.5rem] md:pb-6"
              : centered
                ? "flex max-md:min-h-[5.5rem] max-md:flex-col max-md:justify-center pb-10 pt-1 text-center max-md:py-0 max-md:pb-5 md:flex md:flex-col md:items-center md:pb-12 md:pt-2"
                : compact
                  ? "pb-5 pt-1 max-md:pb-4 md:pb-6 md:pt-2"
                  : "flex max-md:min-h-[5.5rem] max-md:flex-col max-md:justify-center pb-10 pt-1 max-md:py-0 max-md:pb-5 md:min-h-[12.5rem] md:pb-16 md:pt-2 lg:min-h-0 lg:pb-12",
          )}
        >
          {showBreadcrumbs ? (
            <nav
              aria-label="Ubicación en el sitio"
              className={cn(
                "hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80 md:block",
                centered && !compact && "md:text-center",
              )}
            >
              {breadcrumbs.map((item, index) => (
                <Fragment key={`${item.label}-${index}`}>
                  {index > 0 ? <span aria-hidden="true"> / </span> : null}
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="transition-colors hover:text-white motion-reduce:transition-none"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span aria-current="page">{item.label}</span>
                  )}
                </Fragment>
              ))}
            </nav>
          ) : null}

          <div
            className={cn(
              centered
                ? compact
                  ? "flex flex-col items-center text-center"
                  : "mx-auto flex w-full max-w-2xl flex-col items-center text-center max-md:mt-0 md:mt-6"
                : compact
                  ? "mt-4 md:mt-5"
                  : "mx-auto flex max-w-2xl flex-col items-center text-center max-md:mt-0 md:mt-8",
            )}
          >
            <h1
              className={cn(
                "font-display font-medium uppercase tracking-[-0.03em] text-white",
                compact
                  ? "text-[1.625rem] md:text-[1.875rem]"
                  : "text-[1.875rem] md:text-[2.125rem]",
              )}
            >
              {title}
            </h1>
            {description ? (
              <p
                className={cn(
                  "text-sm leading-relaxed text-white/75 md:text-[15px]",
                  centered
                    ? "mt-2 max-w-md text-white/60"
                    : compact
                      ? "mt-2 max-w-lg text-white/60"
                      : "mt-4 max-w-md md:mt-5",
                )}
              >
                {description}
              </p>
            ) : null}
          </div>
        </header>
      </div>
    </section>
  );
}
