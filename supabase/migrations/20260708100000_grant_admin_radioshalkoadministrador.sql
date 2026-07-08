-- Otorga rol admin a la cuenta operativa de Radio Shalko.
-- Requiere que el usuario ya exista en auth.users / profiles (iniciar sesión al menos una vez).
update public.profiles
set role = 'admin'
where lower(email) = lower('radioshalkoadministrador@gmail.com');
