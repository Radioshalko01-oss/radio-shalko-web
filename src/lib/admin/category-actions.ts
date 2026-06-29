"use server";

/**
 * Server Actions de categorías y subcategorías · CAT-4 (admin).
 *
 * Reglas:
 *   - Toda action empieza con requireAdmin().
 *   - Cliente con sesión; la RLS (categories_*_admin / subcategories_*_admin)
 *     valida cada escritura. Sin service role.
 *   - Validación con zod; slug único; nombre requerido.
 *   - No se borra una categoría/subcategoría con productos asociados, ni una
 *     categoría con subcategorías (FK restrict). Ocultar = is_active=false.
 *   - Manejo de error 23505 (slug duplicado) con mensaje claro.
 *   - revalidatePath de /admin/categorias y superficies públicas.
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

const uuid = z.string().uuid("Identificador inválido.");

const categorySchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio."),
  slug: z.string().trim().optional(),
  description: z.string().trim().nullish(),
  isActive: z.boolean().optional().default(true),
});

const subcategorySchema = z.object({
  categoryId: uuid,
  name: z.string().trim().min(2, "El nombre es obligatorio."),
  slug: z.string().trim().optional(),
  isActive: z.boolean().optional().default(true),
});

export type CategoryInput = z.input<typeof categorySchema>;
export type SubcategoryInput = z.input<typeof subcategorySchema>;

function nullifyEmpty(value: string | null | undefined): string | null {
  const v = value?.trim();
  return v && v.length ? v : null;
}

function fieldErrorsFrom(error: z.ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

function mapWriteError(message?: string): string {
  if (!message) return "No se pudo guardar. Intenta de nuevo.";
  if (
    message.includes("categories_slug_key") ||
    message.includes("subcategories_slug_key") ||
    message.includes("23505")
  ) {
    return "Ese slug ya está en uso. Elige otro.";
  }
  if (message.toLowerCase().includes("row-level security")) {
    return "No tienes permisos para esta acción.";
  }
  return message;
}

/** Garantiza un slug único en la tabla indicada (sufijo -2, -3… si choca). */
async function ensureUniqueSlug(
  supabase: SupabaseServerClient,
  table: "categories" | "subcategories",
  base: string,
  excludeId?: string,
): Promise<string> {
  const root = slugify(base) || table.slice(0, 3);
  let slug = root;
  let n = 2;
  for (let i = 0; i < 50; i++) {
    const { data } = await supabase.from(table).select("id").eq("slug", slug).maybeSingle();
    if (!data || data.id === excludeId) return slug;
    slug = `${root}-${n++}`;
  }
  return `${root}-${Date.now()}`;
}

function revalidateTaxonomy() {
  revalidatePath("/admin/categorias");
  revalidatePath("/productos");
  revalidatePath("/");
}

// ───────────────────────── Categorías ─────────────────────────

/** Crea una categoría principal. sort_order = (máximo actual) + 1. */
export async function createCategory(input: CategoryInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const slug = await ensureUniqueSlug(supabase, "categories", d.slug || d.name);

  const { data: last } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (last?.sort_order ?? 0) + 1;

  const { data: created, error } = await supabase
    .from("categories")
    .insert({
      name: d.name,
      slug,
      description: nullifyEmpty(d.description),
      is_active: d.isActive,
      sort_order: sortOrder,
    })
    .select("id")
    .single();

  if (error || !created) return { ok: false, error: mapWriteError(error?.message) };

  revalidateTaxonomy();
  return { ok: true, data: { id: created.id } };
}

/** Actualiza una categoría existente. */
export async function updateCategory(
  id: string,
  input: CategoryInput,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  if (!uuid.safeParse(id).success) {
    return { ok: false, error: "Identificador de categoría inválido." };
  }

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const d = parsed.data;

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "La categoría no existe." };

  const slug = await ensureUniqueSlug(supabase, "categories", d.slug || d.name, id);

  const { error } = await supabase
    .from("categories")
    .update({
      name: d.name,
      slug,
      description: nullifyEmpty(d.description),
      is_active: d.isActive,
    })
    .eq("id", id);

  if (error) return { ok: false, error: mapWriteError(error.message) };

  revalidateTaxonomy();
  return { ok: true, data: { id } };
}

