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
        label: "Guitarras",
        href: catalogHref({ cat: "Instrumentos", tipo: "guitarras" }),
        children: [
          {
            label: "Clásicas",
            href: catalogHref({
              cat: "Instrumentos",
              sub: "Guitarras acústicas",
              tipo: "clasicas",
            }),
          },
          {
            label: "Acústicas",
            sub: "Guitarras acústicas",
            href: catalogHref({ cat: "Instrumentos", sub: "Guitarras acústicas" }),
          },
          {
            label: "Electroacústicas",
            href: catalogHref({
              cat: "Instrumentos",
              sub: "Guitarras acústicas",
              tipo: "electroacusticas",
            }),
          },
          {
            label: "Eléctricas",
            sub: "Guitarras eléctricas",
            href: catalogHref({ cat: "Instrumentos", sub: "Guitarras eléctricas" }),
          },
        ],
      },
      {
        label: "Bajos",
        sub: "Bajos",
        href: catalogHref({ cat: "Instrumentos", sub: "Bajos" }),
        children: [
          {
            label: "Bajos eléctricos",
            href: catalogHref({
              cat: "Instrumentos",
              sub: "Bajos",
              tipo: "bajos-electricos",
            }),
          },
          {
            label: "Bajos acústicos",
            href: catalogHref({
              cat: "Instrumentos",
              sub: "Bajos",
              tipo: "bajos-acusticos",
            }),
          },
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
        href: catalogHref({ cat: "Instrumentos", tipo: "ukuleles" }),
        children: [
          {
            label: "Soprano",
            sub: "Ukuleles",
            href: catalogHref({
              cat: "Instrumentos",
              sub: "Ukuleles",
              instrumento: "soprano",
            }),
          },
          {
            label: "Concierto",
            sub: "Ukuleles",
            href: catalogHref({
              cat: "Instrumentos",
              sub: "Ukuleles",
              instrumento: "concierto",
            }),
          },
        ],
      },
      {
        label: "Teclados",
        sub: "Teclados",
        href: catalogHref({ cat: "Instrumentos", sub: "Teclados" }),
      },
      {
        label: "Baterías y percusión",
        href: catalogHref({ cat: "Instrumentos", tipo: "baterias-y-percusion" }),
        children: [
          {
            label: "Baterías",
            sub: "Baterías",
            href: catalogHref({ cat: "Instrumentos", sub: "Baterías" }),
          },
          {
            label: "Tarolas",
            href: catalogHref({
              cat: "Instrumentos",
              sub: "Baterías",
              tipo: "tarolas",
            }),
          },
          {
            label: "Platillos",
            href: catalogHref({
              cat: "Instrumentos",
              sub: "Baterías",
              tipo: "platillos",
            }),
          },
          {
            label: "Percusiones",
            href: catalogHref({
              cat: "Instrumentos",
              sub: "Baterías",
              tipo: "percusiones",
            }),
          },
          {
            label: "Accesorios de batería",
            href: catalogHref({
              cat: "Instrumentos",
              sub: "Baterías",
              tipo: "accesorios-de-bateria",
            }),
          },
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
        href: catalogHref({ cat: "Equipos de Audio", tipo: "bafles" }),
        children: [
          {
            label: "Pasivos",
            sub: "Bafles",
            href: catalogHref({
              cat: "Equipos de Audio",
              sub: "Bafles",
              instrumento: "pasivos",
            }),
          },
          {
            label: "Activos",
            sub: "Bafles",
            href: catalogHref({
              cat: "Equipos de Audio",
              sub: "Bafles",
              instrumento: "activos",
            }),
          },
        ],
      },
      {
        label: "Bocinas",
        href: catalogHref({ cat: "Equipos de Audio", tipo: "bocinas" }),
        children: [
          { label: "10 pulgadas", href: catalogHref({ cat: "Equipos de Audio", tipo: "bocinas", instrumento: "10" }) },
          { label: "12 pulgadas", href: catalogHref({ cat: "Equipos de Audio", tipo: "bocinas", instrumento: "12" }) },
          { label: "15 pulgadas", href: catalogHref({ cat: "Equipos de Audio", tipo: "bocinas", instrumento: "15" }) },
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
          { label: "Láser", href: catalogHref({ cat: "Equipos de Audio", tipo: "iluminacion-dmx", instrumento: "laser" }) },
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
  if (item.label === "Guitarras") return "Guitarras acústicas";
  return item.label;
}

/** Subcategoría BD + variant slug para un hijo del menú (tipo/variante). */
export function resolveChildClassification(
  parentItem: CatalogMenuItem,
  child: CatalogMenuItem,
): { subcategoryName: string; catalogVariant: string | null } {
  const parsed = parseCatalogHref(child.href);
  const subcategoryName =
    child.sub ?? parsed.sub ?? getSubcategoryNameForMenuItem(parentItem);
  const variantSlug = parsed.instrumento ?? parsed.tipo ?? null;

  if (child.sub && !variantSlug) {
    return { subcategoryName: child.sub, catalogVariant: null };
  }

  if (variantSlug) {
    return { subcategoryName, catalogVariant: variantSlug };
  }

  return { subcategoryName, catalogVariant: slugify(child.label) };
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

  let subName = getSubcategoryNameForMenuItem(typeItem);
  let catalogVariant: string | null = null;

  if (selection.variantLabel && typeItem.children?.length) {
    const variantChild = typeItem.children.find((c) => c.label === selection.variantLabel);
    if (!variantChild) return null;
    const resolved = resolveChildClassification(typeItem, variantChild);
    subName = resolved.subcategoryName;
    catalogVariant = resolved.catalogVariant;
  }

  const sub = category.subcategories.find(
    (s) => s.name.toLowerCase() === subName.toLowerCase(),
  );
  if (!sub) return null;

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
    if (item.children?.length) {
      for (const child of item.children) {
        const resolved = resolveChildClassification(item, child);
        if (resolved.subcategoryName.toLowerCase() !== subcategoryName.toLowerCase()) {
          continue;
        }

        const childVariant = resolved.catalogVariant?.toLowerCase() ?? null;
        const storedVariant = catalogVariant?.toLowerCase() ?? null;

        if (childVariant && storedVariant && childVariant !== storedVariant) {
          continue;
        }
        if (!childVariant && storedVariant) {
          continue;
        }

        return {
          familyKey: family.key,
          typeLabel: item.label,
          variantLabel: child.label,
        };
      }
    }

    const itemSub = getSubcategoryNameForMenuItem(item);
    if (itemSub.toLowerCase() !== subcategoryName.toLowerCase()) continue;

    let variantLabel: string | undefined;
    if (catalogVariant && item.children?.length) {
      const match = item.children.find((c) => {
        const r = resolveChildClassification(item, c);
        return r.catalogVariant?.toLowerCase() === catalogVariant.toLowerCase();
      });
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

/** Selección activa del filtro lateral / URL del catálogo público. */
export type CatalogFilterSelection = {
  familyCat: string | null;
  typeLabel: string | null;
  variantLabel: string | null;
};

export const EMPTY_CATALOG_FILTER: CatalogFilterSelection = {
  familyCat: null,
  typeLabel: null,
  variantLabel: null,
};

function childMatchesSearchParams(
  parentItem: CatalogMenuItem,
  child: CatalogMenuItem,
  sub?: string,
  variantSlug?: string | null,
): boolean {
  const resolved = resolveChildClassification(parentItem, child);
  const subOk = sub
    ? resolved.subcategoryName.toLowerCase() === sub.toLowerCase()
    : true;

  if (!variantSlug) {
    return false;
  }

  return subOk && resolved.catalogVariant?.toLowerCase() === variantSlug;
}

function typeFilterSlug(label: string): string {
  return slugify(label);
}

/** Deriva la selección del filtro desde query params (`cat`, `sub`, `tipo`, `instrumento`). */
export function catalogFilterFromSearchParams(params: {
  cat?: string;
  sub?: string;
  tipo?: string;
  instrumento?: string;
}): CatalogFilterSelection {
  const { cat, sub, tipo, instrumento } = params;
  const variantSlug = (instrumento ?? tipo)?.toLowerCase() ?? null;

  for (const family of CATALOG_FAMILIES) {
    if (cat && family.cat !== cat) continue;

    for (const item of family.items) {
      const itemSub = getSubcategoryNameForMenuItem(item);
      const parsed = parseCatalogHref(item.href);
      const groupSlug = typeFilterSlug(item.label);

      if (tipo && !sub && !instrumento && tipo.toLowerCase() === groupSlug) {
        return { familyCat: family.cat, typeLabel: item.label, variantLabel: null };
      }

      if (item.children?.length) {
        for (const child of item.children) {
          if (childMatchesSearchParams(item, child, sub, variantSlug)) {
            return {
              familyCat: family.cat,
              typeLabel: item.label,
              variantLabel: child.label,
            };
          }
        }
        if (sub && !variantSlug && itemSub.toLowerCase() === sub.toLowerCase()) {
          return { familyCat: family.cat, typeLabel: item.label, variantLabel: null };
        }
      } else {
        if (sub && itemSub.toLowerCase() === sub.toLowerCase() && !variantSlug) {
          return { familyCat: family.cat, typeLabel: item.label, variantLabel: null };
        }
        if (variantSlug && parsed.tipo?.toLowerCase() === variantSlug) {
          return { familyCat: family.cat, typeLabel: item.label, variantLabel: null };
        }
      }
    }
  }

  if (cat) {
    const family = CATALOG_FAMILIES.find((f) => f.cat === cat);
    if (family) return { familyCat: family.cat, typeLabel: null, variantLabel: null };
  }

  if (sub && !cat) {
    for (const family of CATALOG_FAMILIES) {
      const nested = catalogFilterFromSearchParams({
        cat: family.cat,
        sub,
        tipo,
        instrumento,
      });
      if (nested.typeLabel || nested.variantLabel) return nested;
    }
  }

  return EMPTY_CATALOG_FILTER;
}

/** Indica si un producto cumple la selección jerárquica del filtro. */
export function productMatchesCatalogFilter(
  product: {
    category?: { name: string } | null;
    subcategory?: { name: string } | null;
    catalogVariant?: string | null;
  },
  filter: CatalogFilterSelection,
): boolean {
  if (!filter.familyCat) return true;

  const cat = product.category?.name ?? "";
  const sub = product.subcategory?.name ?? "";
  const variant = (product.catalogVariant ?? "").toLowerCase();

  if (cat !== filter.familyCat) return false;
  if (!filter.typeLabel) return true;

  const family = CATALOG_FAMILIES.find((f) => f.cat === filter.familyCat);
  if (!family) return false;

  const typeItem = family.items.find((i) => i.label === filter.typeLabel);
  if (!typeItem) return false;

  if (!filter.variantLabel) {
    if (!typeItem.children?.length) {
      const subName = getSubcategoryNameForMenuItem(typeItem);
      const parsed = parseCatalogHref(typeItem.href);
      if (parsed.tipo && !typeItem.sub && !parsed.sub) {
        return variant === parsed.tipo.toLowerCase();
      }
      return sub.toLowerCase() === subName.toLowerCase();
    }
    return typeItem.children.some((child) => {
      const r = resolveChildClassification(typeItem, child);
      return sub.toLowerCase() === r.subcategoryName.toLowerCase();
    });
  }

  const child = typeItem.children?.find((c) => c.label === filter.variantLabel);
  if (!child) return false;

  const r = resolveChildClassification(typeItem, child);
  if (sub.toLowerCase() !== r.subcategoryName.toLowerCase()) return false;
  if (r.catalogVariant) return variant === r.catalogVariant.toLowerCase();
  return !variant;
}

/** Href de catálogo coherente con la selección del filtro (megamenú / sidebar). */
export function catalogFilterToHref(filter: CatalogFilterSelection): string {
  if (!filter.familyCat) return "/productos";

  const family = CATALOG_FAMILIES.find((f) => f.cat === filter.familyCat);
  if (!family || !filter.typeLabel) return catalogHref({ cat: filter.familyCat });

  const typeItem = family.items.find((i) => i.label === filter.typeLabel);
  if (!typeItem) return catalogHref({ cat: filter.familyCat });

  if (!filter.variantLabel) {
    if (typeItem.children?.length) {
      return catalogHref({
        cat: filter.familyCat,
        tipo: typeFilterSlug(filter.typeLabel),
      });
    }
    if (typeItem.href) {
      const u = new URL(typeItem.href, "http://local");
      return `${u.pathname}${u.search}`;
    }
    return catalogHref({ cat: filter.familyCat });
  }

  const child = typeItem.children?.find((c) => c.label === filter.variantLabel);
  if (child?.href) {
    const u = new URL(child.href, "http://local");
    return `${u.pathname}${u.search}`;
  }

  return catalogHref({ cat: filter.familyCat });
}

/** Clave estable para tipo/categoría en filtros multi-selección. */
export function catalogTypeKey(familyCat: string, typeLabel: string): string {
  return `${familyCat}::${typeLabel}`;
}

/** Clave estable para variante en filtros multi-selección. */
export function catalogVariantKey(
  familyCat: string,
  typeLabel: string,
  variantLabel: string,
): string {
  return `${familyCat}::${typeLabel}::${variantLabel}`;
}

/** Selección multi-filtro del sidebar (OR entre tokens activos). */
export type CatalogMultiFilterSelection = {
  families: Set<string>;
  types: Set<string>;
  variants: Set<string>;
};

export const EMPTY_CATALOG_MULTI_FILTER: CatalogMultiFilterSelection = {
  families: new Set(),
  types: new Set(),
  variants: new Set(),
};

export function cloneCatalogMultiFilter(
  filter: CatalogMultiFilterSelection,
): CatalogMultiFilterSelection {
  return {
    families: new Set(filter.families),
    types: new Set(filter.types),
    variants: new Set(filter.variants),
  };
}

function parseCatalogTypeKey(typeKey: string): { familyCat: string; typeLabel: string } | null {
  const sep = typeKey.indexOf("::");
  if (sep === -1) return null;
  return { familyCat: typeKey.slice(0, sep), typeLabel: typeKey.slice(sep + 2) };
}

function parseCatalogVariantKey(
  variantKey: string,
): { familyCat: string; typeLabel: string; variantLabel: string } | null {
  const parts = variantKey.split("::");
  if (parts.length < 3) return null;
  return {
    familyCat: parts[0],
    typeLabel: parts[1],
    variantLabel: parts.slice(2).join("::"),
  };
}

/**
 * Evita padre+hijo activos en la misma rama. Prioridad: variante > tipo > familia.
 * Filtros de ramas distintas se conservan (OR entre ramas).
 */
export function normalizeCatalogMultiFilter(
  filter: CatalogMultiFilterSelection,
): CatalogMultiFilterSelection {
  const families = new Set(filter.families);
  const types = new Set(filter.types);
  const variants = new Set(filter.variants);

  for (const variantKey of variants) {
    const parsed = parseCatalogVariantKey(variantKey);
    if (!parsed) continue;
    families.delete(parsed.familyCat);
    types.delete(catalogTypeKey(parsed.familyCat, parsed.typeLabel));
  }

  for (const typeKey of types) {
    const parsed = parseCatalogTypeKey(typeKey);
    if (!parsed) continue;
    families.delete(parsed.familyCat);
    const variantPrefix = `${parsed.familyCat}::${parsed.typeLabel}::`;
    for (const variantKey of variants) {
      if (variantKey.startsWith(variantPrefix)) variants.delete(variantKey);
    }
  }

  for (const familyCat of families) {
    const prefix = `${familyCat}::`;
    for (const typeKey of types) {
      if (typeKey.startsWith(prefix)) types.delete(typeKey);
    }
    for (const variantKey of variants) {
      if (variantKey.startsWith(prefix)) variants.delete(variantKey);
    }
  }

  return { families, types, variants };
}

export function clearCatalogMultiFilterFamilyBranch(
  filter: CatalogMultiFilterSelection,
  familyCat: string,
): void {
  const prefix = `${familyCat}::`;
  for (const typeKey of filter.types) {
    if (typeKey.startsWith(prefix)) filter.types.delete(typeKey);
  }
  for (const variantKey of filter.variants) {
    if (variantKey.startsWith(prefix)) filter.variants.delete(variantKey);
  }
}

export function clearCatalogMultiFilterTypeBranch(
  filter: CatalogMultiFilterSelection,
  typeKey: string,
): void {
  const variantPrefix = `${typeKey}::`;
  for (const variantKey of filter.variants) {
    if (variantKey.startsWith(variantPrefix)) filter.variants.delete(variantKey);
  }
}

export function isCatalogMultiFilterEmpty(filter: CatalogMultiFilterSelection): boolean {
  return filter.families.size === 0 && filter.types.size === 0 && filter.variants.size === 0;
}

/** Producto coincide si cumple al menos un token activo (OR). Sin filtros → todos. */
export function productMatchesMultiCatalogFilter(
  product: {
    category?: { name: string } | null;
    subcategory?: { name: string } | null;
    catalogVariant?: string | null;
  },
  filter: CatalogMultiFilterSelection,
): boolean {
  if (isCatalogMultiFilterEmpty(filter)) return true;

  for (const familyCat of filter.families) {
    if ((product.category?.name ?? "") === familyCat) return true;
  }

  for (const typeKey of filter.types) {
    const sep = typeKey.indexOf("::");
    if (sep === -1) continue;
    const familyCat = typeKey.slice(0, sep);
    const typeLabel = typeKey.slice(sep + 2);
    if (
      productMatchesCatalogFilter(product, {
        familyCat,
        typeLabel,
        variantLabel: null,
      })
    ) {
      return true;
    }
  }

  for (const variantKey of filter.variants) {
    const parts = variantKey.split("::");
    if (parts.length < 3) continue;
    const [familyCat, typeLabel, ...rest] = parts;
    const variantLabel = rest.join("::");
    if (
      productMatchesCatalogFilter(product, {
        familyCat,
        typeLabel,
        variantLabel,
      })
    ) {
      return true;
    }
  }

  return false;
}

/** Parsea query params (legacy single + multi `cats`/`types`/`variants`). */
export function catalogMultiFilterFromSearchParams(params: {
  cat?: string;
  sub?: string;
  tipo?: string;
  instrumento?: string;
  cats?: string;
  types?: string;
  variants?: string;
}): CatalogMultiFilterSelection {
  const families = new Set<string>();
  const types = new Set<string>();
  const variants = new Set<string>();

  const splitCsv = (value?: string) =>
    value
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  for (const c of splitCsv(params.cats)) families.add(c);
  for (const t of splitCsv(params.types)) types.add(t);
  for (const v of splitCsv(params.variants)) variants.add(v);

  if (families.size || types.size || variants.size) {
    return normalizeCatalogMultiFilter({ families, types, variants });
  }

  const legacy = catalogFilterFromSearchParams({
    cat: params.cat,
    sub: params.sub,
    tipo: params.tipo,
    instrumento: params.instrumento,
  });

  if (legacy.variantLabel && legacy.typeLabel && legacy.familyCat) {
    variants.add(
      catalogVariantKey(legacy.familyCat, legacy.typeLabel, legacy.variantLabel),
    );
  } else if (legacy.typeLabel && legacy.familyCat) {
    types.add(catalogTypeKey(legacy.familyCat, legacy.typeLabel));
  } else if (legacy.familyCat) {
    families.add(legacy.familyCat);
  }

  return normalizeCatalogMultiFilter({ families, types, variants });
}

/** Serializa multi-filtro a href (`cats`, `types`, `variants` comma-separated). */
export function catalogMultiFilterToHref(filter: CatalogMultiFilterSelection): string {
  const q = new URLSearchParams();
  if (filter.families.size) q.set("cats", [...filter.families].join(","));
  if (filter.types.size) q.set("types", [...filter.types].join(","));
  if (filter.variants.size) q.set("variants", [...filter.variants].join(","));
  const s = q.toString();
  return s ? `/productos?${s}` : "/productos";
}
