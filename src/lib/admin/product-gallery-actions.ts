"use server";

/**
 * Server Actions de la galería de producto · FASE 2 (admin).
 *
 * Reglas:
 *   - Toda action empieza con requireAdmin().
 *   - Cliente con sesión (RLS is_admin() valida cada escritura).
 *   - Máximo 6 imágenes por producto (validado aquí, además del cliente).
 *   - Imagen principal = sort_order 0. Las imágenes se mantienen numeradas 0..n-1.
 *   - Al borrar, se renumeran las restantes; la siguiente queda como principal.
 *   - Borrado físico en Storage best-effort (no bloquea la operación de BD).
 *   - revalidatePath de superficies públicas afectadas.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { PRODUCT_IMAGE_BUCKET, MAX_GALLERY_IMAGES } from "@/lib/admin/product-image-upload";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const uuid = z.string().uuid("Identificador inválido.");

const addImageSchema = z.object({
  url: z.string().url("URL de imagen inválida."),
  alt: z.string().trim().nullish(),
});

function nullifyEmpty(value: string | null | undefined): string | null {
  const v = value?.trim();
  return v && v.length ? v : null;
}

/** Revalida panel + superficies públicas (incluida la PDP por slug). */
function revalidatePublic(slug?: string | null) {
  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  revalidatePath("/marcas");
  revalidatePath("/");
  if (slug) revalidatePath(`/productos/${slug}`);
}

async function getProductSlug(
  supabase: SupabaseServerClient,
  productId: string,
): Promise<string | null | undefined> {
  const { data } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .maybeSingle();
  return data?.slug;
}

