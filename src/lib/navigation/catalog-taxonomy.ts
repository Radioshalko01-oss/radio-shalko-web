/**
 * Taxonomía del megamenú de productos — capa de presentación / navegación.
 * No modifica base de datos. Hrefs usan query params existentes (`cat`, `sub`, `brand`)
 * y params semánticos futuros (`tipo`, `instrumento`) documentados en el reporte 1B.3.
 */

export type CatalogMenuItem = {
  label: string;
  /** Subcategoría real del catálogo cuando existe en BD */
  sub?: string;
  /** Destino de navegación */
  href?: string;
  children?: CatalogMenuItem[];
};

export type CatalogFamily = {
  key: "instrumentos" | "accesorios" | "audio";
  title: string;
  cat: string;
  items: CatalogMenuItem[];
};

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function catalogHref(params: {
  cat?: string;
  sub?: string;
  tipo?: string;
  instrumento?: string;
}): string {
  const q = new URLSearchParams();
  if (params.cat) q.set("cat", params.cat);
  if (params.sub) q.set("sub", params.sub);
  if (params.tipo) q.set("tipo", params.tipo);
  if (params.instrumento) q.set("instrumento", params.instrumento);
  const s = q.toString();
  return s ? `/productos?${s}` : "/productos";
}

function acc(
  label: string,
  compat: string[],
  extra?: Partial<Pick<CatalogMenuItem, "sub">>,
): CatalogMenuItem {
  const tipo = slugify(label);
  return {
    label,
    sub: extra?.sub,
    href: catalogHref({ cat: "Accesorios", tipo }),
    children: compat.map((c) => ({
      label: c,
      href: catalogHref({
        cat: "Accesorios",
        tipo,
        instrumento: slugify(c),
      }),
    })),
  };
}

function accSimple(label: string, sub?: string): CatalogMenuItem {
  const tipo = slugify(label);
  return {
    label,
    sub,
    href: catalogHref({ cat: "Accesorios", tipo, ...(sub ? {} : {}) }),
  };
}

