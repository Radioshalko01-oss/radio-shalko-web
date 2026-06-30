import { listAdminBrands } from "@/lib/admin/brand-queries";
import { BrandsManager } from "@/components/admin/brands-manager";
import { PageHeader } from "@/components/ui/page-header";

export default async function AdminMarcasPage() {
  const brands = await listAdminBrands();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        variant="admin"
        className="mb-6"
        title="Marcas"
        description={`${brands.length} marca${brands.length === 1 ? "" : "s"} · administra nombre, logo, descripción, orden y visibilidad.`}
      />

      <BrandsManager initial={brands} />
    </div>
  );
}
