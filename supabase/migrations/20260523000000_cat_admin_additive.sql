-- Radio Shalko Web — Fase CAT-2
-- Migración aditiva para preparar categorías y marcas administrables.
--
-- Alcance (SOLO columnas nuevas, sin pérdida de datos):
--   - categories     + is_active (default true), + description
--   - subcategories  + is_active (default true)
--   - brands         + is_active (default true), + description
--
-- Características:
--   - Idempotente: usa "add column if not exists"; re-ejecutable sin error.
--   - Segura para producción: solo agrega columnas con DEFAULT; las filas
--     existentes quedan is_active = true (visibles, sin cambio de comportamiento).
--   - NO toca RLS, índices, FKs, datos ni otras tablas.
--
-- Aplicar con: SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-supabase-migrations.mjs
--   (o pegando este SQL en el SQL Editor del dashboard de Supabase RadioShalko)

-- =============================================================
-- 1. CATEGORIES
-- =============================================================
alter table public.categories
  add column if not exists is_active boolean not null default true,
  add column if not exists description text;

-- =============================================================
-- 2. SUBCATEGORIES
-- =============================================================
alter table public.subcategories
  add column if not exists is_active boolean not null default true;

-- =============================================================
-- 3. BRANDS
-- =============================================================
alter table public.brands
  add column if not exists is_active boolean not null default true,
  add column if not exists description text;
