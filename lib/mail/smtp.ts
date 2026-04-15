import nodemailer from "nodemailer";

export type RecapField = {
  label: string;
  value: string;
};

type RegistrationEmailPayload = {
  to: string;
  fullName: string;
  status: "confirmed" | "waitlist";
  recapFields: RecapField[];
  manageUrl?: string;
  cancelUrl?: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
};

function parseSecure(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD?.trim();
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim();
  const fromName =
    process.env.SMTP_FROM_NAME?.trim() || "Segreteria iscrizioni";

  const parsedPort = Number(process.env.SMTP_PORT ?? "587");
  const port = Number.isFinite(parsedPort) ? parsedPort : 587;
  const secure = parseSecure(process.env.SMTP_SECURE, port === 465);

  if (!host || !user || !password || !fromEmail) {
    return null;
  }

  return {
    host,
    port,
    secure,
    user,
    password,
    fromEmail,
    fromName,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toNumberOrZero(value: string) {
  const parsed = Number(value.replace(",", ".").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function getParticipantsCount(recapFields: RecapField[]) {
  return recapFields.reduce((total, field) => {
    const isParticipantsField = /adulti|bambini|partecipanti/i.test(
      field.label,
    );
    if (!isParticipantsField) {
      return total;
    }

    return total + toNumberOrZero(field.value);
  }, 0);
}

function buildHtmlBody(
  fullName: string,
  status: "confirmed" | "waitlist",
  recapFields: RecapField[],
  manageUrl?: string,
  cancelUrl?: string,
) {
  const participantsCount = getParticipantsCount(recapFields);
  const participantsText =
    participantsCount > 0 ? String(participantsCount) : "Non specificato";
  const contactEmail =
    process.env.CONTACT_EMAIL?.trim() ||
    process.env.SMTP_FROM_EMAIL?.trim() ||
    "";

  const statusParagraph =
    status === "confirmed"
      ? "la presente per confermare la Sua prenotazione per la passeggiata prevista in data 24/05/26 alle ore 10.00."
      : "la presente per confermare la ricezione della Sua prenotazione. Al momento la richiesta risulta in lista d'attesa e Le comunicheremo tempestivamente eventuali aggiornamenti.";

  const rows = recapFields
    .map(
      (field) =>
        `<tr><td style="padding:8px 10px;border:1px solid #dce3ea;font-weight:700;">${escapeHtml(field.label)}</td><td style="padding:8px 10px;border:1px solid #dce3ea;">${escapeHtml(field.value)}</td></tr>`,
    )
    .join("");

  const linksSection =
    manageUrl && cancelUrl
      ? `<p style="margin:16px 0 0;">Puoi gestire la tua prenotazione dai seguenti link:</p>
      <ul style="margin:8px 0 0 18px;padding:0;">
        <li><a href="${escapeHtml(manageUrl)}">Modifica prenotazione</a></li>
        <li><a href="${escapeHtml(cancelUrl)}">Cancella prenotazione</a></li>
      </ul>`
      : "";

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.45;color:#1f2f35;max-width:680px;margin:0 auto;">
      <p style="margin:0 0 12px;">Gentile ${escapeHtml(fullName || "Cliente")},</p>
      <p style="margin:0 0 12px;">${escapeHtml(statusParagraph)}</p>
      <p style="margin:0 0 6px;">Punto di ritrovo: CGP Monte di Malo</p>
      <p style="margin:0 0 6px;">Durata prevista: 2 ore circa</p>
      <p style="margin:0 0 12px;">Numero partecipanti: ${escapeHtml(participantsText)}</p>

      <p style="margin:0 0 12px;">Le iscrizioni saranno aperte dalle 9.30 alle 10.00.</p>
      <p style="margin:0 0 12px;">Chiediamo di essere puntuali in quanto, trattandosi di una passeggiata itinerante, si partira tutti insieme alle ore 10.00 per poter garantire ai bambini il regolare svolgimento dei laboratori.</p>

      <p style="margin:0 0 6px;">Si consiglia di venire muniti di:</p>
      <ul style="margin:0 0 12px 18px;padding:0;">
        <li>abbigliamento comodo e scarpe da ginnastica</li>
        <li>acqua</li>
        <li>passeggino da trekking</li>
        <li>consigliamo di portare un bicchiere da casa per il ristoro</li>
      </ul>

      <p style="margin:0 0 12px;">Con l'occasione ricordiamo che per il pranzo vi e la possibilita di usufruire del ricco Stand della Sagra di San Giuseppe che si terra nel piazzale della Chiesa.</p>
      <p style="margin:0 0 12px;">In caso di necessita o variazioni, non esiti a contattarci alla mail: ${escapeHtml(contactEmail || "[inserire email contatto]")}</p>

      <p style="margin:0 0 12px;">Di seguito trova il riepilogo dei dati inseriti:</p>
      <table style="width:100%;border-collapse:collapse;background:#fff;">${rows}</table>
      ${linksSection}

      <p style="margin:16px 0 0;">Restiamo a disposizione per qualsiasi informazione e Le auguriamo una piacevole esperienza.</p>
      <p style="margin:12px 0 0;">Cordiali saluti,<br/>Lo Staff di "Tra i fili d'erba"</p>
    </div>
  `;
}

function buildTextBody(
  fullName: string,
  status: "confirmed" | "waitlist",
  recapFields: RecapField[],
  manageUrl?: string,
  cancelUrl?: string,
) {
  const participantsCount = getParticipantsCount(recapFields);
  const participantsText =
    participantsCount > 0 ? String(participantsCount) : "Non specificato";
  const contactEmail =
    process.env.CONTACT_EMAIL?.trim() ||
    process.env.SMTP_FROM_EMAIL?.trim() ||
    "";

  const statusParagraph =
    status === "confirmed"
      ? "la presente per confermare la Sua prenotazione per la passeggiata prevista in data 24/05/26 alle ore 10.00."
      : "la presente per confermare la ricezione della Sua prenotazione. Al momento la richiesta risulta in lista d'attesa e Le comunicheremo tempestivamente eventuali aggiornamenti.";

  const rows = recapFields
    .map((field) => `- ${field.label}: ${field.value}`)
    .join("\n");

  const links =
    manageUrl && cancelUrl
      ? [
          "",
          "Gestione prenotazione:",
          `- Modifica: ${manageUrl}`,
          `- Cancella: ${cancelUrl}`,
        ]
      : [];

  return [
    `Gentile ${fullName || "Cliente"},`,
    "",
    statusParagraph,
    "",
    "Punto di ritrovo: CGP Monte di Malo",
    "Durata prevista: 2 ore circa",
    `Numero partecipanti: ${participantsText}`,
    "",
    "Le iscrizioni saranno aperte dalle 9.30 alle 10.00.",
    "Chiediamo di essere puntuali in quanto, trattandosi di una passeggiata itinerante, si partira tutti insieme alle ore 10.00 per poter garantire ai bambini il regolare svolgimento dei laboratori.",
    "",
    "Si consiglia di venire muniti di:",
    "- abbigliamento comodo e scarpe da ginnastica",
    "- acqua",
    "- passeggino da trekking",
    "- consigliamo di portare un bicchiere da casa per il ristoro",
    "",
    "Con l'occasione ricordiamo che per il pranzo vi e la possibilita di usufruire del ricco Stand della Sagra di San Giuseppe che si terra nel piazzale della Chiesa.",
    `In caso di necessita o variazioni, non esiti a contattarci alla mail: ${contactEmail || "[inserire email contatto]"}`,
    "",
    "Riepilogo dati inseriti:",
    rows,
    ...links,
    "",
    "Restiamo a disposizione per qualsiasi informazione e Le auguriamo una piacevole esperienza!",
    "",
    "Cordiali saluti,",
    'Lo Staff di "Tra i fili d\'erba"',
  ].join("\n");
}

export async function sendRegistrationRecapEmail(
  payload: RegistrationEmailPayload,
) {
  const config = getSmtpConfig();
  if (!config) {
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  await transporter.sendMail({
    from: `${config.fromName} <${config.fromEmail}>`,
    to: payload.to,
    subject:
      payload.status === "confirmed"
        ? "Conferma prenotazione passeggiata 24/05/26"
        : "Prenotazione ricevuta - lista d'attesa passeggiata 24/05/26",
    html: buildHtmlBody(
      payload.fullName,
      payload.status,
      payload.recapFields,
      payload.manageUrl,
      payload.cancelUrl,
    ),
    text: buildTextBody(
      payload.fullName,
      payload.status,
      payload.recapFields,
      payload.manageUrl,
      payload.cancelUrl,
    ),
  });

  return true;
}
