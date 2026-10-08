import nodemailer from "nodemailer";
import { createHash } from "node:crypto";
import { getFormEmailTemplates } from "@/lib/mail/form-email-templates";
import { getSmtpSettings } from "@/lib/mail/smtp-settings";

export type RecapField = {
  label: string;
  value: string;
};

type RegistrationEmailPayload = {
  formId: string;
  to: string;
  fullName: string;
  status: "confirmed" | "waitlist";
  recapFields: RecapField[];
  manageUrl?: string;
  cancelUrl?: string;
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
  template: string,
  recapFields: RecapField[],
  contactEmail: string,
  cancelUrl?: string,
) {
  const participantsCount = getParticipantsCount(recapFields);
  const participantsText =
    participantsCount > 0 ? String(participantsCount) : "Non specificato";
  const rows = recapFields
    .map(
      (field) =>
        `<tr><td style="padding:8px 10px;border:1px solid #dce3ea;font-weight:700;">${escapeHtml(field.label)}</td><td style="padding:8px 10px;border:1px solid #dce3ea;">${escapeHtml(field.value)}</td></tr>`,
    )
    .join("");

  const inlineValues: Record<string, string> = {
    "{{nome}}": fullName || "Cliente",
    "{{numero_partecipanti}}": participantsText,
    "{{email_contatto}}": contactEmail || "",
  };
  const recapTable = `<table style="width:100%;border-collapse:collapse;background:#fff;">${rows}</table>`;
  const cancelLink = cancelUrl
    ? `<p>Puoi gestire o eliminare la tua prenotazione da questo link: <a href="${escapeHtml(cancelUrl)}">Gestisci prenotazione</a></p>`
    : "";
  const renderedBlocks = template
    .trim()
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split(/(\{\{riepilogo\}\}|\{\{link_cancellazione\}\})/g)
        .map((part) => {
          if (part === "{{riepilogo}}") return recapTable;
          if (part === "{{link_cancellazione}}") return cancelLink;
          if (!part.trim()) return "";

          const lines = part.split("\n").map((line) =>
            line
              .split(/(\{\{[^}]+\}\})/g)
              .map((token) => escapeHtml(inlineValues[token] ?? token))
              .join(""),
          );
          return `<p style="margin:0 0 12px;">${lines.join("<br/>")}</p>`;
        })
        .join(""),
    )
    .join("");

  return `<div style="font-family:Arial,sans-serif;line-height:1.45;color:#1f2f35;max-width:680px;margin:0 auto;">${renderedBlocks}</div>`;
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

  const config = await getSmtpSettings(payload.formId);
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

  const emailTemplates = await getFormEmailTemplates(payload.formId);
  const isConfirmed = payload.status === "confirmed";
  const subjectTemplate = isConfirmed
    ? emailTemplates.confirmationSubject
    : emailTemplates.waitlistSubject;
  const bodyTemplate = isConfirmed
    ? emailTemplates.confirmationBody
    : emailTemplates.waitlistBody;

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
    subject: subjectTemplate
      .replaceAll("{{nome}}", payload.fullName || "Cliente")
      .replace(/[\r\n]+/g, " ")
      .trim(),
    html: buildHtmlBody(
      payload.fullName,
      bodyTemplate,
      payload.recapFields,
      process.env.CONTACT_EMAIL?.trim() || config.fromEmail,
      payload.cancelUrl,
    ),
  });

  console.log("[SMTP] Email inviata con successo. MessageId:", info.messageId);
  return true;
}

export async function sendAdminLoginCodeEmail(to: string, code: string) {
  const config = await getSmtpSettings();
  if (!config) return false;

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
  });

  await transporter.sendMail({
    from: `${config.fromName} <${config.fromEmail}>`,
    to,
    subject: "Codice di accesso amministratore",
    text: `Il tuo codice di accesso e: ${code}\n\nScade tra 10 minuti. Se non hai richiesto tu l'accesso, ignora questa email.`,
    html: `<p>Il tuo codice di accesso è:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${escapeHtml(code)}</p><p>Scade tra 10 minuti. Se non hai richiesto tu l'accesso, ignora questa email.</p>`,
  });

  return true;
}
