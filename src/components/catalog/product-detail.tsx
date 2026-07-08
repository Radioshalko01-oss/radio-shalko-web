import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { MapPin } from "lucide-react";
import { formatPrice } from "@/lib/catalog/format";
import { isAvailable } from "@/lib/catalog/inventory";
import { spacing, typography } from "@/lib/design/tokens";
import { SITE_CONTACT } from "@/lib/site-contact";
import { productDetailBreadcrumbs } from "@/lib/site/breadcrumbs";
import { cn } from "@/lib/utils";
import type { CatalogProduct, CatalogSpec } from "@/lib/catalog/types";
import { getProductDetailSections, parseDetailLines } from "@/lib/catalog/product-detail-sections";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { ProductActions, ProductCompareButton } from "@/components/catalog/product-actions";
import { ProductCard } from "@/components/catalog/product-card";
import { PurchaseTrustNote } from "@/components/trust/purchase-trust-note";

function buildBreadcrumbs(product: CatalogProduct) {
  const base = productDetailBreadcrumbs(product);
  if (base.length === 0) return [{ label: product.name }];
  return [...base.slice(0, -1), base[base.length - 1]!, { label: product.name }];
}

function splitSpecs(specs: CatalogSpec[]) {
  const includes = specs.filter((s) => /incluye/i.test(s.label));
  const rest = specs.filter((s) => !/incluye/i.test(s.label));
  const midpoint = Math.ceil(rest.length / 2);
  return {
    specifications: rest.slice(0, midpoint),
    features: rest.slice(midpoint),
    includes: includes.length > 0 ? includes : null,
  };
}

