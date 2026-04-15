import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyRegistrationManageToken } from "@/lib/registration-manage-token";
import type { RegistrationField } from "@/lib/types";

const KNOWN_KEYS = new Set([
  "first_name",
  "last_name",
  "phone",
  "email",
  "country",
  "children_under_3",
  "children_over_3_labs",
  "adults",
]);

const managePayloadSchema = z.object({
  id: z.string().uuid(),
  token: z.string().min(10),
  payload: z.record(z.string(), z.union([z.string(), z.number()])),
});

const deletePayloadSchema = z.object({
  id: z.string().uuid(),
  token: z.string().min(10),
});

function toNumber(value: string | number | undefined) {
  if (typeof value === "number") {
    return value;
  }

  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function getAuthorizedRegistration(
  id: string,
  token: string,
  supabase: ReturnType<typeof createSupabaseAdminClient>,
) {
  const tokenData = verifyRegistrationManageToken(token);
  if (!tokenData || tokenData.registrationId !== id) {
    return {
      error: NextResponse.json(
        { message: "Link non valido o scaduto" },
        { status: 401 },
      ),
    };
  }

  const { data: registration, error } = await supabase
    .from("registrations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return {
      error: NextResponse.json({ message: error.message }, { status: 500 }),
    };
  }

  if (!registration) {
    return {
      error: NextResponse.json(
        { message: "Prenotazione non trovata" },
        { status: 404 },
      ),
    };
  }

  if (String(registration.email).trim().toLowerCase() !== tokenData.email) {
    return {
      error: NextResponse.json(
        { message: "Link non valido o scaduto" },
        { status: 401 },
      ),
    };
  }

  return { registration };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") ?? "";
  const token = searchParams.get("token") ?? "";

  if (!id || !token) {
    return NextResponse.json(
      { message: "Parametri mancanti" },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseAdminClient();

    const authResult = await getAuthorizedRegistration(id, token, supabase);
    if (authResult.error) {
      return authResult.error;
    }

    const { data: fields, error: fieldsError } = await supabase
      .from("registration_fields")
      .select("*")
      .order("sort_order", { ascending: true });

    if (fieldsError) {
      return NextResponse.json(
        { message: fieldsError.message },
        { status: 500 },
      );
    }

    const row = authResult.registration;
    const mergedValues = {
      first_name: row.first_name,
      last_name: row.last_name,
      phone: row.phone,
      email: row.email,
      country: row.country,
      children_under_3: row.children_under_3,
      children_over_3_labs: row.children_over_3_labs,
      adults: row.adults,
      ...(typeof row.additional_data === "object" && row.additional_data
        ? row.additional_data
        : {}),
    };

    return NextResponse.json({
      ok: true,
      registration: {
        id: row.id,
        status: row.status,
        created_at: row.created_at,
        values: mergedValues,
      },
      fields: (fields ?? []) as RegistrationField[],
    });
  } catch {
    return NextResponse.json({ message: "Errore inatteso" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = managePayloadSchema.parse(await request.json());
    const supabase = createSupabaseAdminClient();

    const authResult = await getAuthorizedRegistration(
      body.id,
      body.token,
      supabase,
    );
    if (authResult.error) {
      return authResult.error;
    }

    const { data: fields, error: fieldsError } = await supabase
      .from("registration_fields")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (fieldsError) {
      return NextResponse.json(
        { message: fieldsError.message },
        { status: 500 },
      );
    }

    const activeFields = (fields ?? []) as RegistrationField[];

    for (const field of activeFields) {
      const value = body.payload[field.key];
      const missing =
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim().length === 0);

      if (field.required && missing) {
        return NextResponse.json(
          { message: `Il campo ${field.label} e obbligatorio` },
          { status: 400 },
        );
      }
    }

    const firstName = String(body.payload.first_name ?? "").trim();
    const lastName = String(body.payload.last_name ?? "").trim();
    const phone = String(body.payload.phone ?? "").trim();
    const email = String(body.payload.email ?? "")
      .trim()
      .toLowerCase();
    const country = String(body.payload.country ?? "").trim();
    const childrenUnder3 = toNumber(body.payload.children_under_3);
    const childrenOver3Labs = toNumber(body.payload.children_over_3_labs);
    const adults = toNumber(body.payload.adults);

    const additionalData = Object.fromEntries(
      Object.entries(body.payload).filter(([key]) => !KNOWN_KEYS.has(key)),
    );

    const { error: updateError } = await supabase
      .from("registrations")
      .update({
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
        country,
        children_under_3: childrenUnder3,
        children_over_3_labs: childrenOver3Labs,
        adults,
        additional_data: additionalData,
      })
      .eq("id", body.id);

    if (updateError) {
      return NextResponse.json(
        { message: updateError.message },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Prenotazione aggiornata con successo",
    });
  } catch {
    return NextResponse.json(
      { message: "Richiesta non valida" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = deletePayloadSchema.parse(await request.json());
    const supabase = createSupabaseAdminClient();

    const authResult = await getAuthorizedRegistration(
      body.id,
      body.token,
      supabase,
    );
    if (authResult.error) {
      return authResult.error;
    }

    const { error } = await supabase
      .from("registrations")
      .delete()
      .eq("id", body.id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Prenotazione cancellata" });
  } catch {
    return NextResponse.json(
      { message: "Richiesta non valida" },
      { status: 400 },
    );
  }
}
