create table if not exists public.admin_login_challenges (
  id uuid primary key default gen_random_uuid(),
  email text not null references public.users(email) on update cascade on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempts integer not null default 0 check (attempts >= 0 and attempts <= 5),
  created_at timestamptz not null default now()
);

create index if not exists admin_login_challenges_email_created_idx
  on public.admin_login_challenges (email, created_at desc);
create index if not exists admin_login_challenges_expires_idx
  on public.admin_login_challenges (expires_at);

alter table public.admin_login_challenges enable row level security;