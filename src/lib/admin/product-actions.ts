"use server";

/**
 * Server Actions de productos · D1.2 (admin).
 *
 * Reglas de la fase:
 *   - Toda action empieza con requireAdmin().
 *   - Cliente con sesión (@/lib/supabase/server); la RLS is_admin() valida cada escritura.
 *   - Validación con zod antes de escribir.
 *   - NO se borran productos ni imágenes (ocultar = is_published=false).
 *   - setMainProductImage solo guarda/actualiza la URL en product_images (sin upload).
 *   - revalidatePath de superficies públicas afectadas.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { slugify } from "@/lib/catalog/format";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

// --- Esquemas de validación ---

const uuid = z.string().uuid("Identificador inválido.");

const productSchema = z.object({
  title: z.string().trim().min(2, "El título es obligatorio."),
  slug: z.string().trim().optional(),
  subtitle: z.string().trim().nullish(),
  description: z.string().trim().nullish(),
  price: z.coerce
    .number()
    .int("El precio debe ser un entero (MXN sin decimales).")
    .min(0, "El precio no puede ser negativo."),
  sku: z.string().trim().nullish(),
  isNew: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(false),
  brandId: uuid,
  categoryId: uuid,
  subcategoryId: uuid.nullish(),
});

export type ProductInput = z.input<typeof productSchema>;

const inventoryItemSchema = z.object({
  branchId: uuid,
  quantity: z.coerce.number().int("Cantidad inválida.").min(0, "El stock no puede ser negativo."),
});

const mainImageSchema = z.object({
  url: z.string().url("URL de imagen inválida."),
  alt: z.string().trim().nullish(),
});

// --- Helpers ---

/** Normaliza strings opcionales: "" o solo espacios → null. */
function nullifyEmpty(value: string | null | undefined): string | null {
  const v = value?.trim();
  return v && v.length ? v : null;
}

/** Garantiza un slug único en products (sufijo -2, -3… si choca). */
async function ensureUniqueSlug(
  supabase: SupabaseServerClient,
  base: string,
  excludeId?: string,
): Promise<string> {
  const root = slugify(base) || "producto";
  let slug = root;
  let n = 2;
  // Loop acotado: en la práctica termina en 1-2 iteraciones.
  for (let i = 0; i < 50; i++) {
    const { data } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data || data.id === excludeId) return slug;
    slug = `${root}-${n++}`;
  }
  // Fallback improbable.
  return `${root}-${Date.now()}`;
}

/** Verifica que la subcategoría exista y pertenezca a la categoría dada. */
async function assertSubcategoryMatches(
  supabase: SupabaseServerClient,
  subcategoryId: string,
  categoryId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("subcategories")
    .select("category_id")
    .eq("id", subcategoryId)
    .maybeSingle();
  if (!data) return "La subcategoría no existe.";
  if (data.category_id !== categoryId) {
    return "La subcategoría no pertenece a la categoría seleccionada.";
  }
  return null;
}

/** Revalida el panel y las superficies públicas afectadas. */
function revalidatePublic(...slugs: Array<string | null | undefined>) {
  revalidatePath("/admin/productos");
  revalidatePath("/admin/inventario");
  revalidatePath("/productos");
  revalidatePath("/marcas");
  revalidatePath("/");
  for (const slug of slugs) {
    if (slug) revalidatePath(`/productos/${slug}`);
  }
}