export const CATALOG_FAMILIES: CatalogFamily[] = [
  {
    key: "instrumentos",
    title: "Instrumentos",
    cat: "Instrumentos",
    items: [
      {
        label: "Guitarras acústicas",
        sub: "Guitarras acústicas",
        href: catalogHref({ cat: "Instrumentos", sub: "Guitarras acústicas" }),
      },
      {
        label: "Guitarras eléctricas",
        sub: "Guitarras eléctricas",
        href: catalogHref({ cat: "Instrumentos", sub: "Guitarras eléctricas" }),
      },
      {
        label: "Bajos",
        sub: "Bajos",
        href: catalogHref({ cat: "Instrumentos", sub: "Bajos" }),
        children: [
          {
            label: "Bajos eléctricos",
            sub: "Bajos",
            href: catalogHref({ cat: "Instrumentos", sub: "Bajos" }),
          },
          { label: "Bajos acústicos", href: catalogHref({ cat: "Instrumentos", sub: "Bajos" }) },
        ],
      },
      {
        label: "Docerolas",
        sub: "Docerolas",
        href: catalogHref({ cat: "Instrumentos", sub: "Docerolas" }),
      },
      {
        label: "Violines",
        sub: "Violines",
        href: catalogHref({ cat: "Instrumentos", sub: "Violines" }),
        children: [
          {
            label: "4/4",
            sub: "Violines",
            href: catalogHref({ cat: "Instrumentos", sub: "Violines", instrumento: "4-4" }),
          },
          {
            label: "3/4",
            sub: "Violines",
            href: catalogHref({ cat: "Instrumentos", sub: "Violines", instrumento: "3-4" }),
          },
          {
            label: "1/2",
            sub: "Violines",
            href: catalogHref({ cat: "Instrumentos", sub: "Violines", instrumento: "1-2" }),
          },
        ],
      },
      {
        label: "Ukuleles",
        sub: "Ukuleles",
        href: catalogHref({ cat: "Instrumentos", sub: "Ukuleles" }),
      },
      {
        label: "Teclados",
        sub: "Teclados",
        href: catalogHref({ cat: "Instrumentos", sub: "Teclados" }),
      },
      {
        label: "Baterías y percusión",
        href: catalogHref({ cat: "Instrumentos", sub: "Baterías" }),
        children: [
          {
            label: "Baterías",
            sub: "Baterías",
            href: catalogHref({ cat: "Instrumentos", sub: "Baterías" }),
          },
          { label: "Bongos", href: catalogHref({ cat: "Instrumentos", tipo: "bongos" }) },
          { label: "Tarolas", href: catalogHref({ cat: "Instrumentos", tipo: "tarolas" }) },
          { label: "Xilófonos", href: catalogHref({ cat: "Instrumentos", tipo: "xilofonos" }) },
        ],
      },
      { label: "Mandolinas", href: catalogHref({ cat: "Instrumentos", tipo: "mandolinas" }) },
      {
        label: "Instrumentos de viento",
        href: catalogHref({ cat: "Instrumentos", tipo: "viento" }),
        children: [
          { label: "Trompetas", href: catalogHref({ cat: "Instrumentos", tipo: "trompetas" }) },
          { label: "Cornetas", href: catalogHref({ cat: "Instrumentos", tipo: "cornetas" }) },
          { label: "Flautas", href: catalogHref({ cat: "Instrumentos", tipo: "flautas" }) },
          { label: "Melódicas", href: catalogHref({ cat: "Instrumentos", tipo: "melodicas" }) },
          { label: "Armónicas", href: catalogHref({ cat: "Instrumentos", tipo: "armonicas" }) },
        ],
      },
      { label: "Acordeones", href: catalogHref({ cat: "Instrumentos", tipo: "acordeones" }) },
    ],
  },
  {
    key: "accesorios",
    title: "Accesorios",
    cat: "Accesorios",
    items: [
      acc("Cuerdas", [
        "Guitarra eléctrica",
        "Guitarra acústica",
        "Guitarra clásica",
        "Bajo",
        "Violín",
        "Ukulele",
        "Docerola",
        "Mandolina",
      ]),
      acc("Fundas y estuches", [
        "Guitarra eléctrica",
        "Guitarra acústica",
        "Guitarra clásica",
        "Bajo",
        "Docerola",
        "Ukulele",
        "Teclado",
      ]),
      {
        label: "Cables",
        href: catalogHref({ cat: "Accesorios", tipo: "cables" }),
        children: [
          { label: "XLR / micrófono", href: catalogHref({ cat: "Accesorios", tipo: "cables", instrumento: "xlr" }) },
          { label: "TRS", href: catalogHref({ cat: "Accesorios", tipo: "cables", instrumento: "trs" }) },
          { label: "TS / instrumento", href: catalogHref({ cat: "Accesorios", tipo: "cables", instrumento: "ts" }) },
          { label: "RCA", href: catalogHref({ cat: "Accesorios", tipo: "cables", instrumento: "rca" }) },
          { label: "Speakon", href: catalogHref({ cat: "Accesorios", tipo: "cables", instrumento: "speakon" }) },
          { label: "Powercon", href: catalogHref({ cat: "Accesorios", tipo: "cables", instrumento: "powercon" }) },
        ],
      },
      acc("Amplificadores", ["Guitarra", "Bajo"], { sub: "Amplificadores" }),
      {
        label: "Pedales",
        href: catalogHref({ cat: "Accesorios", tipo: "pedales" }),
        children: [
          { label: "Pedal de sustain", href: catalogHref({ cat: "Accesorios", tipo: "pedales", instrumento: "pedal-de-sustain" }) },
          { label: "Distortion", href: catalogHref({ cat: "Accesorios", tipo: "pedales", instrumento: "distortion" }) },
          { label: "Fuzz", href: catalogHref({ cat: "Accesorios", tipo: "pedales", instrumento: "fuzz" }) },
          { label: "Compressor", href: catalogHref({ cat: "Accesorios", tipo: "pedales", instrumento: "compressor" }) },
          { label: "Chorus", href: catalogHref({ cat: "Accesorios", tipo: "pedales", instrumento: "chorus" }) },
          { label: "Flanger", href: catalogHref({ cat: "Accesorios", tipo: "pedales", instrumento: "flanger" }) },
          { label: "Delay", href: catalogHref({ cat: "Accesorios", tipo: "pedales", instrumento: "delay" }) },
          { label: "Reverb", href: catalogHref({ cat: "Accesorios", tipo: "pedales", instrumento: "reverb" }) },
        ],
      },
      accSimple("Afinadores"),
      accSimple("Capotrastes"),
      acc("Pastillas de amplificación", ["Guitarra", "Violín"]),
      accSimple("Audífonos"),
      {
        label: "Soportes y Atriles",
        href: catalogHref({ cat: "Accesorios", tipo: "soportes-y-atriles" }),
        children: [
          { label: "Soportes para micrófono", href: catalogHref({ cat: "Accesorios", tipo: "soportes-y-atriles", instrumento: "microfono" }) },
          { label: "Soportes para teclado", href: catalogHref({ cat: "Accesorios", tipo: "soportes-y-atriles", instrumento: "teclado" }) },
          { label: "Atriles para partituras", href: catalogHref({ cat: "Accesorios", tipo: "soportes-y-atriles", instrumento: "partituras" }) },
          { label: "Soportes para guitarra", href: catalogHref({ cat: "Accesorios", tipo: "soportes-y-atriles", instrumento: "guitarra" }) },
          { label: "Soportes para violín", href: catalogHref({ cat: "Accesorios", tipo: "soportes-y-atriles", instrumento: "violin" }) },
        ],
      },
    ],
  },
  {
    key: "audio",
    title: "Equipos de audio",
    cat: "Equipos de Audio",
    items: [
      {
        label: "Bafles",
        sub: "Bafles",
        href: catalogHref({ cat: "Equipos de Audio", sub: "Bafles" }),
      },
      {
        label: "Bocinas",
        href: catalogHref({ cat: "Equipos de Audio", tipo: "bocinas" }),
        children: [
          { label: "10 pulgadas", href: catalogHref({ cat: "Equipos de Audio", tipo: "bocinas", instrumento: "10" }) },
          { label: "12 pulgadas", href: catalogHref({ cat: "Equipos de Audio", tipo: "bocinas", instrumento: "12" }) },
          { label: "15 pulgadas", href: catalogHref({ cat: "Equipos de Audio", tipo: "bocinas", instrumento: "15" }) },
          { label: "18 pulgadas", href: catalogHref({ cat: "Equipos de Audio", tipo: "bocinas", instrumento: "18" }) },
        ],
      },
      { label: "Subwoofers", href: catalogHref({ cat: "Equipos de Audio", tipo: "subwoofers" }) },
      {
        label: "Mezcladoras",
        sub: "Mezcladoras",
        href: catalogHref({ cat: "Equipos de Audio", sub: "Mezcladoras" }),
        children: [
          { label: "Pasivas", sub: "Mezcladoras", href: catalogHref({ cat: "Equipos de Audio", sub: "Mezcladoras", instrumento: "pasivas" }) },
          { label: "Activas", sub: "Mezcladoras", href: catalogHref({ cat: "Equipos de Audio", sub: "Mezcladoras", instrumento: "activas" }) },
        ],
      },
      {
        label: "Micrófonos",
        href: catalogHref({ cat: "Equipos de Audio", tipo: "microfonos" }),
        children: [
          { label: "Dinámico", href: catalogHref({ cat: "Equipos de Audio", tipo: "microfonos", instrumento: "dinamico" }) },
          { label: "Condensador", href: catalogHref({ cat: "Equipos de Audio", tipo: "microfonos", instrumento: "condensador" }) },
        ],
      },
      { label: "Interfaces de audio", href: catalogHref({ cat: "Equipos de Audio", tipo: "interfaces" }) },
      { label: "Amplificadores de potencia", href: catalogHref({ cat: "Equipos de Audio", tipo: "amplificadores-potencia" }) },
      { label: "Crossover", href: catalogHref({ cat: "Equipos de Audio", tipo: "crossover" }) },
      { label: "Switcheras", href: catalogHref({ cat: "Equipos de Audio", tipo: "switcheras" }) },
      {
        label: "Iluminación y DMX",
        href: catalogHref({ cat: "Equipos de Audio", tipo: "iluminacion-dmx" }),
        children: [
          { label: "DMX", href: catalogHref({ cat: "Equipos de Audio", tipo: "iluminacion-dmx", instrumento: "dmx" }) },
          { label: "Cabezas robóticas", href: catalogHref({ cat: "Equipos de Audio", tipo: "iluminacion-dmx", instrumento: "cabezas-roboticas" }) },
          { label: "Spider", href: catalogHref({ cat: "Equipos de Audio", tipo: "iluminacion-dmx", instrumento: "spider" }) },
          { label: "Barras LED", href: catalogHref({ cat: "Equipos de Audio", tipo: "iluminacion-dmx", instrumento: "barras-led" }) },
          { label: "Luces de escenario", href: catalogHref({ cat: "Equipos de Audio", tipo: "iluminacion-dmx", instrumento: "luces-escenario" }) },
        ],
      },
    ],
  },
];

