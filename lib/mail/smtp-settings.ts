import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
};

export type EditableSmtpSettings = Omit<SmtpSettings, "password">;

type SmtpSettingsRow = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password_ciphertext: string;
  password_iv: string;
  password_auth_tag: string;
  from_email: string;
  from_name: string;
};

function getEncryptionKey() {
  const secret =
    process.env.SMTP_SETTINGS_ENCRYPTION_KEY?.trim() ||
    process.env.SECRET_SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!secret) {
    throw new Error("SMTP settings encryption key is not configured");
  }

  return createHash("sha256").update(`smtp-settings:${secret}`).digest();
}

function encryptPassword(password: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(password, "utf8"),
    cipher.final(),
  ]);

  return {
    password_ciphertext: ciphertext.toString("base64"),
    password_iv: iv.toString("base64"),
    password_auth_tag: cipher.getAuthTag().toString("base64"),
  };
}

function decryptPassword(row: SmtpSettingsRow) {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(row.password_iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(row.password_auth_tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(row.password_ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

function getEnvironmentSettings(): SmtpSettings | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password =
    process.env.SECRET_SMTP_PASSWORD?.trim() ||
    process.env.SMTP_PASSWORD?.trim();
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim();
  const parsedPort = Number(process.env.SMTP_PORT ?? "587");
  const port = Number.isFinite(parsedPort) ? parsedPort : 587;
  const secureValue = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure = secureValue
    ? ["1", "true", "yes"].includes(secureValue)
    : port === 465;

  if (!host || !user || !password || !fromEmail) return null;

  return {
    host,
    port,
    secure,
    user,
    password,
    fromEmail,
    fromName: process.env.SMTP_FROM_NAME?.trim() || "Segreteria iscrizioni",
  };
}

function fromStoredRow(row: SmtpSettingsRow): SmtpSettings {
  return {
    host: row.host,
    port: row.port,
    secure: row.secure,
    user: row.username,
    password: decryptPassword(row),
    fromEmail: row.from_email,
    fromName: row.from_name,
  };
}

export async function getSmtpSettings(
  formId?: string,
): Promise<SmtpSettings | null> {
  const supabase = createSupabaseAdminClient();

  if (formId) {
    const { data: formSettings, error: formSettingsError } = await supabase
      .from("form_smtp_settings")
      .select(
        "host, port, secure, username, password_ciphertext, password_iv, password_auth_tag, from_email, from_name",
      )
      .eq("form_id", formId)
      .maybeSingle();

    if (
      formSettingsError &&
      formSettingsError.code !== "PGRST205" &&
      formSettingsError.code !== "42P01"
    ) {
      throw new Error(
        `Unable to load form SMTP settings: ${formSettingsError.message}`,
      );
    }

    if (formSettings) return fromStoredRow(formSettings as SmtpSettingsRow);
  }

  const { data, error } = await supabase
    .from("smtp_settings")
    .select(
      "host, port, secure, username, password_ciphertext, password_iv, password_auth_tag, from_email, from_name",
    )
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") {
      return getEnvironmentSettings();
    }
    throw new Error(`Unable to load SMTP settings: ${error.message}`);
  }

  if (!data) return getEnvironmentSettings();

  return fromStoredRow(data as SmtpSettingsRow);
}

export async function saveSmtpSettings(
  formId: string,
  settings: EditableSmtpSettings,
  password: string,
) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("form_smtp_settings").upsert(
    {
      form_id: formId,
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      username: settings.user,
      ...encryptPassword(password),
      from_email: settings.fromEmail,
      from_name: settings.fromName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "form_id" },
  );

  if (error) throw new Error(error.message);
}