"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useStableMotion } from "@/lib/motion/use-stable-motion";
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

function ClosingCtaContent({
  eyebrow,
  title,
  description,
  primary = DEFAULT_PRIMARY,
  secondary,
  footnote = `WhatsApp: ${SITE_CONTACT.whatsapp.display}`,
}: Omit<SiteClosingCtaProps, "className">) {
  return (
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
  );
}

export function SiteClosingCta({
  eyebrow,
  title,
  description,
  primary = DEFAULT_PRIMARY,
  secondary,
  footnote = `WhatsApp: ${SITE_CONTACT.whatsapp.display}`,
  className,
}: SiteClosingCtaProps) {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useStableMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  const motionProps =
    mounted && !reduceMotion
      ? {
          initial: { opacity: 0, y: 14 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
        }
      : { initial: false as const };

  const cardClassName =
    "overflow-hidden rounded-2xl bg-[#1a1a1a] px-5 py-8 text-white sm:px-6 md:px-10 md:py-12";

  const contentProps = {
    eyebrow,
    title,
    description,
    primary,
    secondary,
    footnote,
  };

  return (
    <section className={cn("mx-auto mt-8 max-w-7xl px-5 md:mt-14 md:px-8", className)}>
      <div className={cn(cardClassName, "md:hidden")}>
        <ClosingCtaContent {...contentProps} />
      </div>
      <motion.div {...motionProps} className={cn(cardClassName, "hidden md:block")}>
        <ClosingCtaContent {...contentProps} />
      </motion.div>
    </section>
  );
}
