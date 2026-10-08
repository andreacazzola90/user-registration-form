alter table public.event_settings
  add column if not exists privacy_markdown text not null default '';