/** Marcas oficiales que se venden en Radio Shalko (fuente de verdad del menú). */
export const OFFICIAL_BRANDS = [
  "Casio",
  "SHURE",
  "Ibanez",
  "Extreme",
  "Century",
  "McCartney",
  "Segovia",
  "Epiphone",
  "Tagima",
  "Roland",
  "Fender",
  "Behringer",
  "Yamaha",
  "Radox",
  "Dannyukes",
  "Laney",
  "Meteoro",
  "JZG",
  "Kaiser",
  "AlíenPro",
  "Bellator",
  "Cort",
  "Evolution",
  "Jendrix",
  "Dandwood",
  "Purépecha",
  "Steelpro",
  "Elton",
  "Silvertone",
];

export const FEATURED_BRAND_CANDIDATES = [
  "Casio",
  "Yamaha",
  "Ibanez",
  "Tagima",
  "Behringer",
  "McCartney",
];

/** Slugs de las tres categorías raíz del catálogo (alineados a BD). */
export const OFFICIAL_CATEGORY_SLUGS: Record<string, string> = {
  Instrumentos: "instrumentos",
  Accesorios: "accesorios",
  "Equipos de Audio": "equipos-de-audio",
};

function walkMenuItems(
  items: CatalogMenuItem[],
  categoryName: string,
  out: Map<string, { categoryName: string; categorySlug: string; name: string; slug: string }>,
) {
  for (const item of items) {
    if (item.sub) {
      const key = `${categoryName}::${item.sub}`;
      if (!out.has(key)) {
        out.set(key, {
          categoryName,
          categorySlug: OFFICIAL_CATEGORY_SLUGS[categoryName] ?? slugify(categoryName),
          name: item.sub,
          slug: slugify(item.sub),
        });
      }
    }
    if (item.children?.length) walkMenuItems(item.children, categoryName, out);
  }
}

