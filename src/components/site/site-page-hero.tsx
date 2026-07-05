import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import type { SiteBreadcrumbItem } from "@/lib/site/breadcrumbs";
import { cn } from "@/lib/utils";

export type SitePageHeroProps = {
  id?: string;
  breadcrumbs: SiteBreadcrumbItem[];
  title: string;
  description?: ReactNode;
  className?: string;
};

export function SitePageHero({
  id,
  breadcrumbs,
  title,
  description,
  className,
}: SitePageHeroProps) {
  return (
    <section
      id={id}
      className={cn("bg-[#1a1a1a] pt-28 text-white md:pt-32", className)}
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <header className="border-b border-white/15 pb-10 pt-1 md:pb-12 md:pt-2">
          <nav
            aria-label="Ubicación en el sitio"
            className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80"
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

          <div className="mx-auto -mt-5 flex max-w-2xl flex-col items-center text-center md:-mt-6">
            <h1 className="text-[1.875rem] font-medium uppercase tracking-[-0.03em] text-white md:text-[2.125rem]">
              {title}
            </h1>
            {description ? (
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75 md:mt-5 md:text-[15px]">
                {description}
              </p>
            ) : null}
          </div>
        </header>
      </div>
    </section>
  );
}
