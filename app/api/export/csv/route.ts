import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false });

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
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(","),
    ),
  ];

  const csv = csvRows.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="iscrizioni-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