function fieldErrorsFrom(error: z.ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

// --- Actions ---

/**
 * Crea un producto (borrador por defecto) e inicializa inventario en 0
 * para cada sucursal activa. Devuelve el id y slug generados.
 */
export async function createProduct(
  input: ProductInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  await requireAdmin();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const d = parsed.data;

  const supabase = await createClient();

  if (d.subcategoryId) {
    const mismatch = await assertSubcategoryMatches(supabase, d.subcategoryId, d.categoryId);
    if (mismatch) return { ok: false, error: mismatch };
  }

  const slug = await ensureUniqueSlug(supabase, d.slug || d.title);

  const { data: created, error } = await supabase
    .from("products")
    .insert({
      title: d.title,
      subtitle: nullifyEmpty(d.subtitle),
      description: nullifyEmpty(d.description),
      price: d.price,
      sku: nullifyEmpty(d.sku),
      is_new: d.isNew,
      is_published: d.isPublished,
      brand_id: d.brandId,
      category_id: d.categoryId,
      subcategory_id: d.subcategoryId ?? null,
      slug,
    })
    .select("id, slug")
    .single();

  if (error || !created) {
    return { ok: false, error: mapWriteError(error?.message) };
  }

  // Inventario inicial en 0 para sucursales activas (no pisa si ya existe).
  const { data: branches } = await supabase
    .from("branches")
    .select("id")
    .eq("is_active", true);

  if (branches?.length) {
    await supabase.from("product_inventory").upsert(
      branches.map((b) => ({ product_id: created.id, branch_id: b.id, quantity: 0 })),
      { onConflict: "product_id,branch_id", ignoreDuplicates: true },
    );
  }

  revalidatePublic(created.slug);
  return { ok: true, data: { id: created.id, slug: created.slug } };
}

/** Actualiza los campos editables de un producto existente. */
export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  await requireAdmin();

  if (!uuid.safeParse(id).success) {
    return { ok: false, error: "Identificador de producto inválido." };
  }

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const d = parsed.data;

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("products")
    .select("id, slug")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "El producto no existe." };

  if (d.subcategoryId) {
    const mismatch = await assertSubcategoryMatches(supabase, d.subcategoryId, d.categoryId);
    if (mismatch) return { ok: false, error: mismatch };
  }

  const slug = await ensureUniqueSlug(supabase, d.slug || d.title, id);

  const { error } = await supabase
    .from("products")
    .update({
      title: d.title,
      subtitle: nullifyEmpty(d.subtitle),
      description: nullifyEmpty(d.description),
      price: d.price,
      sku: nullifyEmpty(d.sku),
      is_new: d.isNew,
      is_published: d.isPublished,
      brand_id: d.brandId,
      category_id: d.categoryId,
      subcategory_id: d.subcategoryId ?? null,
      slug,
    })
    .eq("id", id);

  if (error) return { ok: false, error: mapWriteError(error.message) };

  // Revalidar slug viejo y nuevo (por si cambió).
  revalidatePublic(existing.slug, slug);
  return { ok: true, data: { id, slug } };
}

/** Publica u oculta un producto (eliminación lógica de D1). */
export async function setProductPublished(
  id: string,
  published: boolean,
): Promise<ActionResult> {
  await requireAdmin();

  if (!uuid.safeParse(id).success) {
    return { ok: false, error: "Identificador de producto inválido." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("products")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "El producto no existe." };

  const { error } = await supabase
    .from("products")
    .update({ is_published: published })
    .eq("id", id);

  if (error) return { ok: false, error: mapWriteError(error.message) };

  revalidatePublic(existing.slug);
  return { ok: true, data: undefined };
}

/**
 * Elimina DEFINITIVAMENTE un producto. Las imágenes, inventario y relaciones
 * se borran por cascada (FK on delete cascade). Los archivos en Storage se
 * eliminan best-effort (no bloquean la operación).
 */
export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin();

  if (!uuid.safeParse(id).success) {
    return { ok: false, error: "Identificador de producto inválido." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("products")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "El producto no existe." };

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: mapWriteError(error.message) };

  // Limpieza best-effort de Storage: carpeta raíz y /gallery del producto.
  try {
    const bucket = "product-images";
    const paths: string[] = [];
    for (const prefix of [`${id}`, `${id}/gallery`]) {
      const { data: files } = await supabase.storage.from(bucket).list(prefix);
      for (const f of files ?? []) {
        if (f.name) paths.push(`${prefix}/${f.name}`);
      }
    }
    if (paths.length) await supabase.storage.from(bucket).remove(paths);
  } catch {
    // Ignorar: el producto ya fue borrado de la base de datos.
  }

  revalidatePublic(existing.slug);
  return { ok: true, data: undefined };
}

