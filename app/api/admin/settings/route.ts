import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const updateSettingsSchema = z.object({
  lab_capacity: z.number().int().positive(),
});

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function PUT(request: Request) {
  const { supabase, user } = await requireUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = updateSettingsSchema.parse(await request.json());

    const { data: settingsRow, error: settingsReadError } = await supabase
      .from("event_settings")
      .select("id")
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
          lab_capacity: body.lab_capacity,
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
