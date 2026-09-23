import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdminEmail, unauthorizedResponse } from "@/lib/admin-session";
import { escapeCsvValue } from "@/lib/spreadsheet";
import { recordSecurityEvent } from "@/lib/security";
import { getColumnValue, resolveDisplayColumns } from "@/lib/registration-columns";
import type { FormConfig, RegistrationField, RegistrationRecord } from "@/lib/types";

export async function GET(request: Request) {
  const email = await getAdminEmail();
  if (!email) return unauthorizedResponse();

  const supabase = createSupabaseAdminClient();
  const { searchParams } = new URL(request.url);
  const formId = searchParams.get("form_id");

  let query = supabase
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (formId) {
    query = query.eq("form_id", formId);
  }

  const [{ data, error }, formResponse, fieldsResponse] = await Promise.all([
    query,
    formId
      ? supabase
          .from("forms")
          .select("slug, table_display_settings")
          .eq("id", formId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    formId
      ? supabase
          .from("registration_fields")
          .select("*")
          .eq("form_id", formId)
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: [] as RegistrationField[] }),
  ]);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as RegistrationRecord[];
  const fields = (fieldsResponse.data ?? []) as RegistrationField[];
  const formInfo = formResponse.data as Pick<
    FormConfig,
    "slug" | "table_display_settings"
  > | null;
  const displaySettings = formInfo?.table_display_settings ?? null;
  const supportsLabCapacity = formInfo?.slug === "passeggiata-monte-di-malo";

  const columns = formId
    ? resolveDisplayColumns(fields, displaySettings, {
        includeLabColumns: supportsLabCapacity,
      })
    : resolveDisplayColumns([], null);

  const csvRows = [
    columns.map((column) => column.label).map(escapeCsvValue).join(","),
    ...rows.map((row) =>
      columns
        .map((column) => getColumnValue(row, column, fields))
        .map(escapeCsvValue)
        .join(","),
    ),
  ];

  const csv = csvRows.join("\n");

  await recordSecurityEvent(request, "admin_csv_exported", email, { formId });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="iscrizioni-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}

