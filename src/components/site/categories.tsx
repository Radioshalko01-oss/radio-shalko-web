import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CategoryCard, type CategoryItem } from "@/components/site/category-card";
import { CATALOG_IMAGES } from "@/lib/catalog-images";
import { countProducts } from "@/lib/products";

const IMG = CATALOG_IMAGES;

function formatCount(n: number) {
  return String(n);
}

const CATS: CategoryItem[] = [
  {
    name: "Guitarras eléctricas",
    count: formatCount(countProducts({ sub: "Guitarras eléctricas" })),
    img: IMG.electric,
    href: "/productos?sub=Guitarras%20el%C3%A9ctricas",
  },
  {
    name: "Guitarras acústicas",
    count: formatCount(countProducts({ sub: "Guitarras acústicas" })),
    img: IMG.acoustic,
    href: "/productos?sub=Guitarras%20ac%C3%BAsticas",
  },
  {
    name: "Bajos",
    count: formatCount(countProducts({ sub: "Bajos" })),
    img: IMG.bass,
    href: "/productos?sub=Bajos",
  },
  {
    name: "Docerolas",
    count: formatCount(countProducts({ sub: "Docerolas" })),
    img: IMG.docerola,
    href: "/productos?sub=Docerolas",
  },
  {
    name: "Violines",
    count: formatCount(countProducts({ sub: "Violines" })),
    img: IMG.violin,
    href: "/productos?sub=Violines",
  },
  {
    name: "Ukuleles",
    count: formatCount(countProducts({ sub: "Ukuleles" })),
    img: IMG.ukulele,
    href: "/productos?sub=Ukuleles",
  },
  {
    name: "Baterías",
    count: formatCount(countProducts({ sub: "Baterías" })),
    img: IMG.drums,
    href: "/productos?sub=Bater%C3%ADas",
  },
  {
    name: "Teclados",
    count: formatCount(countProducts({ sub: "Teclados" })),
    img: IMG.keys,
    href: "/productos?sub=Teclados",
  },
  {
    name: "Bafles y audio",
    count: formatCount(countProducts({ cat: "Equipos de Audio" })),
    img: IMG.audio,
    href: "/productos?cat=Equipos%20de%20Audio",
  },
  {
    name: "Accesorios",
    count: formatCount(countProducts({ cat: "Accesorios" })),
    img: IMG.accessories,
    href: "/productos?cat=Accesorios",
  },
];

type BentoSlot = {
  href: string;
  className: string;
  variant: "hero" | "tall" | "default" | "compact" | "wide";
  imageFit?: "cover" | "contain";
  imagePosition?: string;
  imageScale?: number;
  imageOffsetY?: string;
};

/**
 * Desktop: 3 columnas × 4 filas (referencia Canva)
 * Col 1: Baterías (2 filas) → Bafles + Accesorios → Bajos
 * Col 2: Docerolas → Teclados → Guitarras eléctricas (2 filas)
 * Col 3: Violines → Ukuleles → Guitarras acústicas (2 filas)
 */
const BENTO_LAYOUT: BentoSlot[] = [
  {
    href: "/productos?sub=Bater%C3%ADas",
    className:
      "col-span-2 row-span-2 md:col-span-4 md:col-start-1 md:row-start-1 md:row-span-2",
    variant: "hero",
    imageFit: "cover",
    imagePosition: "center center",
  },
  {
    href: "/productos?sub=Docerolas",
    className: "col-span-2 md:col-span-4 md:col-start-5 md:row-start-1",
    variant: "default",
    imageFit: "cover",
    imagePosition: "center center",
  },
  {
    href: "/productos?sub=Violines",
    className: "col-span-2 md:col-span-4 md:col-start-9 md:row-start-1",
    variant: "default",
    imageFit: "cover",
    imagePosition: "center 54%",
  },
  {
    href: "/productos?sub=Teclados",
    className: "col-span-1 md:col-span-4 md:col-start-5 md:row-start-2",
    variant: "default",
    imageFit: "cover",
    imagePosition: "center 52%",
  },
  {
    href: "/productos?sub=Ukuleles",
    className: "col-span-1 md:col-span-4 md:col-start-9 md:row-start-2",
    variant: "default",
    imageFit: "cover",
    imagePosition: "center center",
  },
  {
    href: "/productos?cat=Equipos%20de%20Audio",
    className: "col-span-1 md:col-span-2 md:col-start-1 md:row-start-3",
    variant: "compact",
    imageFit: "cover",
    imagePosition: "center center",
  },
  {
    href: "/productos?cat=Accesorios",
    className: "col-span-1 md:col-span-2 md:col-start-3 md:row-start-3",
    variant: "compact",
    imageFit: "cover",
    imagePosition: "center center",
  },
  {
    href: "/productos?sub=Guitarras%20el%C3%A9ctricas",
    className:
      "col-span-1 row-span-2 md:col-span-4 md:col-start-5 md:row-start-3 md:row-span-2",
    variant: "tall",
    imageFit: "cover",
    imagePosition: "center center",
    imageScale: 1.05,
    imageOffsetY: "-4%",
  },
  {
    href: "/productos?sub=Guitarras%20ac%C3%BAsticas",
    className:
      "col-span-1 row-span-2 md:col-span-4 md:col-start-9 md:row-start-3 md:row-span-2",
    variant: "tall",
    imageFit: "cover",
    imagePosition: "center center",
    imageScale: 1.1,
    imageOffsetY: "0%",
  },
  {
    href: "/productos?sub=Bajos",
    className: "col-span-2 md:col-span-4 md:col-start-1 md:row-start-4",
    variant: "wide",
    imageFit: "cover",
    imagePosition: "center center",
  },
];

export function Categories() {
  const byHref = Object.fromEntries(CATS.map((c) => [c.href, c]));

  return (
    <section
      id="categorias"
      className="scroll-mt-20 border-b border-border bg-background pt-14 pb-20 md:scroll-mt-24 md:pt-16 md:pb-24"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="relative flex -translate-y-3 items-end justify-center gap-6 md:-translate-y-4">
          <div className="text-center">
            <p className="-translate-y-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground md:-translate-y-3">
              Catálogo
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight md:mt-2.5 md:text-3xl">
              Compra por categoría
            </h2>
          </div>
          <Link
            href="/productos"
            className="absolute right-0 top-0 hidden -translate-y-2.5 items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline md:inline-flex md:-translate-y-3"
          >
            Ver todo
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        </div>

        <div className="mt-9 grid auto-rows-[minmax(168px,auto)] grid-cols-2 gap-3 md:mt-11 md:grid-cols-12 md:grid-rows-4 md:auto-rows-[minmax(172px,1fr)] md:gap-4">
          {BENTO_LAYOUT.map((slot) => {
            const cat = byHref[slot.href];
            if (!cat) return null;
            return (
              <CategoryCard
                key={cat.href}
                category={cat}
                variant={slot.variant}
                imageFit={slot.imageFit}
                imagePosition={slot.imagePosition}
                imageScale={slot.imageScale}
                imageOffsetY={slot.imageOffsetY}
                className={slot.className}
              />
            );
          })}
        </div>

        <div className="mt-12 flex justify-center md:hidden">
          <Link
            href="/productos"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-foreground/25"
          >
            Ver todo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
