import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdminEmail, unauthorizedResponse } from "@/lib/admin-session";
import { escapeCsvValue } from "@/lib/spreadsheet";
import { recordSecurityEvent } from "@/lib/security";

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

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const rows = data ?? [];

  const header = [
    "created_at",
    "first_name",
    "last_name",
    "phone",
    "email",
    "country",
    "children_under_3",
    "children_over_3_labs",
    "adults",
    "status",
  ];

  const csvRows = [
    header.join(","),
    ...rows.map((row) =>
      [
        row.created_at,
        row.first_name,
        row.last_name,
        row.phone,
        row.email,
        row.country,
        row.children_under_3,
        row.children_over_3_labs,
        row.adults,
        row.status,
      ]
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
