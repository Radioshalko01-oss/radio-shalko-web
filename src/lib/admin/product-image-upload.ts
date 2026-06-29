"use client";

/**
 * Subida directa de la imagen PRINCIPAL de un producto a Supabase Storage · D1.3.
 *
 * Por qué cliente (no Server Action):
 *   - Los archivos grandes (hasta 5 MB) superan el límite de body de las
 *     Server Actions; subir directo al bucket evita ese límite.
 *   - Usa la sesión admin del navegador (anon key + cookies). La RLS de
 *     storage.objects (`storage_admin_insert/update`) exige is_admin().
 *
 * NO usa service role. Tras subir, la URL devuelta se persiste con la
 * Server Action `setMainProductImage(productId, { url })`.
 */
import { createClient } from "@/lib/supabase/client";

export const PRODUCT_IMAGE_BUCKET = "product-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_GALLERY_IMAGES = 6;

/** MIME aceptados → extensión canónica (no confiamos en el nombre del archivo). */
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type UploadResult =
  | { ok: true; url: string; path: string }
  | { ok: false; error: string };

/** Valida tipo y tamaño sin tocar la red (reutilizable por la UI). */
export function validateMainImage(file: File): string | null {
  if (!MIME_TO_EXT[file.type]) {
    return "Formato no permitido. Usa JPG, PNG o WEBP.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "La imagen supera el máximo de 5 MB.";
  }
  return null;
}

/**
 * Sube la imagen principal a `product-images/{productId}/main.{ext}`.
 * Sobrescribe el mismo archivo (upsert) para "cambiar imagen" sin borrar
 * manualmente. Devuelve la publicUrl lista para `setMainProductImage`.
 */
export async function uploadMainProductImage(
  productId: string,
  file: File,
): Promise<UploadResult> {
  const validationError = validateMainImage(file);
  if (validationError) return { ok: false, error: validationError };

  const ext = MIME_TO_EXT[file.type];
  const path = `${productId}/main.${ext}`;

  const supabase = createClient();

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) {
    return { ok: false, error: "No se pudo obtener la URL pública de la imagen." };
  }

  return { ok: true, url: data.publicUrl, path };
}

/**
 * Sube una imagen de GALERÍA a una ruta única dentro del producto:
 * `product-images/{productId}/gallery/{uuid}.{ext}`.
 *
 * A diferencia de la principal, no sobrescribe: cada imagen vive en su propio
 * objeto, de modo que se puedan tener varias y borrarlas de forma individual.
 * Devuelve la publicUrl para persistirla con `addProductImage`.
 */
export async function uploadProductGalleryImage(
  productId: string,
  file: File,
): Promise<UploadResult> {
  const validationError = validateMainImage(file);
  if (validationError) return { ok: false, error: validationError };

  const ext = MIME_TO_EXT[file.type];
  const unique =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${productId}/gallery/${unique}.${ext}`;

  const supabase = createClient();

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, file, {
      upsert: false,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) {
    return { ok: false, error: "No se pudo obtener la URL pública de la imagen." };
  }

  return { ok: true, url: data.publicUrl, path };
}
