import Link from "next/link";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/marcas", label: "Marcas" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/servicios", label: "Servicios" },
] as const;

export function AdminSidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-zinc-200 bg-zinc-50 p-4">
      <Link href="/admin" className="block text-sm font-semibold text-zinc-900">
        Panel Admin
      </Link>
      <nav className="mt-6 flex flex-col gap-1" aria-label="Admin">
        {ADMIN_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-white hover:text-zinc-900"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <Link
        href="/"
        className="mt-8 block text-sm text-zinc-500 hover:text-zinc-900"
      >
        ← Volver al sitio
      </Link>
    </aside>
  );
}
