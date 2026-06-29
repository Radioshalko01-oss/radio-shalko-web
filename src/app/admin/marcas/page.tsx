import { listAdminBrands } from "@/lib/admin/brand-queries";
import { BrandsManager } from "@/components/admin/brands-manager";

export default async function AdminMarcasPage() {
  const brands = await listAdminBrands();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Marcas</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {brands.length} marca{brands.length === 1 ? "" : "s"} · administra nombre, logo,
          descripción, orden y visibilidad.
        </p>
      </div>

      <BrandsManager initial={brands} />
    </div>
  );
}
