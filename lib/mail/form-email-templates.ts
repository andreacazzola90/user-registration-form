import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_FORM_EMAIL_TEMPLATES,
  type FormEmailTemplates,
} from "@/lib/mail/email-template-defaults";

export async function getFormEmailTemplates(
  formId: string,
): Promise<FormEmailTemplates> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("form_email_templates")
    .select(
      "confirmation_subject, confirmation_body, waitlist_subject, waitlist_body",
    )
    .eq("form_id", formId)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") {
      return DEFAULT_FORM_EMAIL_TEMPLATES;
    }
    throw new Error(`Unable to load form email templates: ${error.message}`);
  }

  if (!data) return DEFAULT_FORM_EMAIL_TEMPLATES;

  return {
    confirmationSubject: data.confirmation_subject,
    confirmationBody: data.confirmation_body,
    waitlistSubject: data.waitlist_subject,
    waitlistBody: data.waitlist_body,
  };
}

export async function saveFormEmailTemplates(
  formId: string,
  templates: FormEmailTemplates,
) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("form_email_templates").upsert(
    {
      form_id: formId,
      confirmation_subject: templates.confirmationSubject,
      confirmation_body: templates.confirmationBody,
      waitlist_subject: templates.waitlistSubject,
      waitlist_body: templates.waitlistBody,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "form_id" },
  );

  if (error) throw new Error(error.message);
}