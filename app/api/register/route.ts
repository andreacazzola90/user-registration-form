import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { RegistrationField } from "@/lib/types";

const payloadSchema = z.record(z.string(), z.union([z.string(), z.number()]));

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

function toNumber(value: string | number | undefined) {
  if (typeof value === "number") {
    return value;
  }

  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function sendConfirmationEmail(
  email: string,
  status: "confirmed" | "waitlist",
  fullName: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return;
  }

  const resend = new Resend(apiKey);

  if (status === "confirmed") {
    await resend.emails.send({
      from,
      to: email,
      subject: "Conferma iscrizione - Passeggiata Monte di Malo",
      html: `<p>Ciao ${fullName},</p><p>la tua iscrizione e stata confermata. Ti aspettiamo alla passeggiata.</p>`,
    });
    return;
  }

  await resend.emails.send({
    from,
    to: email,
    subject: "Iscrizione in lista d'attesa - Passeggiata Monte di Malo",
    html: `<p>Ciao ${fullName},</p><p>al momento i posti nei laboratori sono completi. Verrai inserito in lista d'attesa e ti contatteremo a breve qualora si aprisse una nuova disponibilita.</p>`,
  });
}

export async function POST(request: Request) {
  try {
    const payload = payloadSchema.parse(await request.json());
    const supabase = createSupabaseAdminClient();

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
      const value = payload[field.key];
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

    const firstName = String(payload.first_name ?? "").trim();
    const lastName = String(payload.last_name ?? "").trim();
    const phone = String(payload.phone ?? "").trim();
    const email = String(payload.email ?? "")
      .trim()
      .toLowerCase();
    const country = String(payload.country ?? "").trim();
    const childrenUnder3 = toNumber(payload.children_under_3);
    const childrenOver3Labs = toNumber(payload.children_over_3_labs);
    const adults = toNumber(payload.adults);

    const additionalData = Object.fromEntries(
      Object.entries(payload).filter(([key]) => !KNOWN_KEYS.has(key)),
    );

    const { data, error } = await supabase.rpc(
      "create_registration_with_capacity",
      {
        p_first_name: firstName,
        p_last_name: lastName,
        p_phone: phone,
        p_email: email,
        p_country: country,
        p_children_under_3: childrenUnder3,
        p_children_over_3_labs: childrenOver3Labs,
        p_adults: adults,
        p_additional_data: additionalData,
      },
    );

    if (error) {
      const uniqueViolation = error.message
        .toLowerCase()
        .includes("duplicate key");
      if (uniqueViolation) {
        return NextResponse.json(
          { message: "Esiste gia una registrazione oggi con questa email" },
          { status: 409 },
        );
      }
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    const row = Array.isArray(data) ? data[0] : data;
    const status = row?.status === "waitlist" ? "waitlist" : "confirmed";

    await sendConfirmationEmail(
      email,
      status,
      `${firstName} ${lastName}`.trim(),
    );

    return NextResponse.json({
      ok: true,
      status,
      message:
        status === "confirmed"
          ? "Iscrizione confermata. Ti abbiamo inviato una email con i dettagli."
          : "Posti laboratorio esauriti: sei in lista d'attesa e ti contatteremo a breve qualora si aprisse una nuova disponibilita.",
    });
  } catch {
    return NextResponse.json(
      { message: "Impossibile completare la registrazione" },
      { status: 500 },
    );
  }
}
