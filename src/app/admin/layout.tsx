import { AdminSidebar } from "@/components/layout/admin-sidebar";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = {
  title: "Administración",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Defensa en profundidad: no confiar solo en el middleware.
  // Protege todas las rutas bajo /admin (actuales y futuras, incl. CRUD productos).
  await requireAdmin();

  return (
    <div className="flex min-h-screen bg-white">
      <AdminSidebar />
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
