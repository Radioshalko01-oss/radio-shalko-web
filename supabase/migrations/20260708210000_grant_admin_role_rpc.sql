-- RPC para otorgar admin desde el servidor (service_role). Desactiva el trigger anti-escalada temporalmente.
create or replace function public.grant_admin_role(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  alter table public.profiles disable trigger profiles_prevent_escalation;
  update public.profiles
  set role = 'admin'
  where lower(email) = lower(p_email);
  alter table public.profiles enable trigger profiles_prevent_escalation;
end;
$$;

revoke all on function public.grant_admin_role(text) from public;
grant execute on function public.grant_admin_role(text) to service_role;

-- Cuenta operativa Radio Shalko
select public.grant_admin_role('radioshalkoadministrador@gmail.com');
