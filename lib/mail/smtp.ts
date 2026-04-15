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

function buildHtmlBody(
  fullName: string,
  status: "confirmed" | "waitlist",
  recapFields: RecapField[],
  manageUrl?: string,
  cancelUrl?: string,
) {
  const statusText =
    status === "confirmed"
      ? "La tua iscrizione e' stata confermata."
      : "La tua iscrizione e' in lista d'attesa.";

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
      <h2 style="margin:0 0 8px;">Grazie per la tua iscrizione</h2>
      <p style="margin:0 0 16px;">Ciao ${escapeHtml(fullName)}, ${statusText}</p>
      <p style="margin:0 0 12px;">Di seguito trovi il riepilogo dei dati inseriti:</p>
      <table style="width:100%;border-collapse:collapse;background:#fff;">${rows}</table>
      ${linksSection}
      <p style="margin:16px 0 0;">Ti contatteremo in caso di aggiornamenti.</p>
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
  const statusText =
    status === "confirmed"
      ? "La tua iscrizione e' stata confermata."
      : "La tua iscrizione e' in lista d'attesa.";

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
    `Ciao ${fullName},`,
    "",
    "grazie per la tua iscrizione.",
    statusText,
    "",
    "Riepilogo dati inseriti:",
    rows,
    ...links,
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
    subject: "Grazie per la tua iscrizione - riepilogo dati",
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
