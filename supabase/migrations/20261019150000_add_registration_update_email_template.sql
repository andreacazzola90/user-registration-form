alter table public.form_email_templates
  add column if not exists update_subject text not null default 'Conferma modifica prenotazione - {{nome}}',
  add column if not exists update_body text not null default E'Gentile {{nome}},\n\nla tua prenotazione è stata aggiornata con successo. Di seguito trovi il riepilogo aggiornato dei dati inseriti.\n\nRiepilogo aggiornato:\n{{riepilogo}}\n\nPuoi visualizzare o modificare la prenotazione da questo link:\n{{link_cancellazione}}\n\nCordiali saluti,\nLo Staff di "Tra i fili d''erba"';