/** Actualiza el stock por sucursal (upsert por (product_id, branch_id)). */
export async function updateProductInventory(
  productId: string,
  items: Array<{ branchId: string; quantity: number }>,
): Promise<ActionResult> {
  await requireAdmin();

  if (!uuid.safeParse(productId).success) {
    return { ok: false, error: "Identificador de producto inválido." };
  }

  const parsed = z.array(inventoryItemSchema).safeParse(items);
  if (!parsed.success) {
    return { ok: false, error: "Datos de inventario inválidos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  if (parsed.data.length === 0) {
    return { ok: true, data: undefined };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .maybeSingle();
  if (!existing) return { ok: false, error: "El producto no existe." };

  const { error } = await supabase.from("product_inventory").upsert(
    parsed.data.map((it) => ({
      product_id: productId,
      branch_id: it.branchId,
      quantity: it.quantity,
    })),
    { onConflict: "product_id,branch_id" },
  );

  if (error) return { ok: false, error: mapWriteError(error.message) };

  revalidatePublic(existing.slug);
  return { ok: true, data: undefined };
}

/**
 * Guarda/actualiza SOLO la URL de la imagen principal (sort_order=0).
 * No sube archivos: recibe una URL ya existente (Storage u otra).
 * Si ya hay imagen principal, actualiza su url/alt; si no, inserta una.
 */
export async function setMainProductImage(
  productId: string,
  input: { url: string; alt?: string | null },
): Promise<ActionResult> {
  await requireAdmin();

  if (!uuid.safeParse(productId).success) {
    return { ok: false, error: "Identificador de producto inválido." };
  }

  const parsed = mainImageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos de imagen inválidos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .maybeSingle();
  if (!existing) return { ok: false, error: "El producto no existe." };

  const alt = nullifyEmpty(parsed.data.alt);

  // ¿Ya existe imagen principal (sort_order=0)?
  const { data: primary } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .eq("sort_order", 0)
    .maybeSingle();

  if (primary) {
    const { error } = await supabase
      .from("product_images")
      .update({ url: parsed.data.url, alt_text: alt })
      .eq("id", primary.id);
    if (error) return { ok: false, error: mapWriteError(error.message) };
  } else {
    const { error } = await supabase
      .from("product_images")
      .insert({ product_id: productId, url: parsed.data.url, alt_text: alt, sort_order: 0 });
    if (error) return { ok: false, error: mapWriteError(error.message) };
  }

  revalidatePublic(existing.slug);
  return { ok: true, data: undefined };
}

// ─────────────────── PRO-1 · Quick edit + acciones masivas ───────────────────

const idList = z.array(uuid).min(1, "Selecciona al menos un producto.").max(500);

const quickSchema = z.object({
  price: z.coerce
    .number()
    .int("El precio debe ser un entero (MXN sin decimales).")
    .min(0, "El precio no puede ser negativo.")
    .optional(),
  brandId: uuid.optional(),
  isPublished: z.boolean().optional(),
});

export type QuickProductInput = z.input<typeof quickSchema>;

/** Devuelve los slugs de un conjunto de productos (para revalidar). */
async function slugsForIds(
  supabase: SupabaseServerClient,
  ids: string[],
): Promise<string[]> {
  const { data } = await supabase.from("products").select("slug").in("id", ids);
  return (data ?? []).map((r) => r.slug as string).filter(Boolean);
}

/**
 * Edición rápida de un producto: precio, marca y/o estado de publicación.
 * El stock se maneja aparte vía updateProductInventory.
 */
export async function quickUpdateProduct(
  id: string,
  input: QuickProductInput,
): Promise<ActionResult> {
  await requireAdmin();

  if (!uuid.safeParse(id).success) {
    return { ok: false, error: "Identificador de producto inválido." };
  }

  const parsed = quickSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const d = parsed.data;

  const update: { price?: number; brand_id?: string; is_published?: boolean } = {};
  if (typeof d.price === "number") update.price = d.price;
  if (d.brandId) update.brand_id = d.brandId;
  if (typeof d.isPublished === "boolean") update.is_published = d.isPublished;

  if (Object.keys(update).length === 0) return { ok: true, data: undefined };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("products")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "El producto no existe." };

  const { error } = await supabase.from("products").update(update).eq("id", id);
  if (error) return { ok: false, error: mapWriteError(error.message) };

  revalidatePublic(existing.slug);
  return { ok: true, data: undefined };
}

/** Publica u oculta varios productos a la vez. */
export async function bulkSetPublished(
  ids: string[],
  published: boolean,
): Promise<ActionResult<{ count: number }>> {
  await requireAdmin();

  const p = idList.safeParse(ids);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Selección inválida." };

  const supabase = await createClient();
  const slugs = await slugsForIds(supabase, p.data);

  const { error } = await supabase
    .from("products")
    .update({ is_published: published })
    .in("id", p.data);

  if (error) return { ok: false, error: mapWriteError(error.message) };

  revalidatePublic(...slugs);
  return { ok: true, data: { count: p.data.length } };
}

/** Cambia la marca de varios productos a la vez. */
export async function bulkSetBrand(
  ids: string[],
  brandId: string,
): Promise<ActionResult<{ count: number }>> {
  await requireAdmin();

  if (!uuid.safeParse(brandId).success) return { ok: false, error: "Marca inválida." };
  const p = idList.safeParse(ids);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Selección inválida." };

  const supabase = await createClient();

  const { data: brand } = await supabase.from("brands").select("id").eq("id", brandId).maybeSingle();
  if (!brand) return { ok: false, error: "La marca no existe." };

  const slugs = await slugsForIds(supabase, p.data);
  const { error } = await supabase.from("products").update({ brand_id: brandId }).in("id", p.data);
  if (error) return { ok: false, error: mapWriteError(error.message) };

  revalidatePublic(...slugs);
  return { ok: true, data: { count: p.data.length } };
}

/**
 * Cambia la categoría (y opcionalmente subcategoría) de varios productos.
 * Si se indica subcategoría, valida que pertenezca a la categoría.
 */
export async function bulkSetCategory(
  ids: string[],
  categoryId: string,
  subcategoryId?: string | null,
): Promise<ActionResult<{ count: number }>> {
  await requireAdmin();

  if (!uuid.safeParse(categoryId).success) return { ok: false, error: "Categoría inválida." };
  const p = idList.safeParse(ids);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Selección inválida." };

  const supabase = await createClient();

  const { data: cat } = await supabase.from("categories").select("id").eq("id", categoryId).maybeSingle();
  if (!cat) return { ok: false, error: "La categoría no existe." };

  if (subcategoryId) {
    const mismatch = await assertSubcategoryMatches(supabase, subcategoryId, categoryId);
    if (mismatch) return { ok: false, error: mismatch };
  }

  const slugs = await slugsForIds(supabase, p.data);
  const { error } = await supabase
    .from("products")
    .update({ category_id: categoryId, subcategory_id: subcategoryId ?? null })
    .in("id", p.data);
  if (error) return { ok: false, error: mapWriteError(error.message) };

  revalidatePublic(...slugs);
  return { ok: true, data: { count: p.data.length } };
}

/** Elimina DEFINITIVAMENTE varios productos (con limpieza best-effort de Storage). */
export async function bulkDeleteProducts(ids: string[]): Promise<ActionResult<{ count: number }>> {
  await requireAdmin();

  const p = idList.safeParse(ids);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Selección inválida." };

  const supabase = await createClient();
  const slugs = await slugsForIds(supabase, p.data);

  const { error } = await supabase.from("products").delete().in("id", p.data);
  if (error) return { ok: false, error: mapWriteError(error.message) };

  // Limpieza best-effort de Storage por cada producto eliminado.
  try {
    const bucket = "product-images";
    const paths: string[] = [];
    for (const id of p.data) {
      for (const prefix of [`${id}`, `${id}/gallery`]) {
        const { data: files } = await supabase.storage.from(bucket).list(prefix);
        for (const f of files ?? []) {
          if (f.name) paths.push(`${prefix}/${f.name}`);
        }
      }
    }
    if (paths.length) await supabase.storage.from(bucket).remove(paths);
  } catch {
    // Ignorar: los productos ya fueron borrados de la base de datos.
  }

  revalidatePublic(...slugs);
  return { ok: true, data: { count: p.data.length } };
}

/** Traduce errores comunes de Postgres a mensajes claros. */
function mapWriteError(message?: string): string {
  if (!message) return "No se pudo guardar. Intenta de nuevo.";
  if (message.includes("products_sku_key")) {
    return "Ese SKU ya está en uso por otro producto.";
  }
  if (message.includes("products_slug")) {
    return "Ese slug ya está en uso.";
  }
  if (message.toLowerCase().includes("row-level security")) {
    return "No tienes permisos para esta acción.";
  }
  return message;
}
