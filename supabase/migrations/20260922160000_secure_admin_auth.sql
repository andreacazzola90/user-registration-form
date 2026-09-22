create extension if not exists pgcrypto;

alter table public.users
  add column if not exists password_hash text;

update public.users
set password_hash = extensions.crypt(password, extensions.gen_salt('bf', 12))
where password_hash is null;

alter table public.users
  alter column password_hash set not null;

alter table public.users
  drop column if exists password;

create or replace function public.verify_user_password(
  p_email text,
  p_password text
)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1
    from public.users u
    where lower(u.email) = lower(p_email)
      and u.is_active = true
      and u.password_hash = extensions.crypt(p_password, u.password_hash)
  );
$$;

create or replace function public.create_user_with_password(
  p_email text,
  p_password text,
  p_full_name text default null
)
returns public.users
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user public.users;
begin
  insert into public.users (email, password_hash, full_name)
  values (
    lower(trim(p_email)),
    extensions.crypt(p_password, extensions.gen_salt('bf', 12)),
    p_full_name
  )
  returning * into v_user;
  return v_user;
end;
$$;

create or replace function public.update_user_password(
  p_email text,
  p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_count integer;
begin
  update public.users
  set password_hash = extensions.crypt(
    p_new_password,
    extensions.gen_salt('bf', 12)
  )
  where lower(email) = lower(p_email)
    and is_active = true;
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

revoke all on function public.verify_user_password(text, text)
  from public, anon, authenticated;
revoke all on function public.create_user_with_password(text, text, text)
  from public, anon, authenticated;
revoke all on function public.update_user_password(text, text)
  from public, anon, authenticated;

grant execute on function public.verify_user_password(text, text)
  to service_role;
grant execute on function public.create_user_with_password(text, text, text)
  to service_role;
grant execute on function public.update_user_password(text, text)
  to service_role;