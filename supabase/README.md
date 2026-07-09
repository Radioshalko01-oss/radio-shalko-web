# Supabase — Radio Shalko Web

**Proyecto:** [RadioShalko](https://supabase.com/dashboard/project/actxvfjtejmpkjernvtw)  
**URL:** `https://actxvfjtejmpkjernvtw.supabase.co`

## Estado del setup

| Item | Estado |
|------|--------|
| Tablas (`profiles`, `products`, `categories`, …) | Aplicado |
| RLS + políticas públicas / admin | Aplicado |
| Trigger `on_auth_user_created` → `profiles` | Aplicado |
| Storage buckets (`product-images`, `brand-logos`, `banners`) | Aplicado |
| Seed categorías | Aplicado |
| `.env.local` en raíz del Next.js | Configurado |

## Variables de entorno

Copia desde `.env.example` si no tienes `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://actxvfjtejmpkjernvtw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key del dashboard>
SUPABASE_SERVICE_ROLE_KEY=<service_role — solo servidor>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Keys: **Dashboard → Project Settings → API**

## Aplicar migraciones (remoto)

Con [Personal Access Token](https://supabase.com/dashboard/account/tokens) (no guardar en git):

```bash
SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-supabase-migrations.mjs
```

## Crear primer administrador

1. Activa **Google** en Authentication → Providers.  
2. Configura **Authentication → URL Configuration** en el [dashboard de Radio Shalko](https://supabase.com/dashboard/project/actxvfjtejmpkjernvtw/auth/url-configuration):

   - **Site URL (producción):** `https://radio-shalko-web.vercel.app`
   - **Redirect URLs** (añade todas las que uses en local):

   ```
   http://localhost:3002/auth/callback
   http://localhost:3002/**
   http://localhost:3000/auth/callback
   http://localhost:3003/auth/callback
   http://192.168.*.*:3002/auth/callback
   http://10.*.*.*:3002/auth/callback
   https://radio-shalko-web.vercel.app/auth/callback
   ```

   Si falta el puerto local en Redirect URLs, Supabase ignora `redirectTo` y manda el `code` a la Site URL de producción (Vercel).

3. Inicia sesión en `http://localhost:3002/login` (el dev server usa puerto **3002**).
4. En SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'tu-email@gmail.com';
```

## MCP en Cursor

El MCP `user-supabaseSeedisApp` apunta al proyecto **Seedis**, no a Radio Shalko.  
Para este proyecto usa el token de cuenta con acceso a `actxvfjtejmpkjernvtw`, o configura un MCP dedicado a Radio Shalko.

## Próximo paso en la app

Conectar el catálogo: reemplazar `src/lib/products.ts` (mock) por queries a `products`, `categories`, `brands`.
