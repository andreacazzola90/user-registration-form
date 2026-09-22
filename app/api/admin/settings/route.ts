import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdminEmail, unauthorizedResponse } from "@/lib/admin-session";
import { recordSecurityEvent } from "@/lib/security";

const updateSettingsSchema = z.object({
  form_id: z.string().uuid(),
  lab_capacity: z.number().int().positive().optional(),
  lab_capacity_enabled: z.boolean().optional(),
  max_participants: z.number().int().positive().optional(),
  registrations_close_at: z.string().datetime().nullable().optional(),
});

async function requireUser() {
  const email = await getAdminEmail();
  const supabase = createSupabaseAdminClient();
  return { supabase, email };
}

export async function PUT(request: Request) {
  const { supabase, email } = await requireUser();

  if (!email) {
    return unauthorizedResponse();
  }

  try {
    const body = updateSettingsSchema.parse(await request.json());

    const { data: settingsRow, error: settingsReadError } = await supabase
      .from("event_settings")
      .select("id, lab_capacity_enabled")
      .eq("form_id", body.form_id)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (settingsReadError) {
      return NextResponse.json(
        { message: settingsReadError.message },
        { status: 500 },
      );
    }

    const updatesLabSettings =
      body.lab_capacity !== undefined ||
      body.lab_capacity_enabled !== undefined;

    if (updatesLabSettings) {
      const { data: form, error: formError } = await supabase
        .from("forms")
        .select("slug")
        .eq("id", body.form_id)
        .maybeSingle();

      if (formError) {
        return NextResponse.json(
          { message: formError.message },
          { status: 500 },
        );
      }

      if (form?.slug !== "passeggiata-monte-di-malo") {
        return NextResponse.json(
          { message: "Il controllo laboratori non e disponibile per questo form" },
          { status: 400 },
        );
      }
    }

    if (
      body.lab_capacity !== undefined &&
      !settingsRow?.lab_capacity_enabled &&
      body.lab_capacity_enabled !== true
    ) {
      return NextResponse.json(
        { message: "La capienza laboratori non e abilitata per questo form" },
        { status: 400 },
      );
    }

    if (!settingsRow) {
      const { error: insertError } = await supabase
        .from("event_settings")
        .insert({
          form_id: body.form_id,
          ...(body.lab_capacity !== undefined
            ? { lab_capacity: body.lab_capacity }
            : {}),
          ...(body.lab_capacity_enabled !== undefined
            ? { lab_capacity_enabled: body.lab_capacity_enabled }
            : {}),
          ...(body.max_participants !== undefined
            ? { max_participants: body.max_participants }
            : {}),
          ...(body.registrations_close_at !== undefined
            ? { registrations_close_at: body.registrations_close_at }
            : {}),
        });

      if (insertError) {
        return NextResponse.json(
          { message: insertError.message },
          { status: 400 },
        );
      }

      await recordSecurityEvent(request, "admin_settings_created", email, {
        formId: body.form_id,
        changedKeys: Object.keys(body).filter((key) => key !== "form_id"),
      });
      return NextResponse.json({ message: "Regole aggiornate" });
    }

    const { error: updateError } = await supabase
      .from("event_settings")
      .update({
        ...(body.lab_capacity !== undefined
          ? { lab_capacity: body.lab_capacity }
          : {}),
        ...(body.lab_capacity_enabled !== undefined
          ? { lab_capacity_enabled: body.lab_capacity_enabled }
          : {}),
        ...(body.max_participants !== undefined
          ? { max_participants: body.max_participants }
          : {}),
        ...(body.registrations_close_at !== undefined
          ? { registrations_close_at: body.registrations_close_at }
          : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", settingsRow.id);

    if (updateError) {
      return NextResponse.json(
        { message: updateError.message },
        { status: 400 },
      );
    }

    await recordSecurityEvent(request, "admin_settings_updated", email, {
      formId: body.form_id,
      changedKeys: Object.keys(body).filter((key) => key !== "form_id"),
    });
    return NextResponse.json({ message: "Regole aggiornate" });
  } catch {
    return NextResponse.json(
      { message: "Payload non valido" },
      { status: 400 },
    );
  }
}
