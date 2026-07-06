"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type CategoryItem = {
  name: string;
  count: string;
  img: string;
  hover?: string | null;
  href: string;
  imageClassName?: string;
};

const CATEGORY_IMAGE_SIZES = "(min-width: 1024px) 210px, (min-width: 768px) 33vw, 50vw";

export function CategoryCard({ category, className }: { category: CategoryItem; className?: string }) {
  const [hoverReady, setHoverReady] = useState(false);

  const loadHover = () => {
    if (category.hover) setHoverReady(true);
  };

  return (
    <Link
      href={category.href}
      aria-label={`Explorar ${category.name}`}
      onMouseEnter={loadHover}
      onFocus={loadHover}
      className={cn(
        "group flex flex-col items-center rounded-2xl p-3 text-center outline-none transition-transform duration-300 motion-safe:hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-4 md:p-4",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex w-full items-center justify-center",
          category.imageClassName ?? "h-[140px] sm:h-[180px] md:h-[210px]",
        )}
      >
        <Image
          src={category.img}
          alt=""
          fill
          sizes={CATEGORY_IMAGE_SIZES}
          loading="lazy"
          className={cn(
            "object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.14)] transition-[opacity,transform] duration-500 ease-out motion-safe:group-hover:scale-[1.03]",
            category.hover && "motion-safe:group-hover:opacity-0",
          )}
        />
        {category.hover && hoverReady ? (
          <Image
            src={category.hover}
            alt=""
            fill
            sizes={CATEGORY_IMAGE_SIZES}
            loading="lazy"
            aria-hidden
            className="object-contain opacity-0 drop-shadow-[0_18px_28px_rgba(0,0,0,0.14)] transition-[opacity,transform] duration-500 ease-out motion-safe:group-hover:opacity-100 motion-safe:group-hover:scale-[1.03]"
          />
        ) : null}
      </div>

      <div className="mt-4">
        <h3 className="font-display text-base font-medium leading-tight tracking-tight text-foreground md:text-[17px]">
          {category.name}
        </h3>
        <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-copper">
          Explorar
          <span aria-hidden className="transition-transform duration-300 motion-safe:group-hover:translate-x-0.5">
            →
          </span>
        </p>
      </div>
    </Link>
  );
}