/** Parsea href del megamenú (`/productos?cat=…&sub=…&tipo=…`). */
export function parseCatalogHref(href?: string): {
  sub?: string;
  tipo?: string;
  instrumento?: string;
} {
  if (!href) return {};
  try {
    const u = new URL(href, "http://local");
    return {
      sub: u.searchParams.get("sub") ?? undefined,
      tipo: u.searchParams.get("tipo") ?? undefined,
      instrumento: u.searchParams.get("instrumento") ?? undefined,
    };
  } catch {
    return {};
  }
}

/** Nombre de subcategoría en BD para un ítem del megamenú. */
export function getSubcategoryNameForMenuItem(item: CatalogMenuItem): string {
  if (item.sub) return item.sub;
  const parsed = parseCatalogHref(item.href);
  if (parsed.sub) return parsed.sub;
  if (item.label === "Baterías y percusión") return "Baterías";
  return item.label;
}

export type CatalogTypeOption = {
  label: string;
  subcategoryName: string;
  variants: Array<{ label: string; slug: string }>;
};

/** Tipos de producto (nivel 2 del megamenú) por familia. */
export function getCatalogTypeOptions(
  familyKey: CatalogFamily["key"],
): CatalogTypeOption[] {
  const family = CATALOG_FAMILIES.find((f) => f.key === familyKey);
  if (!family) return [];

  return family.items.map((item) => ({
    label: item.label,
    subcategoryName: getSubcategoryNameForMenuItem(item),
    variants: (item.children ?? []).map((child) => ({
      label: child.label,
      slug: slugify(child.label),
    })),
  }));
}

