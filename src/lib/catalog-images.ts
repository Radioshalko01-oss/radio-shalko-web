/**
 * Imágenes de la sección "Compra por categoría" (home).
 * Carpeta en disco: public/images/categorias/
 *
 * Cada categoría tiene una imagen principal (`img`) y, opcionalmente, una
 * imagen de hover (`hover`) que se muestra al pasar el cursor para dar
 * sensación de movimiento. Bafles y Accesorios no tienen hover.
 */
/**
 * Carpeta versionada: al reemplazar imágenes con el mismo nombre, sube el
 * sufijo (categorias-v2 → categorias-v3) para invalidar la caché sin usar
 * query strings (Next 16 los restringe vía images.localPatterns).
 */
export const CATEGORIAS_DIR = "/images/categorias-v2";

const src = (file: string) => `${CATEGORIAS_DIR}/${file.replace(/\.png$/, ".webp")}`;

export type CategoryMedia = {
  img: string;
  hover: string | null;
};

export const CATEGORY_MEDIA = {
  acoustic: {
    img: src("guitarra-acustica.png"),
    hover: src("guitarra-acustica-2.png"),
  },
  electric: {
    img: src("guitarra-electrica.png"),
    hover: src("guitarra-electrica-2.png"),
  },
  bass: {
    img: src("bajo.png"),
    hover: src("bajo-2.png"),
  },
  docerola: {
    img: src("docerola.png"),
    hover: src("docerola-2.png"),
  },
  violin: {
    img: src("violin.png"),
    hover: src("violin-2.png"),
  },
  ukulele: {
    img: src("ukulele.png"),
    hover: src("ukulele-2.png"),
  },
  drums: {
    img: src("bateria.png"),
    hover: src("bateria-2.png"),
  },
  keys: {
    img: src("teclado.png"),
    hover: src("teclado-2.png"),
  },
  audio: {
    img: src("bafles.png"),
    hover: null,
  },
  accessories: {
    img: src("accesorios.png"),
    hover: null,
  },
} as const satisfies Record<string, CategoryMedia>;
