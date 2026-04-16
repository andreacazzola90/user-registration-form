import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

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

  const workbook = new ExcelJS.Workbook();
  const detailSheet = workbook.addWorksheet("Iscritti");
  const summarySheet = workbook.addWorksheet("Riepilogo");

  detailSheet.columns = [
    { header: "Data", key: "created_at", width: 24 },
    { header: "Nome", key: "first_name", width: 18 },
    { header: "Cognome", key: "last_name", width: 18 },
    { header: "Telefono", key: "phone", width: 18 },
    { header: "Email", key: "email", width: 28 },
    { header: "Paese", key: "country", width: 18 },
    { header: "Bimbi <3", key: "children_under_3", width: 12 },
    { header: "Bimbi >3 lab", key: "children_over_3_labs", width: 16 },
    { header: "Adulti", key: "adults", width: 10 },
    { header: "Stato", key: "status", width: 14 },
  ];

  rows.forEach((row) => {
    detailSheet.addRow({
      ...row,
      created_at: new Date(row.created_at).toLocaleString("it-IT"),
    });
  });

  const totalUnder3 = rows.reduce((acc, row) => acc + row.children_under_3, 0);
  const totalOver3Labs = rows.reduce(
    (acc, row) => acc + row.children_over_3_labs,
    0,
  );
  const totalAdults = rows.reduce((acc, row) => acc + row.adults, 0);
  const confirmedOver3 = rows
    .filter((row) => row.status === "confirmed")
    .reduce((acc, row) => acc + row.children_over_3_labs, 0);
  const capacity = 50;

  summarySheet.addRow(["Iscrizioni totali", rows.length]);
  summarySheet.addRow(["Bambini <3", totalUnder3]);
  summarySheet.addRow(["Bambini >3 laboratori", totalOver3Labs]);
  summarySheet.addRow(["Adulti", totalAdults]);
  summarySheet.addRow([
    "Posti laboratorio occupati (confermati)",
    confirmedOver3,
  ]);
  summarySheet.addRow([
    "Posti laboratorio rimanenti",
    Math.max(capacity - confirmedOver3, 0),
  ]);

  summarySheet.columns = [{ width: 40 }, { width: 20 }];

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="iscrizioni-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