function DetailTextList({ lines }: { lines: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-relaxed text-foreground/80">
      {lines.map((line, i) => (
        <li key={`${line}-${i}`} className="flex gap-2">
          <span className="text-muted-foreground">·</span>
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

function shortDescription(text: string | null, max = 220) {
  if (!text) return null;
  const lines = parseDetailLines(text);
  const plain = lines.length > 0 ? lines.join(" ") : text.trim();
  if (plain.length <= max) return { preview: plain, hasMore: lines.length > 1 || plain.length < text.trim().length };
  const cut = plain.slice(0, max).replace(/\s+\S*$/, "");
  return { preview: `${cut}…`, hasMore: true };
}

export function ProductDetail({
  product,
  related,
}: {
  product: CatalogProduct;
  related: CatalogProduct[];
}) {
  const { brand, category, subcategory } = product;
  const breadcrumbs = buildBreadcrumbs(product);
  const available = isAvailable(product.inventory);
  const desc = shortDescription(product.description ?? product.subtitle);
  const detailSections = getProductDetailSections(product);
  const legacySpecs = splitSpecs(product.specs);

  const storeNames = SITE_CONTACT.stores.map((s) => s.name).join(" y ");

  return (
    <div className={cn(spacing.pageContainer, spacing.pageX, "pt-[5.5rem] md:pt-[6.5rem]", "pb-24 md:pb-28")}>
      {/* Breadcrumbs */}
      <nav
        aria-label="Ubicación en el sitio"
        className="-mt-2 hidden flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground md:flex md:text-xs"
      >
        {breadcrumbs.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 ? <span className="mx-1.5 text-muted-foreground/40">›</span> : null}
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className={index === breadcrumbs.length - 1 ? "text-foreground/75" : undefined}>
                {item.label}
              </span>
            )}
          </Fragment>
        ))}
      </nav>

      {/* Hero producto — desktop: galería | info */}
      <div className="mt-3 grid gap-6 overflow-visible max-md:mt-1 lg:mt-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,32rem)] lg:items-start lg:gap-x-8 xl:grid-cols-[minmax(0,1fr)_minmax(300px,34rem)] xl:gap-x-12">
        <ProductGallery images={product.images} name={product.name} />

        <div className="min-w-0 self-start lg:col-start-2 lg:row-start-1 lg:w-full lg:max-w-[32rem] lg:justify-self-center lg:pt-0 xl:max-w-[34rem]">
          {product.isNew && (
            <span className="inline-flex rounded-md bg-[#f0ebe3] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/75">
              Nuevo
            </span>
          )}

          <div
            className={cn(
              "flex items-center justify-between gap-3 max-md:items-center",
              product.isNew ? "mt-3" : "mt-0",
            )}
          >
            <h1 className="min-w-0 flex-1 text-[1.5rem] font-medium leading-[1.12] tracking-[-0.03em] text-foreground sm:text-[1.875rem] md:text-[2.125rem] lg:text-[2.375rem]">
              {product.name}
            </h1>
            <ProductCompareButton
              product={product}
              placement="header"
              className="max-md:-mt-1 max-md:mr-1"
            />
          </div>

          {brand && (
            <p className="mt-2 text-sm text-muted-foreground">
              {brand.name}
              {subcategory ? ` · ${subcategory.name}` : category ? ` · ${category.name}` : ""}
            </p>
          )}

          <div className="mt-5 border-b border-border/60 pb-5">
            <p className="text-[1.75rem] font-semibold tabular-nums leading-none tracking-tight text-foreground sm:text-[2rem] md:text-[2.125rem]">
              {formatPrice(product.price)}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">IVA incluido</p>
          </div>

          {desc && (
            <div className="mt-5 text-sm leading-relaxed text-foreground/80">
              <p>{desc.preview}</p>
              {desc.hasMore && (
                <a
                  href="#detalle-producto"
                  className="mt-1 inline-block font-medium text-foreground underline-offset-2 hover:underline"
                >
                  Ver más
                </a>
              )}
            </div>
          )}

          <div className="mt-7">
            <ProductActions product={product} />
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-white px-3.5 py-3.5">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    available ? "bg-emerald-500" : "bg-amber-400",
                  )}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium leading-tight text-foreground">
                    {available ? "Disponible" : "Consultar disponibilidad"}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                    {available
                      ? "Confirmación con un asesor."
                      : "Escríbenos para confirmar existencias."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-white px-3.5 py-3.5">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-foreground/65" strokeWidth={1.75} />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium leading-tight text-foreground">Recoge en tienda</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                    {storeNames}.{" "}
                    <Link href="/contacto" className="underline-offset-2 hover:text-foreground hover:underline">
                      Ver tiendas
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <PurchaseTrustNote
            variant="strip"
            align="center"
            className="mt-4"
            lines={[
              "Compra asistida y segura. Antes de pagar, confirmamos disponibilidad y datos de tu pedido.",
            ]}
          />
        </div>
      </div>

      {/* Panel de detalle — 4 columnas como referencia */}
      <section
        id="detalle-producto"
        className="mt-14 scroll-mt-28 rounded-2xl border border-border/70 bg-[#fafafa] p-5 md:mt-16 md:p-8"
      >
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
          <DetailColumn title="Descripción" active>
            {(() => {
              const lines = parseDetailLines(product.description);
              if (lines.length > 1) {
                return <DetailTextList lines={lines} />;
              }
              if (lines.length === 1) {
                return (
                  <p className="text-sm leading-relaxed text-foreground/80">{lines[0]}</p>
                );
              }
              if (product.subtitle?.trim()) {
                return (
                  <p className="text-sm leading-relaxed text-foreground/80">{product.subtitle}</p>
                );
              }
              return (
                <p className="text-sm text-muted-foreground">Descripción próximamente.</p>
              );
            })()}
          </DetailColumn>

          <DetailColumn title="Especificaciones">
            {detailSections.specifications.length > 0 ? (
              <DetailTextList lines={detailSections.specifications} />
            ) : legacySpecs.specifications.length > 0 ? (
              <SpecList specs={legacySpecs.specifications} />
            ) : (
              <p className="text-sm text-muted-foreground">Consulta especificaciones con un asesor.</p>
            )}
          </DetailColumn>

          <DetailColumn title="Características">
            {detailSections.features.length > 0 ? (
              <DetailTextList lines={detailSections.features} />
            ) : legacySpecs.features.length > 0 ? (
              <SpecList specs={legacySpecs.features} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Detalles de construcción y acabados disponibles bajo consulta.
              </p>
            )}
          </DetailColumn>

          <DetailColumn title="Incluye">
            {detailSections.includes.length > 0 ? (
              <DetailTextList lines={detailSections.includes} />
            ) : legacySpecs.includes ? (
              <SpecList specs={legacySpecs.includes} />
            ) : (
              <ul className="space-y-2 text-sm leading-relaxed text-foreground/80">
                <li className="flex gap-2">
                  <span className="text-muted-foreground">·</span>
                  <span>El contenido puede variar según modelo y fabricante.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground">·</span>
                  <span>Confirma accesorios incluidos con nuestro equipo antes de comprar.</span>
                </li>
              </ul>
            )}
          </DetailColumn>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-12 md:mt-16">
          <h2 className={typography.sectionTitle}>También te puede interesar</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} variant="compact" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function DetailColumn({
  title,
  active,
  children,
}: {
  title: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <h2
        className={cn(
          "border-b pb-2.5 text-sm font-semibold tracking-tight text-foreground",
          active ? "border-foreground" : "border-transparent text-foreground/85",
        )}
      >
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SpecList({ specs }: { specs: { label: string; value: string }[] }) {
  return (
    <ul className="space-y-2 text-sm leading-relaxed text-foreground/80">
      {specs.map((spec) => (
        <li key={spec.label} className="flex gap-2">
          <span className="text-muted-foreground">·</span>
          <span>
            <span className="text-foreground/90">{spec.label}:</span> {spec.value}
          </span>
        </li>
      ))}
    </ul>
  );
}
