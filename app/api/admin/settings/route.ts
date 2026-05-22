import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdminEmail, unauthorizedResponse } from "@/lib/admin-session";

const updateSettingsSchema = z.object({
  form_id: z.string().uuid(),
  lab_capacity: z.number().int().positive(),
  max_participants: z.number().int().positive(),
  registrations_close_at: z.string().datetime().nullable(),
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
      .select("id")
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

    if (!settingsRow) {
      const { error: insertError } = await supabase
        .from("event_settings")
        .insert({
          form_id: body.form_id,
          lab_capacity: body.lab_capacity,
          max_participants: body.max_participants,
          registrations_close_at: body.registrations_close_at,
        });

      if (insertError) {
        return NextResponse.json(
          { message: insertError.message },
          { status: 400 },
        );
      }

      return NextResponse.json({ message: "Regole aggiornate" });
    }

    const { error: updateError } = await supabase
      .from("event_settings")
      .update({
        lab_capacity: body.lab_capacity,
        max_participants: body.max_participants,
        registrations_close_at: body.registrations_close_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settingsRow.id);

    if (updateError) {
      return NextResponse.json(
        { message: updateError.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ message: "Regole aggiornate" });
  } catch {
    return NextResponse.json(
      { message: "Payload non valido" },
      { status: 400 },
    );
  }
}
