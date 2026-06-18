/**
 * Imágenes de la sección "Compra por categoría".
 * Carpeta en disco: public/images/catalogo/
 *
 * Sube archivos en alta resolución con el slug como nombre
 * (ej. ukuleles.png). Ver NOMBRES.txt en esa carpeta.
 */
export const CATALOGO_DIR = "/images/catalogo";

export const CATALOG_IMAGES = {
  electric: `${CATALOGO_DIR}/guitarras-electricas.png`,
  acoustic: `${CATALOGO_DIR}/guitarras-acusticas.png`,
  bass: `${CATALOGO_DIR}/bajos.png`,
  docerola: `${CATALOGO_DIR}/docerolas.png`,
  violin: `${CATALOGO_DIR}/violines.png`,
  ukulele: `${CATALOGO_DIR}/ukuleles.png`,
  drums: `${CATALOGO_DIR}/baterias.png`,
  keys: `${CATALOGO_DIR}/teclados.png`,
  audio: `${CATALOGO_DIR}/bafles-y-audio.png`,
  accessories: `${CATALOGO_DIR}/accesorios.png`,
} as const;

/** Slug → categoría (para cuando subas imágenes nuevas por nombre) */
export const CATALOG_SLUGS = {
  "guitarras-electricas": CATALOG_IMAGES.electric,
  "guitarras-acusticas": CATALOG_IMAGES.acoustic,
  bajos: CATALOG_IMAGES.bass,
  docerolas: CATALOG_IMAGES.docerola,
  violines: CATALOG_IMAGES.violin,
  ukuleles: CATALOG_IMAGES.ukulele,
  baterias: CATALOG_IMAGES.drums,
  teclados: CATALOG_IMAGES.keys,
  "bafles-y-audio": CATALOG_IMAGES.audio,
  accesorios: CATALOG_IMAGES.accessories,
} as const;

export type CatalogSlug = keyof typeof CATALOG_SLUGS;