/** Deriva la ruta dentro del bucket a partir de una publicUrl de Storage. */
function storagePathFromUrl(url: string): string | null {
  const marker = `/${PRODUCT_IMAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const raw = url.slice(idx + marker.length);
  return raw.split("?")[0] || null;
}

/** Renumera las imágenes de un producto a 0..n-1 según su orden actual. */
async function renumber(supabase: SupabaseServerClient, productId: string): Promise<void> {
  const { data } = await supabase
    .from("product_images")
    .select("id, sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (!data) return;
  for (let i = 0; i < data.length; i++) {
    if (data[i].sort_order !== i) {
      await supabase.from("product_images").update({ sort_order: i }).eq("id", data[i].id);
    }
  }
}

function mapWriteError(message?: string): string {
  if (!message) return "No se pudo guardar. Intenta de nuevo.";
  if (message.toLowerCase().includes("row-level security")) {
    return "No tienes permisos para esta acción.";
  }
  return message;
}

/**
 * Agrega una imagen al final de la galería (máx. 6). Si es la primera, queda
 * como principal (sort_order 0).
 */
export async function addProductImage(
  productId: string,
  input: { url: string; alt?: string | null },
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  if (!uuid.safeParse(productId).success) {
    return { ok: false, error: "Identificador de producto inválido." };
  }

  const parsed = addImageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos de imagen inválidos." };
  }

  const supabase = await createClient();

  const slug = await getProductSlug(supabase, productId);
  if (slug === undefined) return { ok: false, error: "El producto no existe." };

  const { data: existing } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  const count = existing?.length ?? 0;
  if (count >= MAX_GALLERY_IMAGES) {
    return {
      ok: false,
      error: `Máximo ${MAX_GALLERY_IMAGES} imágenes por producto.`,
    };
  }

  const nextOrder = count === 0 ? 0 : (existing![count - 1].sort_order ?? count - 1) + 1;

  const { data: created, error } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      url: parsed.data.url,
      alt_text: nullifyEmpty(parsed.data.alt),
      sort_order: nextOrder,
    })
    .select("id")
    .single();

  if (error || !created) return { ok: false, error: mapWriteError(error?.message) };

  revalidatePublic(slug);
  return { ok: true, data: { id: created.id } };
}

/**
 * Elimina una imagen. Renumera las restantes (la siguiente pasa a principal)
 * y borra el objeto de Storage best-effort.
 */
export async function deleteProductImage(
  productId: string,
  imageId: string,
): Promise<ActionResult> {
  await requireAdmin();

  if (!uuid.safeParse(productId).success || !uuid.safeParse(imageId).success) {
    return { ok: false, error: "Identificador inválido." };
  }

  const supabase = await createClient();

  const slug = await getProductSlug(supabase, productId);
  if (slug === undefined) return { ok: false, error: "El producto no existe." };

  const { data: image } = await supabase
    .from("product_images")
    .select("id, url")
    .eq("id", imageId)
    .eq("product_id", productId)
    .maybeSingle();

  if (!image) return { ok: false, error: "La imagen no existe." };

  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) return { ok: false, error: mapWriteError(error.message) };

  // Borrado físico best-effort (no bloquea si falla).
  const path = storagePathFromUrl(image.url);
  if (path) {
    await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
  }

  await renumber(supabase, productId);

  revalidatePublic(slug);
  return { ok: true, data: undefined };
}

/**
 * Reordena la galería según `orderedIds` (índice = nuevo sort_order).
 * La primera de la lista queda como principal. Sirve también para
 * "marcar como principal" (poniendo ese id al inicio).
 */
export async function reorderProductImages(
  productId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  await requireAdmin();

  if (!uuid.safeParse(productId).success) {
    return { ok: false, error: "Identificador de producto inválido." };
  }
  if (!Array.isArray(orderedIds) || orderedIds.some((id) => !uuid.safeParse(id).success)) {
    return { ok: false, error: "Orden de imágenes inválido." };
  }

  const supabase = await createClient();

  const slug = await getProductSlug(supabase, productId);
  if (slug === undefined) return { ok: false, error: "El producto no existe." };

  const { data: current } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId);

  const currentIds = new Set((current ?? []).map((r) => r.id));
  if (
    orderedIds.length !== currentIds.size ||
    orderedIds.some((id) => !currentIds.has(id))
  ) {
    return { ok: false, error: "La lista de imágenes no coincide con el producto." };
  }

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("product_images")
      .update({ sort_order: i })
      .eq("id", orderedIds[i])
      .eq("product_id", productId);
    if (error) return { ok: false, error: mapWriteError(error.message) };
  }

  revalidatePublic(slug);
  return { ok: true, data: undefined };
}

/**
 * Reemplaza el archivo de una imagen existente (la URL ya subida al Storage),
 * conservando su posición/orden.
 */
export async function updateProductImageUrl(
  productId: string,
  imageId: string,
  input: { url: string; alt?: string | null },
): Promise<ActionResult> {
  await requireAdmin();

  if (!uuid.safeParse(productId).success || !uuid.safeParse(imageId).success) {
    return { ok: false, error: "Identificador inválido." };
  }

  const parsed = addImageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos de imagen inválidos." };
  }

  const supabase = await createClient();

  const slug = await getProductSlug(supabase, productId);
  if (slug === undefined) return { ok: false, error: "El producto no existe." };

  const { data: image } = await supabase
    .from("product_images")
    .select("id, url")
    .eq("id", imageId)
    .eq("product_id", productId)
    .maybeSingle();
  if (!image) return { ok: false, error: "La imagen no existe." };

  const updates: { url: string; alt_text?: string | null } = { url: parsed.data.url };
  if (parsed.data.alt !== undefined) updates.alt_text = nullifyEmpty(parsed.data.alt);

  const { error } = await supabase
    .from("product_images")
    .update(updates)
    .eq("id", imageId)
    .eq("product_id", productId);
  if (error) return { ok: false, error: mapWriteError(error.message) };

  // Limpiar el archivo anterior si cambió la ruta (best-effort).
  const oldPath = storagePathFromUrl(image.url);
  const newPath = storagePathFromUrl(parsed.data.url);
  if (oldPath && newPath && oldPath !== newPath) {
    await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([oldPath]);
  }

  revalidatePublic(slug);
  return { ok: true, data: undefined };
}
