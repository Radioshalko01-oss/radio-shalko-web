"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import { siteShell } from "@/lib/design/site-shell";
import { cn } from "@/lib/utils";

export function useTrustMotion() {
  const reduceMotion = useReducedMotion();
  return reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-40px" },
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
      };
}

export function TrustPageBody({ children }: { children: ReactNode }) {
  return <div className="bg-background pb-16 md:pb-20">{children}</div>;
}

export function TrustSection({
  children,
  className,
  narrow,
  center,
}: {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
  /** Centra intro, cards y enlaces en secciones estrechas */
  center?: boolean;
}) {
  return (
    <section
      className={cn(
        "mx-auto px-5 pt-10 md:px-8 md:pt-12",
        narrow ? "max-w-3xl" : "max-w-7xl",
        center && "flex flex-col items-center text-center",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function TrustSectionIntro({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <header className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-[1.65rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}

export function TrustIconBadge({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground/70">
      <Icon className="h-5 w-5" />
    </span>
  );
}

export function TrustCard({
  icon,
  eyebrow,
  title,
  children,
  className,
  delay = 0,
}: {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const motionProps = useTrustMotion();
  return (
    <motion.article
      {...motionProps}
      transition={{ ...(motionProps as { transition?: object }).transition, delay }}
      className={cn(
        "rounded-2xl border border-border bg-card p-6 md:p-7",
        className,
      )}
    >
      {(icon || eyebrow) && (
        <div className="flex items-center gap-3">
          {icon ? <TrustIconBadge icon={icon} /> : null}
          {eyebrow ? <p className={siteShell.brandEyebrow}>{eyebrow}</p> : null}
        </div>
      )}
      <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-foreground md:text-xl">
        {title}
      </h3>
      <div className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </motion.article>
  );
}

export function TrustBulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-4 space-y-2.5 border-t border-border pt-5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/85">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-copper" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function TrustStepCard({
  step,
  title,
  description,
  delay = 0,
}: {
  step: string;
  title: string;
  description: string;
  delay?: number;
}) {
  const motionProps = useTrustMotion();
  return (
    <motion.article
      {...motionProps}
      transition={{ ...(motionProps as { transition?: object }).transition, delay }}
      className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 md:p-7"
    >
      <span className="font-mono text-[11px] font-semibold tracking-wider text-copper">
        {step}
      </span>
      <h3 className="mt-3 font-display text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </motion.article>
  );
}

export function TrustProseBlock({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: ReactNode;
  delay?: number;
}) {
  const motionProps = useTrustMotion();
  return (
    <motion.article
      {...motionProps}
      transition={{ ...(motionProps as { transition?: object }).transition, delay }}
      className="rounded-2xl border border-border bg-card p-6 md:p-7"
    >
      <h3 className="font-display text-lg font-semibold tracking-tight text-foreground md:text-xl">
        {title}
      </h3>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </motion.article>
  );
}

export function TrustRelatedLinks({
  links,
  center,
  className,
}: {
  links: { label: string; href: string }[];
  center?: boolean;
  className?: string;
}) {
  return (
    <nav
      aria-label="Páginas relacionadas"
      className={cn(
        "mt-8 flex flex-wrap gap-3 border-t border-border pt-6",
        center && "justify-center",
        className,
      )}
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground/25"
        >
          {link.label}
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
      ))}
    </nav>
  );
}

export function TrustDisclaimer({ children }: { children: ReactNode }) {
  return (
    <p className="mt-8 rounded-xl border border-border/80 bg-muted/20 px-5 py-4 text-xs leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

export function TrustFaqList({
  items,
}: {
  items: readonly { q: string; a: string }[];
}) {
  const motionProps = useTrustMotion();
  return (
    <dl className="mt-8 w-full overflow-hidden rounded-2xl border border-border bg-card">
      {items.map((item, index) => (
        <motion.div
          key={item.q}
          {...motionProps}
          transition={{ ...(motionProps as { transition?: object }).transition, delay: index * 0.04 }}
          className={cn(
            "px-6 py-5 text-left md:px-8 md:py-6",
            index > 0 && "border-t border-border/80",
          )}
        >
          <dt className="font-display text-base font-semibold tracking-tight text-foreground md:text-[1.05rem]">
            {item.q}
          </dt>
          <dd className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{item.a}</dd>
        </motion.div>
      ))}
    </dl>
  );
}