/** Activa u oculta una categoría (is_active). */
export async function setCategoryActive(id: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();

  if (!uuid.safeParse(id).success) {
    return { ok: false, error: "Identificador de categoría inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, error: mapWriteError(error.message) };

  revalidateTaxonomy();
  return { ok: true, data: undefined };
}

/** Elimina una categoría SOLO si no tiene productos ni subcategorías. */
export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();

  if (!uuid.safeParse(id).success) {
    return { ok: false, error: "Identificador de categoría inválido." };
  }

  const supabase = await createClient();

  const [{ count: productCount }, { count: subCount }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id),
    supabase.from("subcategories").select("id", { count: "exact", head: true }).eq("category_id", id),
  ]);

  if ((productCount ?? 0) > 0) {
    return {
      ok: false,
      error: "No se puede eliminar: la categoría tiene productos asociados. Ocúltala en su lugar.",
    };
  }
  if ((subCount ?? 0) > 0) {
    return {
      ok: false,
      error: "No se puede eliminar: la categoría tiene subcategorías. Elimínalas u ocúltalas primero.",
    };
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: mapWriteError(error.message) };

  revalidateTaxonomy();
  return { ok: true, data: undefined };
}

/** Reordena categorías: sort_order = posición en el arreglo recibido. */
export async function reorderCategories(orderedIds: string[]): Promise<ActionResult> {
  await requireAdmin();

  if (!Array.isArray(orderedIds) || orderedIds.some((id) => !uuid.safeParse(id).success)) {
    return { ok: false, error: "Lista de orden inválida." };
  }

  const supabase = await createClient();
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("categories")
      .update({ sort_order: i + 1 })
      .eq("id", orderedIds[i]);
    if (error) return { ok: false, error: mapWriteError(error.message) };
  }

  revalidateTaxonomy();
  return { ok: true, data: undefined };
}

// ──────────────────────── Subcategorías ────────────────────────

/** Crea una subcategoría dentro de una categoría. */
export async function createSubcategory(
  input: SubcategoryInput,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = subcategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const d = parsed.data;

  const supabase = await createClient();

  const { data: parent } = await supabase
    .from("categories")
    .select("id")
    .eq("id", d.categoryId)
    .maybeSingle();
  if (!parent) return { ok: false, error: "La categoría padre no existe." };

  const slug = await ensureUniqueSlug(supabase, "subcategories", d.slug || d.name);

  const { data: last } = await supabase
    .from("subcategories")
    .select("sort_order")
    .eq("category_id", d.categoryId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (last?.sort_order ?? 0) + 1;

  const { data: created, error } = await supabase
    .from("subcategories")
    .insert({
      category_id: d.categoryId,
      name: d.name,
      slug,
      is_active: d.isActive,
      sort_order: sortOrder,
    })
    .select("id")
    .single();

  if (error || !created) return { ok: false, error: mapWriteError(error?.message) };

  revalidateTaxonomy();
  return { ok: true, data: { id: created.id } };
}

/** Actualiza una subcategoría (incluye mover de categoría padre). */
export async function updateSubcategory(
  id: string,
  input: SubcategoryInput,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  if (!uuid.safeParse(id).success) {
    return { ok: false, error: "Identificador de subcategoría inválido." };
  }

  const parsed = subcategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const d = parsed.data;

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("subcategories")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "La subcategoría no existe." };

  const { data: parent } = await supabase
    .from("categories")
    .select("id")
    .eq("id", d.categoryId)
    .maybeSingle();
  if (!parent) return { ok: false, error: "La categoría padre no existe." };

  const slug = await ensureUniqueSlug(supabase, "subcategories", d.slug || d.name, id);

  const { error } = await supabase
    .from("subcategories")
    .update({
      category_id: d.categoryId,
      name: d.name,
      slug,
      is_active: d.isActive,
    })
    .eq("id", id);

  if (error) return { ok: false, error: mapWriteError(error.message) };

  revalidateTaxonomy();
  return { ok: true, data: { id } };
}

