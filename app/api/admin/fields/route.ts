import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const createSchema = z.object({
  key: z.string().min(2),
  label: z.string().min(2),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(2),
  field_type: z.enum(["text", "email", "tel", "number", "select"]),
  required: z.boolean(),
  active: z.boolean(),
  sort_order: z.number().int(),
  options: z.array(z.string()),
});

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = createSchema.parse(await request.json());
    const { data, error } = await supabase
      .from("registration_fields")
      .insert({
        key: body.key,
        label: body.label,
        field_type: "text",
        required: false,
        active: true,
        sort_order: 999,
        options: [],
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Campo creato", field: data });
  } catch {
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
    const body = updateSchema.parse(await request.json());

    const { error } = await supabase
      .from("registration_fields")
      .update({
        label: body.label,
        field_type: body.field_type,
        required: body.required,
        active: body.active,
        sort_order: body.sort_order,
        options: body.options,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Campo aggiornato" });
  } catch {
    return NextResponse.json(
      { message: "Payload non valido" },
      { status: 400 },
    );
  }
}
