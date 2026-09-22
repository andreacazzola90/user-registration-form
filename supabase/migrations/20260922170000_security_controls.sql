create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  email text not null references public.users(email) on update cascade on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists admin_sessions_active_email_idx
  on public.admin_sessions (email, expires_at)
  where revoked_at is null;

alter table public.admin_sessions enable row level security;

create table if not exists public.security_events (
  id bigint primary key generated always as identity,
  event_type text not null,
  actor_email text,
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists security_events_created_at_idx
  on public.security_events (created_at desc);
create index if not exists security_events_actor_created_idx
  on public.security_events (actor_email, created_at desc);

alter table public.security_events enable row level security;

create table if not exists public.rate_limits (
  key_hash text not null,
  bucket_start timestamptz not null,
  hits integer not null default 1,
  primary key (key_hash, bucket_start)
);

create index if not exists rate_limits_bucket_start_idx
  on public.rate_limits (bucket_start);

alter table public.rate_limits enable row level security;

create or replace function public.consume_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket_start timestamptz;
  v_hits integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit configuration';
  end if;

  v_bucket_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limits (key_hash, bucket_start, hits)
  values (p_key_hash, v_bucket_start, 1)
  on conflict (key_hash, bucket_start)
  do update set hits = public.rate_limits.hits + 1
  returning hits into v_hits;

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer)
  to service_role;