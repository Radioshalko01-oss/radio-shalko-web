import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { ProductDetail } from "@/components/catalog/product-detail";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Producto no encontrado" };
  }

  const brand = product.brand?.name;
  const title = brand ? `${product.name} · ${brand}` : product.name;
  const description =
    product.description ??
    product.subtitle ??
    `${product.name}${brand ? ` de ${brand}` : ""} en Radio Shalko. Consulta precio y disponibilidad en Chalco y Amecameca.`;
  const image = product.images[0]?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const related = await getRelatedProducts(product.id);

  return <ProductDetail product={product} related={related} />;
}