/** Subcategorías oficiales = tipos de producto del megamenú (nivel 2). */
export function getOfficialCatalogTypeSubcategories(): Array<{
  categoryName: string;
  categorySlug: string;
  name: string;
  slug: string;
}> {
  const seen = new Map<
    string,
    { categoryName: string; categorySlug: string; name: string; slug: string }
  >();

  for (const family of CATALOG_FAMILIES) {
    for (const item of family.items) {
      const name = getSubcategoryNameForMenuItem(item);
      const key = `${family.cat}::${name}`;
      if (!seen.has(key)) {
        seen.set(key, {
          categoryName: family.cat,
          categorySlug: OFFICIAL_CATEGORY_SLUGS[family.cat] ?? slugify(family.cat),
          name,
          slug: slugify(name),
        });
      }
    }
  }

  return [...seen.values()];
}

export type ClassificationSelection = {
  familyKey: CatalogFamily["key"];
  typeLabel: string;
  variantLabel?: string;
};

/** Resuelve familia/tipo/variante → ids de categoría y subcategoría + slug de variante. */
export function resolveClassificationSelection(
  categories: Array<{ id: string; name: string; subcategories: Array<{ id: string; name: string }> }>,
  selection: ClassificationSelection,
): {
  categoryId: string;
  subcategoryId: string;
  catalogVariant: string | null;
} | null {
  const family = CATALOG_FAMILIES.find((f) => f.key === selection.familyKey);
  if (!family) return null;

  const typeItem = family.items.find((i) => i.label === selection.typeLabel);
  if (!typeItem) return null;

  const category = categories.find((c) => c.name === family.cat);
  if (!category) return null;

  const subName = getSubcategoryNameForMenuItem(typeItem);
  const sub = category.subcategories.find(
    (s) => s.name.toLowerCase() === subName.toLowerCase(),
  );
  if (!sub) return null;

  let catalogVariant: string | null = null;
  if (selection.variantLabel && typeItem.children?.length) {
    const variant = typeItem.children.find((c) => c.label === selection.variantLabel);
    if (variant) catalogVariant = slugify(selection.variantLabel);
  }

  return {
    categoryId: category.id,
    subcategoryId: sub.id,
    catalogVariant,
  };
}

/** Inicializa el picker desde un producto guardado. */
export function classificationFromStoredProduct(input: {
  categoryName?: string | null;
  subcategoryName?: string | null;
  catalogVariant?: string | null;
}): ClassificationSelection | null {
  const { categoryName, subcategoryName, catalogVariant } = input;
  if (!categoryName || !subcategoryName) return null;

  const family = CATALOG_FAMILIES.find((f) => f.cat === categoryName);
  if (!family) return null;

  for (const item of family.items) {
    const itemSub = getSubcategoryNameForMenuItem(item);
    if (itemSub.toLowerCase() !== subcategoryName.toLowerCase()) continue;

    let variantLabel: string | undefined;
    if (catalogVariant && item.children?.length) {
      const match = item.children.find((c) => slugify(c.label) === catalogVariant);
      if (match) variantLabel = match.label;
    }

    return {
      familyKey: family.key,
      typeLabel: item.label,
      variantLabel,
    };
  }

  return null;
}

/** Subcategorías de producto derivadas del megamenú (tipos nivel 2). */
export function getOfficialProductSubcategories() {
  return getOfficialCatalogTypeSubcategories();
}

/** Árbol de subcategorías por categoría (fallback cuando no hay BD). */
export function getOfficialCategoryTree(): Record<string, string[]> {
  const tree: Record<string, string[]> = {};
  for (const sub of getOfficialProductSubcategories()) {
    const list = tree[sub.categoryName] ?? [];
    if (!list.includes(sub.name)) list.push(sub.name);
    tree[sub.categoryName] = list;
  }
  return tree;
}

export function isOfficialBrandName(name: string): boolean {
  const lower = name.toLowerCase();
  return OFFICIAL_BRANDS.some((b) => b.toLowerCase() === lower);
}

export function sortByOfficialBrandOrder<T extends { name: string }>(brands: T[]): T[] {
  const order = new Map(OFFICIAL_BRANDS.map((n, i) => [n.toLowerCase(), i]));
  return [...brands].sort((a, b) => {
    const ia = order.get(a.name.toLowerCase()) ?? 999;
    const ib = order.get(b.name.toLowerCase()) ?? 999;
    return ia - ib || a.name.localeCompare(b.name, "es");
  });
}
