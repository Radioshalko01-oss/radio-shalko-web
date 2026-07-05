"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle, ArrowUpRight } from "lucide-react";
import { whatsappHref, SITE_CONTACT } from "@/lib/site-contact";
import { cn } from "@/lib/utils";

type ClosingAction = {
  label: string;
  href: string;
  external?: boolean;
};

type SiteClosingCtaProps = {
  eyebrow: string;
  title: string;
  description: string;
  primary?: ClosingAction;
  secondary?: ClosingAction;
  /** Nota fina bajo los botones. Por defecto muestra el WhatsApp. */
  footnote?: string;
  className?: string;
};

const DEFAULT_PRIMARY: ClosingAction = {
  label: "Asesoría por WhatsApp",
  href: whatsappHref(),
  external: true,
};

export function SiteClosingCta({
  eyebrow,
  title,
  description,
  primary = DEFAULT_PRIMARY,
  secondary,
  footnote = `WhatsApp: ${SITE_CONTACT.whatsapp.display}`,
  className,
}: SiteClosingCtaProps) {
  const reduceMotion = useReducedMotion();
  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-40px" },
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <section className={cn("mx-auto mt-12 max-w-7xl px-5 md:mt-14 md:px-8", className)}>
      <motion.div
        {...motionProps}
        className="overflow-hidden rounded-2xl bg-[#1a1a1a] px-6 py-10 text-white md:px-10 md:py-12"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight md:text-[1.65rem]">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70">{description}</p>

          <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row sm:flex-wrap">
            <a
              href={primary.href}
              target={primary.external ? "_blank" : undefined}
              rel={primary.external ? "noopener noreferrer" : undefined}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#1a1a1a] transition-opacity hover:opacity-90 sm:w-auto"
            >
              <MessageCircle className="h-4 w-4" />
              {primary.label}
            </a>
            {secondary ? (
              <Link
                href={secondary.href}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/25 px-6 text-sm font-medium text-white transition-colors hover:border-white/45 hover:bg-white/5 sm:w-auto"
              >
                {secondary.label}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>

          {footnote ? <p className="mt-5 text-xs text-white/50">{footnote}</p> : null}
        </div>
      </motion.div>
    </section>
  );
}
