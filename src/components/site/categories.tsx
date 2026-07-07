import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CategoryCard, type CategoryItem } from "@/components/site/category-card";
import { CATEGORY_MEDIA } from "@/lib/catalog-images";
import { countProducts } from "@/lib/products";
const M = CATEGORY_MEDIA;

function formatCount(n: number) {
  return String(n);
}

/** Orden del grid: 5 columnas × 2 filas en desktop */
const CATS: CategoryItem[] = [
  {
    name: "Guitarras acústicas",
    count: formatCount(countProducts({ sub: "Guitarras acústicas" })),
    img: M.acoustic.img,
    hover: M.acoustic.hover,
    href: "/productos?sub=Guitarras%20ac%C3%BAsticas",
  },
  {
    name: "Guitarras eléctricas",
    count: formatCount(countProducts({ sub: "Guitarras eléctricas" })),
    img: M.electric.img,
    hover: M.electric.hover,
    href: "/productos?sub=Guitarras%20el%C3%A9ctricas",
  },
  {
    name: "Bajos",
    count: formatCount(countProducts({ sub: "Bajos" })),
    img: M.bass.img,
    hover: M.bass.hover,
    href: "/productos?sub=Bajos",
  },
  {
    name: "Docerolas",
    count: formatCount(countProducts({ sub: "Docerolas" })),
    img: M.docerola.img,
    hover: M.docerola.hover,
    href: "/productos?sub=Docerolas",
  },
  {
    name: "Violines",
    count: formatCount(countProducts({ sub: "Violines" })),
    img: M.violin.img,
    hover: M.violin.hover,
    href: "/productos?sub=Violines",
  },
  {
    name: "Ukuleles",
    count: formatCount(countProducts({ sub: "Ukuleles" })),
    img: M.ukulele.img,
    hover: M.ukulele.hover,
    href: "/productos?sub=Ukuleles",
  },
  {
    name: "Baterías",
    count: formatCount(countProducts({ sub: "Baterías" })),
    img: M.drums.img,
    hover: M.drums.hover,
    href: "/productos?sub=Bater%C3%ADas",
  },
  {
    name: "Teclados",
    count: formatCount(countProducts({ sub: "Teclados" })),
    img: M.keys.img,
    hover: M.keys.hover,
    href: "/productos?sub=Teclados",
  },
  {
    name: "Bafles y audio",
    count: formatCount(countProducts({ cat: "Equipos de Audio" })),
    img: M.audio.img,
    hover: M.audio.hover,
    href: "/productos?cat=Equipos%20de%20Audio",
  },
  {
    name: "Accesorios",
    count: formatCount(countProducts({ cat: "Accesorios" })),
    img: M.accessories.img,
    hover: M.accessories.hover,
    href: "/productos?cat=Accesorios",
  },
];

export function Categories() {
  return (
    <section
      id="categorias"
      className="scroll-mt-20 border-b border-border bg-background pt-10 pb-6 md:scroll-mt-24 md:pt-16 md:pb-10"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="relative flex -translate-y-3 items-end justify-center gap-6 md:-translate-y-4">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Catálogo</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Compra por categoría
            </h2>
          </div>

          <Link
            href="/productos"
            className="group absolute right-0 top-0 hidden -translate-y-2.5 shrink-0 items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 transition-colors hover:text-copper hover:underline focus-visible:underline md:inline-flex md:-translate-y-3"
          >
            Ver todo
            <ArrowRight className="h-4 w-4 transition-transform duration-300 motion-safe:group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3.5 md:mt-10 md:grid-cols-3 md:gap-5 lg:grid-cols-5">
          {CATS.map((cat) => (
            <CategoryCard key={cat.href} category={cat} />
          ))}
        </div>

        <div className="mt-10 flex justify-center md:hidden">
          <Link
            href="/productos"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 transition-colors hover:text-copper hover:underline focus-visible:underline"
          >
            Ver todo
            <ArrowRight className="h-4 w-4 transition-transform duration-300 motion-safe:group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
