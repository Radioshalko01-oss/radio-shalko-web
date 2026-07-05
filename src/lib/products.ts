








import {
  getOfficialCategoryTree,
  OFFICIAL_BRANDS,
} from "@/lib/navigation/catalog-taxonomy";

export type Category = "Instrumentos" | "Accesorios" | "Equipos de Audio";
export type Subcategory =
  | "Guitarras acústicas"
  | "Guitarras eléctricas"
  | "Bajos"
  | "Docerolas"
  | "Teclados"
  | "Violines"
  | "Baterías"
  | "Ukuleles"
  | "Amplificadores"
  | "Pedales"
  | "Cables"
  | "Mezcladoras"
  | "Bafles";

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: Category;
  subcategory: Subcategory;
  price: number;
  image: string;
  /** Galería opcional; si no existe, se usa imagen + vista alterna por subcategoría. */
  images?: string[];
  isNew?: boolean;
};

/** Segunda vista para hover / carrusel en tarjetas destacadas. */
const GALLERY_ALT: Record<Subcategory, string> = {
  "Guitarras acústicas": "/images/cat-electric.jpg",
  "Guitarras eléctricas": "/images/hero-guitar.jpg",
  Bajos: "/images/cat-drums.jpg",
  Docerolas: "/images/categories/cat-grid-docerola.jpg",
  Teclados: "/images/hero-keys.jpg",
  Violines: "/images/cat-acoustic.jpg",
  Baterías: "/images/hero-drums.jpg",
  Ukuleles: "/images/cat-violin.jpg",
  Amplificadores: "/images/cat-speaker.jpg",
  Pedales: "/images/cat-bass.jpg",
  Cables: "/images/cat-mixer.jpg",
  Mezcladoras: "/images/cat-speaker.jpg",
  Bafles: "/images/cat-mixer.jpg",
};

export function getProductImages(product: Product): string[] {
  if (product.images?.length) return product.images;
  const alt = GALLERY_ALT[product.subcategory];
  if (alt === product.image) return [product.image];
  return [product.image, alt];
}

const officialTree = getOfficialCategoryTree();

export const CATEGORY_TREE: Record<Category, Subcategory[]> = {
  Instrumentos: (officialTree.Instrumentos ?? []) as Subcategory[],
  Accesorios: (officialTree.Accesorios ?? []) as Subcategory[],
  "Equipos de Audio": (officialTree["Equipos de Audio"] ?? []) as Subcategory[],
};

export const BRANDS = [...OFFICIAL_BRANDS];

const IMG: Record<Subcategory, string> = {
  "Guitarras acústicas": "/images/categories/cat-grid-acoustic.jpg",
  "Guitarras eléctricas": "/images/categories/cat-grid-electric.jpg",
  Bajos: "/images/categories/cat-grid-bass.jpg",
  Docerolas: "/images/categories/cat-grid-docerola.jpg",
  Teclados: "/images/hero-keys.jpg",
  Violines: "/images/cat-violin.jpg",
  Baterías: "/images/hero-drums.jpg",
  Ukuleles: "/images/cat-acoustic.jpg",
  Amplificadores: "/images/cat-electric.jpg",
  Pedales: "/images/cat-electric.jpg",
  Cables: "/images/cat-mixer.jpg",
  Mezcladoras: "/images/cat-mixer.jpg",
  Bafles: "/images/cat-speaker.jpg",
};

