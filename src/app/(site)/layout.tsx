import { Footer } from "@/components/site/footer";
import { HashScroll } from "@/components/site/hash-scroll";
import { SiteHeader, type HeaderProduct } from "@/components/site/header";
import { getCatalogProducts } from "@/lib/catalog";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const products = await getCatalogProducts();
  const headerProducts: HeaderProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand?.name ?? "",
    subcategory: p.subcategory?.name ?? "",
    price: p.price,
    image: p.images[0]?.url ?? "",
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader products={headerProducts} />
      <HashScroll />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
