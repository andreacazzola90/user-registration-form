import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminEmail, unauthorizedResponse } from "@/lib/admin-session";
import { recordSecurityEvent } from "@/lib/security";
import {
  getFormEmailTemplates,
  saveFormEmailTemplates,
} from "@/lib/mail/form-email-templates";

const formIdSchema = z.string().uuid();
const updateEmailTemplatesSchema = z.object({
  formId: z.string().uuid(),
  confirmationSubject: z.string().trim().min(1).max(300),
  confirmationBody: z.string().trim().min(1).max(20_000),
  waitlistSubject: z.string().trim().min(1).max(300),
  waitlistBody: z.string().trim().min(1).max(20_000),
});

export async function GET(request: Request) {
  if (!(await getAdminEmail())) return unauthorizedResponse();

  const parsedFormId = formIdSchema.safeParse(
    new URL(request.url).searchParams.get("form_id"),
  );
  if (!parsedFormId.success) {
    return NextResponse.json({ message: "ID form non valido" }, { status: 400 });
  }

  try {
    return NextResponse.json(await getFormEmailTemplates(parsedFormId.data));
  } catch {
    return NextResponse.json(
      { message: "Impossibile caricare i testi email" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const email = await getAdminEmail();
  if (!email) return unauthorizedResponse();

  try {
    const templates = updateEmailTemplatesSchema.parse(await request.json());
    await saveFormEmailTemplates(templates.formId, {
      confirmationSubject: templates.confirmationSubject,
      confirmationBody: templates.confirmationBody,
      waitlistSubject: templates.waitlistSubject,
      waitlistBody: templates.waitlistBody,
    });
    await recordSecurityEvent(request, "admin_email_templates_updated", email, {
      formId: templates.formId,
    });

    return NextResponse.json({ message: "Testi email aggiornati" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? "Payload non valido" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Impossibile salvare i testi email" },
      { status: 500 },
    );
  }
}