import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminEmail, unauthorizedResponse } from "@/lib/admin-session";
import { recordSecurityEvent } from "@/lib/security";
import {
  getSmtpSettings,
  saveSmtpSettings,
  type EditableSmtpSettings,
} from "@/lib/mail/smtp-settings";

const updateSmtpSettingsSchema = z.object({
  form_id: z.string().uuid(),
  host: z.string().trim().min(1).max(255),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean(),
  user: z.string().trim().min(1).max(255),
  password: z.string().max(512).optional().default(""),
  fromEmail: z.string().trim().email().max(255),
  fromName: z.string().trim().min(1).max(255),
});

export async function GET(request: Request) {
  if (!(await getAdminEmail())) return unauthorizedResponse();

  const formId = z
    .string()
    .uuid()
    .safeParse(new URL(request.url).searchParams.get("form_id"));
  if (!formId.success) {
    return NextResponse.json(
      { message: "ID form non valido" },
      { status: 400 },
    );
  }

  try {
    const settings = await getSmtpSettings(formId.data);
    return NextResponse.json({
      host: settings?.host ?? process.env.SMTP_HOST ?? "",
      port: settings?.port ?? Number(process.env.SMTP_PORT ?? "587"),
      secure: settings?.secure ?? process.env.SMTP_SECURE === "true",
      user: settings?.user ?? process.env.SMTP_USER ?? "",
      fromEmail: settings?.fromEmail ?? process.env.SMTP_FROM_EMAIL ?? "",
      fromName: settings?.fromName ?? process.env.SMTP_FROM_NAME ?? "",
      passwordConfigured: Boolean(settings?.password),
    });
  } catch {
    return NextResponse.json(
      { message: "Impossibile caricare la configurazione SMTP" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const email = await getAdminEmail();
  if (!email) return unauthorizedResponse();

  try {
    const body = updateSmtpSettingsSchema.parse(await request.json());
    const current = await getSmtpSettings(body.form_id);
    const password = body.password || current?.password || "";

    if (!password) {
      return NextResponse.json(
        { message: "Inserisci la password SMTP" },
        { status: 400 },
      );
    }

    const settings: EditableSmtpSettings = {
      host: body.host,
      port: body.port,
      secure: body.secure,
      user: body.user,
      fromEmail: body.fromEmail,
      fromName: body.fromName,
    };
    await saveSmtpSettings(body.form_id, settings, password);
    await recordSecurityEvent(request, "admin_smtp_settings_updated", email, {
      formId: body.form_id,
      changedKeys: Object.keys(settings),
      passwordChanged: Boolean(body.password),
    });

    return NextResponse.json({ message: "Impostazioni SMTP aggiornate" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? "Payload non valido" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Impossibile salvare la configurazione SMTP" },
      { status: 500 },
    );
  }
}