"use server";

/**
 * Server Actions de marcas · CAT-3 (admin).
 *
 * Reglas:
 *   - Toda action empieza con requireAdmin().
 *   - Cliente con sesión; la RLS (brands_*_admin) valida cada escritura.
 *   - Validación con zod; slug único; nombre requerido.
 *   - No se borra una marca con productos asociados (ocultar = is_active=false).
 *   - Manejo de error 23505 (slug duplicado) con mensaje claro.
 *   - revalidatePath de /admin/marcas y superficies públicas de marcas.
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

const brandSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio."),
  slug: z.string().trim().optional(),
  description: z.string().trim().nullish(),
  logoUrl: z.string().trim().nullish(),
  isActive: z.boolean().optional().default(true),
});

export type BrandInput = z.input<typeof brandSchema>;

function nullifyEmpty(value: string | null | undefined): string | null {
  const v = value?.trim();
  return v && v.length ? v : null;
}

function fieldErrorsFrom(error: z.ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

function mapWriteError(message?: string): string {
  if (!message) return "No se pudo guardar. Intenta de nuevo.";
  if (message.includes("brands_slug_key") || message.includes("23505")) {
    return "Ese slug ya está en uso por otra marca.";
  }
  if (message.toLowerCase().includes("row-level security")) {
    return "No tienes permisos para esta acción.";
  }
  return message;
}

/** Garantiza un slug único en brands (sufijo -2, -3… si choca). */
async function ensureUniqueBrandSlug(
  supabase: SupabaseServerClient,
  base: string,
  excludeId?: string,
): Promise<string> {
  const root = slugify(base) || "marca";
  let slug = root;
  let n = 2;
  for (let i = 0; i < 50; i++) {
    const { data } = await supabase
      .from("brands")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data || data.id === excludeId) return slug;
    slug = `${root}-${n++}`;
  }
  return `${root}-${Date.now()}`;
}

function revalidateBrands() {
  revalidatePath("/admin/marcas");
  revalidatePath("/marcas");
  revalidatePath("/");
}

/** Valida logo opcional: vacío → null; si hay valor, debe ser URL. */
function normalizeLogo(value: string | null | undefined): { ok: true; value: string | null } | { ok: false } {
  const logo = nullifyEmpty(value);
  if (logo && !z.string().url().safeParse(logo).success) return { ok: false };
  return { ok: true, value: logo };
}

/** Crea una marca. sort_order = (máximo actual) + 1. */
export async function createBrand(input: BrandInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const d = parsed.data;

  const logo = normalizeLogo(d.logoUrl);
  if (!logo.ok) {
    return { ok: false, error: "URL de logo inválida.", fieldErrors: { logoUrl: ["Debe ser una URL válida."] } };
  }

  const supabase = await createClient();
  const slug = await ensureUniqueBrandSlug(supabase, d.slug || d.name);

  const { data: last } = await supabase
    .from("brands")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (last?.sort_order ?? 0) + 1;

  const { data: created, error } = await supabase
    .from("brands")
    .insert({
      name: d.name,
      slug,
      description: nullifyEmpty(d.description),
      logo_url: logo.value,
      is_active: d.isActive,
      sort_order: sortOrder,
    })
    .select("id")
    .single();

  if (error || !created) return { ok: false, error: mapWriteError(error?.message) };

  revalidateBrands();
  return { ok: true, data: { id: created.id } };
}

/** Actualiza una marca existente. */
export async function updateBrand(id: string, input: BrandInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  if (!uuid.safeParse(id).success) {
    return { ok: false, error: "Identificador de marca inválido." };
  }

  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const d = parsed.data;

  const logo = normalizeLogo(d.logoUrl);
  if (!logo.ok) {
    return { ok: false, error: "URL de logo inválida.", fieldErrors: { logoUrl: ["Debe ser una URL válida."] } };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("brands")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "La marca no existe." };

  const slug = await ensureUniqueBrandSlug(supabase, d.slug || d.name, id);

  const { error } = await supabase
    .from("brands")
    .update({
      name: d.name,
      slug,
      description: nullifyEmpty(d.description),
      logo_url: logo.value,
      is_active: d.isActive,
    })
    .eq("id", id);

  if (error) return { ok: false, error: mapWriteError(error.message) };

  revalidateBrands();
  return { ok: true, data: { id } };
}

/** Activa u oculta una marca (is_active). */
export async function setBrandActive(id: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();

  if (!uuid.safeParse(id).success) {
    return { ok: false, error: "Identificador de marca inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("brands").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, error: mapWriteError(error.message) };

  revalidateBrands();
  return { ok: true, data: undefined };
}

/** Elimina una marca SOLO si no tiene productos asociados. */
export async function deleteBrand(id: string): Promise<ActionResult> {
  await requireAdmin();

  if (!uuid.safeParse(id).success) {
    return { ok: false, error: "Identificador de marca inválido." };
  }

  const supabase = await createClient();

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", id);

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: "No se puede eliminar: la marca tiene productos asociados. Ocúltala en su lugar.",
    };
  }

  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) return { ok: false, error: mapWriteError(error.message) };

  revalidateBrands();
  return { ok: true, data: undefined };
}

/** Reordena marcas: sort_order = posición en el arreglo recibido. */
export async function reorderBrands(orderedIds: string[]): Promise<ActionResult> {
  await requireAdmin();

  if (!Array.isArray(orderedIds) || orderedIds.some((id) => !uuid.safeParse(id).success)) {
    return { ok: false, error: "Lista de orden inválida." };
  }

  const supabase = await createClient();

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("brands")
      .update({ sort_order: i + 1 })
      .eq("id", orderedIds[i]);
    if (error) return { ok: false, error: mapWriteError(error.message) };
  }

  revalidateBrands();
  return { ok: true, data: undefined };
}
