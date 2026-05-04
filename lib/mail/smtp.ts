import nodemailer from "nodemailer";
import { createHash } from "node:crypto";

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

const RECENT_SEND_WINDOW_MS = 30_000;
const recentSendCache = new Map<string, number>();

function buildSendFingerprint(payload: RegistrationEmailPayload) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        to: payload.to.trim().toLowerCase(),
        fullName: payload.fullName.trim(),
        status: payload.status,
        recapFields: payload.recapFields,
        manageUrl: payload.manageUrl ?? "",
        cancelUrl: payload.cancelUrl ?? "",
      }),
    )
    .digest("hex");
}

function isDuplicateRecentSend(fingerprint: string) {
  const now = Date.now();

  for (const [key, timestamp] of recentSendCache.entries()) {
    if (now - timestamp > RECENT_SEND_WINDOW_MS) {
      recentSendCache.delete(key);
    }
  }

  const previous = recentSendCache.get(fingerprint);
  if (!previous) {
    recentSendCache.set(fingerprint, now);
    return false;
  }

  if (now - previous <= RECENT_SEND_WINDOW_MS) {
    return true;
  }

  recentSendCache.set(fingerprint, now);
  return false;
}

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
  const password =
    process.env.SECRET_SMTP_PASSWORD?.trim() ??
    process.env.SMTP_PASSWORD?.trim();
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
      ? "la presente per confermare la Sua prenotazione per la passeggiata prevista in data 24/05/26 alle ore 9.30."
      : "la presente per confermare la ricezione della Sua prenotazione. Al momento la richiesta risulta in lista d'attesa e Le comunicheremo tempestivamente eventuali aggiornamenti.";

  const rows = recapFields
    .map(
      (field) =>
        `<tr><td style="padding:8px 10px;border:1px solid #dce3ea;font-weight:700;">${escapeHtml(field.label)}</td><td style="padding:8px 10px;border:1px solid #dce3ea;">${escapeHtml(field.value)}</td></tr>`,
    )
    .join("");

  const linkItems = [
    cancelUrl
      ? `<li><a href="${escapeHtml(cancelUrl)}">Cancella prenotazione</a></li>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const linksSection = linkItems
    ? `<p style="margin:16px 0 0;">Puoi gestire la tua prenotazione dai seguenti link:</p>
      <ul style="margin:8px 0 0 18px;padding:0;">${linkItems}</ul>`
    : "";

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.45;color:#1f2f35;max-width:680px;margin:0 auto;">
      <p style="margin:0 0 12px;">Gentile ${escapeHtml(fullName || "Cliente")},</p>
      <p style="margin:0 0 12px;">${escapeHtml(statusParagraph)}</p>
      <p style="margin:0 0 6px;">Punto di ritrovo: CGP Monte di Malo</p>
      <p style="margin:0 0 6px;">Durata prevista: 2 ore circa</p>
      <p style="margin:0 0 12px;">Numero partecipanti: ${escapeHtml(participantsText)}</p>

      <p style="margin:0 0 12px;">Le iscrizioni saranno aperte dalle 9.00 alle 9.30.</p>
      <p style="margin:0 0 12px;">Chiediamo di essere puntuali in quanto, trattandosi di una passeggiata itinerante, si partira tutti insieme alle ore 9.30 per poter garantire ai bambini il regolare svolgimento dei laboratori.</p>

      <p style="margin:0 0 6px;">Si consiglia di venire muniti di:</p>
      <ul style="margin:0 0 12px 18px;padding:0;">
        <li>Per facilitare l'organizzazione, chiediamo gentilmente di portare contanti con importo esatto (Pagamento solo in contanti). Il costo e' di <strong>3 euro a partecipante per i bambini sopra i 3 anni</strong> (gratuito per i bambini fino a 3 anni compresi)</li>
        <li>abbigliamento comodo e scarpe da ginnastica</li>
        <li>acqua</li>
        <li>passeggino da trekking</li>
        <li>consigliamo di portare un bicchiere da casa per il ristoro</li>
      </ul>

      <p style="margin:0 0 12px;">Con l'occasione ricordiamo che per il pranzo vi è la possibilità di usufruire del ricco Stand gastronomico della Sagra di San Giuseppe che si terrà nel piazzale della Chiesa.</p>
      <p style="margin:0 0 12px;">In caso di necessita o variazioni, non esiti a contattarci alla mail: ${escapeHtml(contactEmail || "[inserire email contatto]")}</p>

      <p style="margin:0 0 12px;">Di seguito trova il riepilogo dei dati inseriti:</p>

      <table style="width:100%;border-collapse:collapse;background:#fff;">${rows}</table>
      ${linksSection}

      <p style="margin:16px 0 0;">“Alla fine del percorso, una sorpresa aspetta ogni bambino partecipante al laboratorio!” 🎁</p>
      <p style="margin:16px 0 0;font-size:13px;color:#556677;">Nota: se non dovesse trovare questa email nella posta in arrivo, verifichi anche la cartella <strong>Spam</strong> o <strong>Posta indesiderata</strong>.</p>
      <p style="margin:16px 0 0;font-size:12px;color:#778899;"><em>Gli organizzatori declinano ogni responsabilit&agrave; per danni a persone o cose che dovessero verificarsi prima, durante o dopo la manifestazione.</em></p>
      <p style="margin:16px 0 0;">Restiamo a disposizione per qualsiasi informazione e Le auguriamo una piacevole esperienza.</p>
      <p style="margin:12px 0 0;">Cordiali saluti,<br/>Lo Staff di "Tra i fili d'erba"</p>
    </div>
  `;
}

export async function sendRegistrationRecapEmail(
  payload: RegistrationEmailPayload,
) {
  console.log("[SMTP] sendRegistrationRecapEmail called for:", payload.to);

  const fingerprint = buildSendFingerprint(payload);
  if (isDuplicateRecentSend(fingerprint)) {
    console.warn("[SMTP] Duplicate email send suppressed for:", payload.to);
    return true;
  }

  const config = getSmtpConfig();
  if (!config) {
    console.error(
      "[SMTP] Config mancante — controlla SMTP_HOST, SMTP_USER, SECRET_SMTP_PASSWORD (o SMTP_PASSWORD), SMTP_FROM_EMAIL nel .env",
    );
    return false;
  }

  console.log("[SMTP] Config caricata:", {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user,
    fromEmail: config.fromEmail,
  });

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  console.log("[SMTP] Verifica connessione al server...");
  await transporter.verify();
  console.log("[SMTP] Connessione verificata. Invio email a:", payload.to);

  const info = await transporter.sendMail({
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
  });

  console.log("[SMTP] Email inviata con successo. MessageId:", info.messageId);
  return true;
}
