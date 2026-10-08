update public.event_settings
set
  cookie_text = '',
  privacy_text = case
    when lower(trim(coalesce(privacy_text, ''))) in ('', 'testo privacy')
      then 'Useremo i dati che inserisci per gestire la tua iscrizione e le comunicazioni relative all’evento. Per conoscere il titolare del trattamento, le finalità e la base giuridica, i tempi di conservazione e i tuoi diritti, consulta l’informativa privacy completa.'
    else privacy_text
  end;