const SAMPLES: Array<Omit<Product, "id" | "image">> = [
  { name: "Guitarra Acústica CD-60S", brand: "Fender", category: "Instrumentos", subcategory: "Guitarras acústicas", price: 5800, isNew: true },
  { name: "Guitarra Acústica FG800", brand: "Yamaha", category: "Instrumentos", subcategory: "Guitarras acústicas", price: 6200 },
  { name: "Guitarra Electroacústica Segovia C40", brand: "Yamaha", category: "Instrumentos", subcategory: "Guitarras acústicas", price: 3800 },
  { name: "Guitarra Acústica Dreadnought DX1", brand: "Martin", category: "Instrumentos", subcategory: "Guitarras acústicas", price: 12500 },
  { name: "Guitarra Acústica 114ce", brand: "Taylor", category: "Instrumentos", subcategory: "Guitarras acústicas", price: 18900 },
  { name: "Stratocaster Player Series", brand: "Fender", category: "Instrumentos", subcategory: "Guitarras eléctricas", price: 12500, isNew: true },
  { name: "Telecaster Standard", brand: "Squier", category: "Instrumentos", subcategory: "Guitarras eléctricas", price: 6800 },
  { name: "Les Paul Studio", brand: "Gibson", category: "Instrumentos", subcategory: "Guitarras eléctricas", price: 24800 },
  { name: "Les Paul Special VE", brand: "Epiphone", category: "Instrumentos", subcategory: "Guitarras eléctricas", price: 4900 },
  { name: "RG421 Eléctrica", brand: "Ibanez", category: "Instrumentos", subcategory: "Guitarras eléctricas", price: 9800 },
  { name: "Bajo Jazz Bass Player", brand: "Fender", category: "Instrumentos", subcategory: "Bajos", price: 13800 },
  { name: "Bajo P-Bass Affinity", brand: "Squier", category: "Instrumentos", subcategory: "Bajos", price: 4850, isNew: true },
  { name: "Bajo SR300E", brand: "Ibanez", category: "Instrumentos", subcategory: "Bajos", price: 8900 },
  { name: "Docerola Segovia 12 Cuerdas", brand: "Yamaha", category: "Instrumentos", subcategory: "Docerolas", price: 4200 },
  { name: "Docerola Electroacústica D-12", brand: "Fender", category: "Instrumentos", subcategory: "Docerolas", price: 7800, isNew: true },
  { name: "Docerola La Sevillana 12C", brand: "Taylor", category: "Instrumentos", subcategory: "Docerolas", price: 5600 },
  { name: "Teclado PSR-E373", brand: "Yamaha", category: "Instrumentos", subcategory: "Teclados", price: 5650 },
  { name: "Sintetizador Juno-DS61", brand: "Roland", category: "Instrumentos", subcategory: "Teclados", price: 18900 },
  { name: "Workstation Kross 2", brand: "Korg", category: "Instrumentos", subcategory: "Teclados", price: 14200, isNew: true },
  { name: "Piano Digital CDP-S110", brand: "Casio", category: "Instrumentos", subcategory: "Teclados", price: 7800 },
  { name: "Violín Acústico V3", brand: "Yamaha", category: "Instrumentos", subcategory: "Violines", price: 4200 },
  { name: "Batería Export Pearl 5pz", brand: "Pearl", category: "Instrumentos", subcategory: "Baterías", price: 18500 },
  { name: "Batería Imperialstar 5pz", brand: "Tama", category: "Instrumentos", subcategory: "Baterías", price: 16200 },
  { name: "Batería Storm 5pz", brand: "Mapex", category: "Instrumentos", subcategory: "Baterías", price: 14800 },
  { name: "Ukulele Concert", brand: "Yamaha", category: "Instrumentos", subcategory: "Ukuleles", price: 1850 },
  { name: "Amplificador Champion 20", brand: "Fender", category: "Accesorios", subcategory: "Amplificadores", price: 3250 },
  { name: "Amplificador MG30CFX", brand: "Marshall", category: "Accesorios", subcategory: "Amplificadores", price: 5450 },
  { name: "Amplificador Cube Street EX", brand: "Roland", category: "Accesorios", subcategory: "Amplificadores", price: 9200, isNew: true },
  { name: "Pedalera GT-1", brand: "Boss", category: "Accesorios", subcategory: "Pedales", price: 5800 },
  { name: "Pedal Distortion DS-1", brand: "Boss", category: "Accesorios", subcategory: "Pedales", price: 1450 },
  { name: "Cable Pro 10ft", brand: "Fender", category: "Accesorios", subcategory: "Cables", price: 450 },
  { name: "Cable XLR 6m", brand: "Mackie", category: "Accesorios", subcategory: "Cables", price: 380 },
  { name: "Mezcladora Xenyx Q1202USB", brand: "Behringer", category: "Equipos de Audio", subcategory: "Mezcladoras", price: 5450 },
  { name: "Mezcladora ProFX10v3", brand: "Mackie", category: "Equipos de Audio", subcategory: "Mezcladoras", price: 9800 },
  { name: "Mezcladora MG12XU", brand: "Yamaha", category: "Equipos de Audio", subcategory: "Mezcladoras", price: 12500, isNew: true },
  { name: "Bafle EON715", brand: "JBL", category: "Equipos de Audio", subcategory: "Bafles", price: 14900 },
  { name: "Bafle Activo K12.2", brand: "QSC", category: "Equipos de Audio", subcategory: "Bafles", price: 24800 },
  { name: "Bafle EKX-15P", brand: "Mackie", category: "Equipos de Audio", subcategory: "Bafles", price: 18650 },
  { name: "Bafle Eurolive B215XL", brand: "Behringer", category: "Equipos de Audio", subcategory: "Bafles", price: 8950 },
];

export const PRODUCTS: Product[] = SAMPLES.map((p, i) => ({
  ...p,
  id: `prod-${(i + 1).toString().padStart(3, "0")}`,
  image: IMG[p.subcategory],
}));

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

export function countProducts(filter: { sub?: Subcategory; cat?: Category }): number {
  return PRODUCTS.filter((p) => {
    if (filter.sub && p.subcategory !== filter.sub) return false;
    if (filter.cat && p.category !== filter.cat) return false;
    return true;
  }).length;
}
