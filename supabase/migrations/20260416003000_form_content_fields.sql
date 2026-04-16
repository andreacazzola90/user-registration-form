alter table public.forms
  add column if not exists info_title text not null default 'Informazioni sulla passeggiata',
  add column if not exists info_description text not null default 'Descrizione della passeggiata',
  add column if not exists registration_title text not null default 'Compila il form di registrazione',
  add column if not exists registration_description text not null default 'Compila i campi seguenti per completare l''iscrizione.',
  add column if not exists submit_note text not null default 'Riceverai una mail di conferma o lista d''attesa.',
  add column if not exists slider_data jsonb not null default '[]'::jsonb;
