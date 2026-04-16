import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_REGISTRATION_FIELDS } from "@/lib/default-fields";

const createFormSchema = z.object({
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message:
        "Lo slug deve contenere solo lettere minuscole, numeri e trattini",
    }),
  title: z.string().min(3),
  description: z.string().default(""),
  lab_capacity: z.number().int().positive().default(50),
});

const updateFormContentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().default(""),
  info_title: z.string().min(3),
  info_description: z.string().default(""),
  registration_title: z.string().min(3),
  registration_description: z.string().min(3),
  submit_note: z.string().min(3),
  slider_data: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        imageUrl: z.string().url(),
      }),
    )
    .default([]),
});

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await requireUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("forms")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = createFormSchema.parse(await request.json());

    // Create the form
    const { data: form, error: formError } = await supabase
      .from("forms")
      .insert({
        slug: body.slug,
        title: body.title,
        description: body.description,
        is_active: true,
      })
      .select("*")
      .single();

    if (formError) {
      if (formError.message.includes("duplicate key")) {
        return NextResponse.json(
          { message: "Esiste già un form con questo slug" },
          { status: 409 },
        );
      }
      return NextResponse.json({ message: formError.message }, { status: 400 });
    }

    // Seed default fields for the new form
    const fieldsToInsert = DEFAULT_REGISTRATION_FIELDS.map((field, index) => ({
      key: field.key,
      label: field.label,
      field_type: field.field_type,
      required: field.required,
      active: field.active,
      sort_order: field.sort_order ?? index + 1,
      options: field.options ?? [],
      form_id: form.id,
    }));

    const { error: fieldsError } = await supabase
      .from("registration_fields")
      .insert(fieldsToInsert);

    if (fieldsError) {
      return NextResponse.json(
        { message: `Form creato ma errore nei campi: ${fieldsError.message}` },
        { status: 500 },
      );
    }

    // Seed default event_settings for the new form
    const { error: settingsError } = await supabase
      .from("event_settings")
      .insert({
        form_id: form.id,
        lab_capacity: body.lab_capacity,
      });

    if (settingsError) {
      return NextResponse.json(
        {
          message: `Form creato ma errore nelle impostazioni: ${settingsError.message}`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Form creato", form }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      return NextResponse.json(
        { message: firstIssue?.message ?? "Payload non valido" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { message: "Payload non valido" },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  const { supabase, user } = await requireUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = updateFormContentSchema.parse(await request.json());

    const { error } = await supabase
      .from("forms")
      .update({
        title: body.title,
        description: body.description,
        info_title: body.info_title,
        info_description: body.info_description,
        registration_title: body.registration_title,
        registration_description: body.registration_description,
        submit_note: body.submit_note,
        slider_data: body.slider_data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Contenuti aggiornati" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      return NextResponse.json(
        { message: firstIssue?.message ?? "Payload non valido" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Payload non valido" },
      { status: 400 },
    );
  }
}
