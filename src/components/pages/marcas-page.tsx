"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BRANDS } from "@/lib/products";
import { OFFICIAL_BRANDS } from "@/lib/navigation/catalog-taxonomy";
import { formatPrice } from "@/lib/catalog/format";
import type { CatalogProduct } from "@/lib/catalog/types";
import { ArrowUpRight } from "lucide-react";
import { SitePageHero } from "@/components/site/site-page-hero";
import { SiteClosingCta } from "@/components/site/site-closing-cta";
import { whatsappHref, SITE_CONTACT } from "@/lib/site-contact";
import { marcasCatalogBreadcrumbs } from "@/lib/site/breadcrumbs";
import { siteShell } from "@/lib/design/site-shell";
import { typography } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

export function MarcasPage({
  products,
  brandNames,
}: {
  products: CatalogProduct[];
  /** Marcas activas reales (orden por sort_order). Fallback estático. */
  brandNames?: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = { b: searchParams.get("b") ?? undefined };
  const contentRef = useRef<HTMLElement | null>(null);
  const brandIndexRef = useRef<HTMLElement | null>(null);

  // Lista oficial de marcas como fuente de verdad; se conservan brandNames/BRANDS
  // como respaldo defensivo. Las secciones siguen dependiendo de productos reales.
  const activeBrands =
    OFFICIAL_BRANDS.length > 0
      ? OFFICIAL_BRANDS
      : brandNames && brandNames.length > 0
        ? brandNames
        : BRANDS;

  const [selectedBrand, setSelectedBrand] = useState<string | null>(() =>
    search.b && activeBrands.includes(search.b) ? search.b : null,
  );

  const productsByBrand = useMemo(() => {
    const map = new Map<string, CatalogProduct[]>();
    products.forEach((p) => {
      const brand = p.brand?.name;
      if (!brand) return;
      if (!map.has(brand)) map.set(brand, []);
      map.get(brand)!.push(p);
    });
    return map;
  }, [products]);

  const brandSections = useMemo(
    () =>
      activeBrands
        .filter((b) => productsByBrand.has(b))
        .map((b) => ({ brand: b, products: productsByBrand.get(b)! })),
    [activeBrands, productsByBrand],
  );

  const displaySections = useMemo(() => {
    if (!selectedBrand) return brandSections;
    const selectedProducts = productsByBrand.get(selectedBrand) ?? [];
    return [{ brand: selectedBrand, products: selectedProducts }];
  }, [brandSections, selectedBrand, productsByBrand]);

  const scrollToBrandContent = () => {
    const content = contentRef.current;
    if (!content) return;
    content.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scheduleScrollToContent = () => {
    window.setTimeout(scrollToBrandContent, 0);
  };

  const selectBrand = (brand: string) => {
    if (selectedBrand === brand) {
      setSelectedBrand(null);
      router.replace("/marcas", { scroll: false });
      scheduleScrollToContent();
      return;
    }

    setSelectedBrand(brand);
    const params = new URLSearchParams(searchParams.toString());
    params.set("b", brand);
    router.replace(`/marcas?${params.toString()}`, { scroll: false });
    scheduleScrollToContent();
  };

  useEffect(() => {
    if (search.b && activeBrands.includes(search.b)) {
      setSelectedBrand(search.b);
    } else if (!search.b) {
      setSelectedBrand(null);
    }
  }, [search.b, activeBrands]);

  const breadcrumbs = useMemo(
    () =>
      marcasCatalogBreadcrumbs(
        selectedBrand && activeBrands.includes(selectedBrand) ? selectedBrand : null,
      ),
    [selectedBrand, activeBrands],
  );

  return (
    <>
      <SitePageHero
        id="marcas"
        breadcrumbs={breadcrumbs}
        title="Marcas"
        description="Marcas líderes en instrumentos y audio profesional. Explora cada fabricante y encuentra el equipo que tu proyecto necesita."
      />

      {!selectedBrand ? (
        <section ref={brandIndexRef} className="border-b border-border/60 bg-background">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 px-5 py-3 max-md:flex-nowrap max-md:justify-start max-md:gap-2 max-md:overflow-x-auto max-md:overscroll-x-contain max-md:py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-3 md:px-8 md:py-4 [&::-webkit-scrollbar]:hidden">
            {activeBrands.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => selectBrand(brand)}
                aria-pressed={false}
                className="inline-flex h-9 shrink-0 items-center rounded-full border border-border/80 bg-card px-3.5 text-[13px] font-semibold tracking-[0.01em] text-foreground/75 transition-all duration-150 hover:border-copper/45 hover:bg-copper/[0.06] hover:text-copper motion-reduce:transition-none md:h-10 md:px-4"
              >
                {brand}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {selectedBrand ? (
        <section className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-40 border-y border-border/60 bg-background shadow-[0_8px_24px_-20px_rgba(0,0,0,0.25)] max-lg:backdrop-blur-none lg:bg-background/95 lg:backdrop-blur-md md:top-20">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div className="flex items-center justify-between gap-3 py-2.5 max-md:py-2">
              <button
                type="button"
                onClick={() => selectBrand(selectedBrand)}
                aria-pressed
                className="inline-flex h-9 shrink-0 items-center rounded-full border border-foreground bg-foreground px-4 text-[13px] font-semibold tracking-[0.01em] text-background shadow-[0_8px_20px_-12px_rgba(0,0,0,0.45)] transition-all duration-150 motion-reduce:transition-none"
              >
                {selectedBrand}
              </button>
              <button
                type="button"
                onClick={() => selectBrand(selectedBrand)}
                className="shrink-0 text-xs font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
              >
                Ver todas las marcas
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section
        ref={contentRef}
        className={cn(
          "mx-auto max-w-7xl px-5 pb-6 pt-5 md:px-8 md:pb-8 md:pt-6",
          selectedBrand
            ? "scroll-mt-[calc(3.5rem+2.75rem+env(safe-area-inset-top,0px))] md:scroll-mt-28"
            : "scroll-mt-[calc(3.5rem+env(safe-area-inset-top,0px))] md:scroll-mt-20",
        )}
      >
        <div className="space-y-5 md:space-y-7">
          {displaySections.map(({ brand, products }, idx) => {
            const id = `brand-${brand.toLowerCase().replace(/\s+/g, "-")}`;
            const visible = products.slice(0, 4);

            return (
              <article
                key={brand}
                id={id}
                className={cn(idx > 0 && "border-t border-border/60 pt-4 md:pt-5")}
              >
                <header className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="min-w-0 font-display text-2xl font-semibold tracking-tight md:text-3xl">
                      {brand}
                    </h2>
                    {products.length > 0 ? (
                      <Link
                        href={`/productos?brand=${encodeURIComponent(brand)}`}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-copper hover:text-copper sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                      >
                        Ver todo {brand}
                        <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Link>
                    ) : (
                      <a
                        href={whatsappHref(
                          SITE_CONTACT.whatsapp.e164,
                          `Hola, ¿tienen productos de la marca ${brand}?`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-copper hover:text-copper sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                      >
                        Consultar
                        <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {products.length > 0
                      ? `${products.length} productos disponibles`
                      : "Próximamente en tienda"}
                  </p>
                </header>

                {products.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Aún no tenemos productos de {brand} publicados en línea. Escríbenos y
                      te decimos qué modelos podemos conseguir para ti.
                    </p>
                  </div>
                ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {visible.map((p) => (
                    <Link
                      key={p.id}
                      href={`/productos/${p.slug}`}
                      className={cn(
                        siteShell.card,
                        "group overflow-hidden transition-colors hover:border-copper/50",
                      )}
                    >
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        {p.images[0] && (
                          <img
                            src={p.images[0].url}
                            alt={p.images[0].alt ?? p.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                          />
                        )}
                        {p.isNew && (
                          <span className="absolute left-3 top-3 rounded-full bg-copper px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-background">
                            Nuevo
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <p className={siteShell.brandEyebrow}>{p.subcategory?.name}</p>
                        <h3 className="mt-1.5 line-clamp-2 font-display text-sm font-medium leading-snug">
                          {p.name}
                        </h3>
                        <p className={cn(typography.priceInline, "mt-3")}>{formatPrice(p.price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <SiteClosingCta
        className="mt-0 pt-0 pb-14 md:pt-1 md:pb-20"
        eyebrow="Marcas que confiamos"
        title="Seleccionamos lo que realmente vale la pena"
        description="Nuestro catálogo refleja las marcas con las que trabajamos día a día. Si buscas un modelo que no ves aquí, consúltanos: revisamos disponibilidad con nuestra red de proveedores."
        primary={{
          label: "Consultar una marca",
          href: whatsappHref(SITE_CONTACT.whatsapp.e164, "Hola, ¿tienen productos de la marca:"),
          external: true,
        }}
        secondary={{ label: "Ver todos los productos", href: "/productos" }}
      />
    </>
  );
}
