export type FormEmailTemplates = {
  confirmationSubject: string;
  confirmationBody: string;
  waitlistSubject: string;
  waitlistBody: string;
};

export const DEFAULT_FORM_EMAIL_TEMPLATES: FormEmailTemplates = {
  confirmationSubject: "Conferma prenotazione passeggiata 24/05/26",
  confirmationBody: `Gentile {{nome}},

la presente per confermare la Sua prenotazione per la passeggiata prevista in data 24/05/26 alle ore 9.30.

Punto di ritrovo: CGP Monte di Malo
Durata prevista: 2 ore circa
Numero partecipanti: {{numero_partecipanti}}

Le iscrizioni saranno aperte dalle 9.00 alle 9.30.

Si consiglia di venire muniti di:
- contanti con importo esatto. Il costo e' di 3 euro a partecipante dai 10 anni in su (gratuito per i bambini sotto i 10 anni)
- abbigliamento comodo e scarpe da ginnastica
- acqua
- passeggino da trekking
- un bicchiere da casa per il ristoro

Per il pranzo e' possibile usufruire dello stand gastronomico della Sagra di San Giuseppe nel piazzale della Chiesa.

Per necessita o variazioni, contattaci all'indirizzo: {{email_contatto}}

Riepilogo dei dati inseriti:
{{riepilogo}}

{{link_cancellazione}}

Cordiali saluti,
Lo Staff di "Tra i fili d'erba"`,
  waitlistSubject:
    "Prenotazione ricevuta - lista d'attesa passeggiata 24/05/26",
  waitlistBody: `Gentile {{nome}},

la presente per confermare la ricezione della Sua prenotazione. Al momento la richiesta risulta in lista d'attesa e Le comunicheremo tempestivamente eventuali aggiornamenti.

Numero partecipanti: {{numero_partecipanti}}

Per necessita o variazioni, contattaci all'indirizzo: {{email_contatto}}

Riepilogo dei dati inseriti:
{{riepilogo}}

{{link_cancellazione}}

Cordiali saluti,
Lo Staff di "Tra i fili d'erba"`,
};