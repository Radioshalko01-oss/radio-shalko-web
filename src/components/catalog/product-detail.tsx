import Link from "next/link";
import { formatPrice } from "@/lib/catalog/format";
import { typography } from "@/lib/design/tokens";
import { siteShell } from "@/lib/design/site-shell";
import { cn } from "@/lib/utils";
import type { CatalogProduct } from "@/lib/catalog/types";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { ProductActions } from "@/components/catalog/product-actions";
import { ProductCard } from "@/components/catalog/product-card";

/**
 * Vista de detalle de producto (PDP base · Fase 1 · C3).
 *
 * Server Component: solo presentación + datos de dominio (CatalogProduct).
 * La interacción (cotización/WhatsApp/llamar) y la galería viven en
 * subcomponentes cliente. Layout base, sin refinamiento visual avanzado.
 */
export function ProductDetail({
  product,
  related,
}: {
  product: CatalogProduct;
  related: CatalogProduct[];
}) {
  const { brand, category, subcategory } = product;

  return (
    <div className={siteShell.page}>
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Inicio
          </Link>
          <span aria-hidden>/</span>
          <Link href="/productos" className="hover:text-foreground">
            Productos
          </Link>
          {category && (
            <>
              <span aria-hidden>/</span>
              <Link
                href={`/productos?cat=${encodeURIComponent(category.name)}`}
                className="hover:text-foreground"
              >
                {category.name}
              </Link>
            </>
          )}
          {subcategory && (
            <>
              <span aria-hidden>/</span>
              <Link
                href={`/productos?sub=${encodeURIComponent(subcategory.name)}`}
                className="hover:text-foreground"
              >
                {subcategory.name}
              </Link>
            </>
          )}
        </nav>

        {/* Main */}
        <div className="mt-6 grid gap-10 md:grid-cols-2 md:gap-12">
          <ProductGallery images={product.images} name={product.name} />

          <div>
            {brand && (
              <Link
                href={`/marcas?b=${encodeURIComponent(brand.name)}`}
                className={cn(siteShell.brandEyebrow, "hover:underline")}
              >
                {brand.name}
              </Link>
            )}

            <h1 className={cn("mt-2", typography.pageTitle)}>{product.name}</h1>

            {product.subtitle && (
              <p className="mt-2 text-sm text-muted-foreground md:text-base">{product.subtitle}</p>
            )}

            <div className="mt-4 flex items-center gap-3">
              <p className={typography.priceHero}>{formatPrice(product.price)}</p>
              {product.isNew && (
                <span className="rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-background">
                  Nuevo
                </span>
              )}
            </div>

            {(category || subcategory) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {category && (
                  <span className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                    {category.name}
                  </span>
                )}
                {subcategory && (
                  <span className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                    {subcategory.name}
                  </span>
                )}
              </div>
            )}

            {product.description && (
              <p className="mt-6 text-sm leading-relaxed text-foreground/80">
                {product.description}
              </p>
            )}

            <div className="mt-8">
              <ProductActions product={product} />
            </div>

            {/* Disponibilidad por sucursal */}
            <div className={cn(siteShell.summaryPanel, "mt-8")}>
              <p className={siteShell.labelCaps}>Disponibilidad por sucursal</p>
              <ul className="mt-3 space-y-2">
                {product.inventory.length > 0 ? (
                  product.inventory.map((inv) => (
                    <li
                      key={inv.branch.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-foreground/90">{inv.branch.name}</span>
                      <span
                        className={
                          inv.quantity > 0 ? "font-medium text-foreground" : "text-muted-foreground"
                        }
                      >
                        {inv.quantity > 0 ? "Disponible" : "Consultar disponibilidad"}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground">
                    Consulta disponibilidad por WhatsApp o teléfono.
                  </li>
                )}
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Compra en tienda o a distancia con envío a domicilio. Te asesoramos antes de
                comprar.
              </p>
            </div>
          </div>
        </div>

        {/* Especificaciones */}
        {product.specs.length > 0 && (
          <section className="mt-16">
            <h2 className={typography.sectionTitle}>Especificaciones</h2>
            <dl className={cn(siteShell.card, "mt-5 max-w-2xl divide-y divide-border overflow-hidden p-0")}>
              {product.specs.map((spec) => (
                <div key={spec.id} className="flex justify-between gap-6 px-5 py-3 text-sm">
                  <dt className="text-muted-foreground">{spec.label}</dt>
                  <dd className="text-right font-medium text-foreground">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Relacionados */}
        {related.length > 0 && (
          <section className="mt-20">
            <h2 className={typography.sectionTitle}>También te puede interesar</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} variant="compact" />
              ))}
            </div>
          </section>
        )}
    </div>
  );
}