/** Activa u oculta una subcategoría (is_active). */
export async function setSubcategoryActive(id: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();

  if (!uuid.safeParse(id).success) {
    return { ok: false, error: "Identificador de subcategoría inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("subcategories")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { ok: false, error: mapWriteError(error.message) };

  revalidateTaxonomy();
  return { ok: true, data: undefined };
}

/** Elimina una subcategoría SOLO si no tiene productos asociados. */
export async function deleteSubcategory(id: string): Promise<ActionResult> {
  await requireAdmin();

  if (!uuid.safeParse(id).success) {
    return { ok: false, error: "Identificador de subcategoría inválido." };
  }

  const supabase = await createClient();

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("subcategory_id", id);

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: "No se puede eliminar: la subcategoría tiene productos asociados. Ocúltala en su lugar.",
    };
  }

  const { error } = await supabase.from("subcategories").delete().eq("id", id);
  if (error) return { ok: false, error: mapWriteError(error.message) };

  revalidateTaxonomy();
  return { ok: true, data: undefined };
}

// ─────────────────── Asignación de productos ───────────────────

const idList = z.array(uuid).min(1, "Selecciona al menos un producto.").max(500);

/**
 * Asigna productos existentes a una categoría principal.
 * Deja subcategory_id en null (asignación solo a nivel categoría).
 */
export async function assignProductsToCategory(
  categoryId: string,
  productIds: string[],
): Promise<ActionResult<{ count: number }>> {
  await requireAdmin();

  if (!uuid.safeParse(categoryId).success) {
    return { ok: false, error: "Categoría inválida." };
  }
  const ids = idList.safeParse(productIds);
  if (!ids.success) return { ok: false, error: ids.error.issues[0]?.message ?? "Selección inválida." };

  const supabase = await createClient();

  const { data: cat } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();
  if (!cat) return { ok: false, error: "La categoría no existe." };

  const { error } = await supabase
    .from("products")
    .update({ category_id: categoryId, subcategory_id: null })
    .in("id", ids.data);

  if (error) return { ok: false, error: mapWriteError(error.message) };

  revalidateTaxonomy();
  revalidatePath("/admin/productos");
  return { ok: true, data: { count: ids.data.length } };
}

/**
 * Asigna productos existentes a una subcategoría.
 * Valida que la subcategoría pertenezca a la categoría y actualiza ambos campos.
 */
export async function assignProductsToSubcategory(
  categoryId: string,
  subcategoryId: string,
  productIds: string[],
): Promise<ActionResult<{ count: number }>> {
  await requireAdmin();

  if (!uuid.safeParse(categoryId).success || !uuid.safeParse(subcategoryId).success) {
    return { ok: false, error: "Categoría o subcategoría inválida." };
  }
  const ids = idList.safeParse(productIds);
  if (!ids.success) return { ok: false, error: ids.error.issues[0]?.message ?? "Selección inválida." };

  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("subcategories")
    .select("id, category_id")
    .eq("id", subcategoryId)
    .maybeSingle();
  if (!sub) return { ok: false, error: "La subcategoría no existe." };
  if (sub.category_id !== categoryId) {
    return { ok: false, error: "La subcategoría no pertenece a esa categoría." };
  }

  const { error } = await supabase
    .from("products")
    .update({ category_id: categoryId, subcategory_id: subcategoryId })
    .in("id", ids.data);

  if (error) return { ok: false, error: mapWriteError(error.message) };

  revalidateTaxonomy();
  revalidatePath("/admin/productos");
  return { ok: true, data: { count: ids.data.length } };
}

/** Quita un producto de su subcategoría (conserva la categoría). */
export async function removeProductFromSubcategory(
  productId: string,
): Promise<ActionResult> {
  await requireAdmin();

  if (!uuid.safeParse(productId).success) {
    return { ok: false, error: "Producto inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ subcategory_id: null })
    .eq("id", productId);

  if (error) return { ok: false, error: mapWriteError(error.message) };

  revalidateTaxonomy();
  revalidatePath("/admin/productos");
  return { ok: true, data: undefined };
}

/** Reordena subcategorías dentro de una categoría. */
export async function reorderSubcategories(
  categoryId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  await requireAdmin();

  if (!uuid.safeParse(categoryId).success) {
    return { ok: false, error: "Categoría inválida." };
  }
  if (!Array.isArray(orderedIds) || orderedIds.some((id) => !uuid.safeParse(id).success)) {
    return { ok: false, error: "Lista de orden inválida." };
  }

  const supabase = await createClient();
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("subcategories")
      .update({ sort_order: i + 1 })
      .eq("id", orderedIds[i])
      .eq("category_id", categoryId);
    if (error) return { ok: false, error: mapWriteError(error.message) };
  }

  revalidateTaxonomy();
  return { ok: true, data: undefined };
}
