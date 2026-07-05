export type SiteBreadcrumbItem = {
  label: string;
  href?: string;
};

/** Rutas base reutilizables en el sitio público. */
export const siteCrumbs = {
  home: { label: "Inicio", href: "/" },
  productos: { label: "Productos", href: "/productos" },
  marcas: { label: "Marcas", href: "/marcas" },
  servicios: { label: "Servicios", href: "/servicios" },
  contacto: { label: "Contacto", href: "/contacto" },
  garantia: { label: "Garantía", href: "/garantia" },
  favoritos: { label: "Favoritos", href: "/favoritos" },
  carrito: { label: "Carrito", href: "/carrito" },
  checkout: { label: "Checkout", href: "/checkout" },
  cuenta: { label: "Mi cuenta", href: "/cuenta" },
  pedidos: { label: "Mis pedidos", href: "/cuenta/pedidos" },
  notificaciones: { label: "Notificaciones", href: "/cuenta/notificaciones" },
} as const satisfies Record<string, SiteBreadcrumbItem>;

/** El último segmento representa la página actual y no lleva enlace. */
export function finalizeBreadcrumbs(items: SiteBreadcrumbItem[]): SiteBreadcrumbItem[] {
  if (items.length === 0) return items;
  return items.map((item, index) =>
    index === items.length - 1 ? { label: item.label } : item,
  );
}

export function productosCatalogBreadcrumbs(options: {
  category?: string | null;
  subcategory?: string | null;
  brand?: string | null;
  query?: string | null;
  parentCategoryForSub?: string | null;
}): SiteBreadcrumbItem[] {
  const items: SiteBreadcrumbItem[] = [siteCrumbs.home, siteCrumbs.productos];

  if (options.category) {
    items.push({
      label: options.category,
      href: `/productos?cat=${encodeURIComponent(options.category)}`,
    });
  }

  if (options.subcategory) {
    const parent = options.category ?? options.parentCategoryForSub;
    if (parent && !options.category) {
      items.push({
        label: parent,
        href: `/productos?cat=${encodeURIComponent(parent)}`,
      });
    }
    items.push({
      label: options.subcategory,
      href:
        parent != null
          ? `/productos?cat=${encodeURIComponent(parent)}&sub=${encodeURIComponent(options.subcategory)}`
          : `/productos?sub=${encodeURIComponent(options.subcategory)}`,
    });
  }

  if (options.brand && !options.category && !options.subcategory) {
    items.push({
      label: options.brand,
      href: `/productos?brand=${encodeURIComponent(options.brand)}`,
    });
  }

  const trimmedQuery = options.query?.trim();
  if (trimmedQuery) {
    items.push({ label: `"${trimmedQuery}"` });
  }

  return finalizeBreadcrumbs(items);
}

export function marcasCatalogBreadcrumbs(brand?: string | null): SiteBreadcrumbItem[] {
  const items: SiteBreadcrumbItem[] = [siteCrumbs.home, siteCrumbs.marcas];
  if (brand) {
    items.push({
      label: brand,
      href: `/marcas?b=${encodeURIComponent(brand)}`,
    });
  }
  return finalizeBreadcrumbs(items);
}

export function productDetailBreadcrumbs(product: {
  brand?: { name: string } | null;
  category?: { name: string } | null;
  subcategory?: { name: string } | null;
}): SiteBreadcrumbItem[] {
  const { brand, category, subcategory } = product;

  if (category) {
    return productosCatalogBreadcrumbs({
      category: category.name,
      subcategory: subcategory?.name ?? null,
      parentCategoryForSub: category.name,
    });
  }

  if (brand) {
    return marcasCatalogBreadcrumbs(brand.name);
  }

  return finalizeBreadcrumbs([siteCrumbs.home, siteCrumbs.productos]);
}
