/**
 * Tipos generados manualmente (placeholder).
 * Reemplazar con: npx supabase gen types typescript --project-id <id>
 */
export type UserRole = "user" | "admin";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  price: number;
  category_id: string | null;
  brand_id: string | null;
  slug: string;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  sort_order: number;
  created_at: string;
};
