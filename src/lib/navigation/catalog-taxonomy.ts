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
        "Vihuela",
        "Requinto",
        "Tricordio",
      ]),
      acc("Fundas y estuches", [
        "Guitarra eléctrica",
        "Guitarra acústica",
        "Guitarra clásica",
        "Bajo",
        "Docerola",
        "Ukulele",
        "Violín",
        "Teclado",
        "Mandolina",
      ]),
      acc("Cables", [
        "Instrumento",
        "Micrófono",
        "RCA",
        "TRS",
        "TS",
        "Speakon",
        "Powercon",
      ], { sub: "Cables" }),
      acc("Amplificadores", ["Guitarra", "Bajo"], { sub: "Amplificadores" }),
      acc("Pedales de efectos", ["Guitarra", "Bajo"], { sub: "Pedales" }),
      {
        label: "Pedal de sustain",
        href: catalogHref({ cat: "Accesorios", tipo: "pedal-de-sustain" }),
        children: [
          {
            label: "Teclado",
            href: catalogHref({
              cat: "Accesorios",
              tipo: "pedal-de-sustain",
              instrumento: "teclado",
            }),
          },
        ],
      },
      {
        label: "Afinadores",
        href: catalogHref({ cat: "Accesorios", tipo: "afinadores" }),
        children: [
          {
            label: "Universal",
            href: catalogHref({
              cat: "Accesorios",
              tipo: "afinadores",
              instrumento: "universal",
            }),
          },
        ],
      },
      accSimple("Capotrastes"),
      acc("Pastillas de amplificación", ["Guitarra", "Violín"]),
      accSimple("Audífonos"),
      accSimple("Interfaces"),
      {
        label: "Pedestales de micrófono",
        href: catalogHref({ cat: "Accesorios", tipo: "pedestales-de-microfono" }),
        children: [
          {
            label: "Micrófono",
            href: catalogHref({
              cat: "Accesorios",
              tipo: "pedestales-de-microfono",
              instrumento: "microfono",
            }),
          },
        ],
      },
      {
        label: "Bases de teclado",
        href: catalogHref({ cat: "Accesorios", tipo: "bases-de-teclado" }),
        children: [
          {
            label: "Teclado",
            href: catalogHref({
              cat: "Accesorios",
              tipo: "bases-de-teclado",
              instrumento: "teclado",
            }),
          },
        ],
      },
      {
        label: "Atriles de partituras",
        href: catalogHref({ cat: "Accesorios", tipo: "atriles-de-partituras" }),
        children: [
          {
            label: "Universal",
            href: catalogHref({
              cat: "Accesorios",
              tipo: "atriles-de-partituras",
              instrumento: "universal",
            }),
          },
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
      },
      { label: "Micrófonos", href: catalogHref({ cat: "Equipos de Audio", tipo: "microfonos" }) },
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
      {
        label: "Cables de audio",
        href: catalogHref({ cat: "Equipos de Audio", tipo: "cables-audio" }),
        children: [
          { label: "XLR / micrófono", href: catalogHref({ cat: "Equipos de Audio", tipo: "cables-audio", instrumento: "xlr" }) },
          { label: "TRS", href: catalogHref({ cat: "Equipos de Audio", tipo: "cables-audio", instrumento: "trs" }) },
          { label: "TS", href: catalogHref({ cat: "Equipos de Audio", tipo: "cables-audio", instrumento: "ts" }) },
          { label: "RCA", href: catalogHref({ cat: "Equipos de Audio", tipo: "cables-audio", instrumento: "rca" }) },
          { label: "Speakon", href: catalogHref({ cat: "Equipos de Audio", tipo: "cables-audio", instrumento: "speakon" }) },
          { label: "Powercon", href: catalogHref({ cat: "Equipos de Audio", tipo: "cables-audio", instrumento: "powercon" }) },
        ],
      },
    ],
  },
];

export const FEATURED_BRAND_CANDIDATES = [
  "Fender",
  "Yamaha",
  "Roland",
  "Pearl",
  "Behringer",
  "Gibson",
  "Taylor",
  "Ibanez",
  "JBL",
];
