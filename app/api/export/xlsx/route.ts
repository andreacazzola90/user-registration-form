import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdminEmail, unauthorizedResponse } from "@/lib/admin-session";
import { safeSpreadsheetValue } from "@/lib/spreadsheet";
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

  const workbook = new ExcelJS.Workbook();
  const detailSheet = workbook.addWorksheet("Iscritti");
  const summarySheet = workbook.addWorksheet("Riepilogo");

  detailSheet.columns = columns.map((column) => ({
    header: column.label,
    key: `${column.source}:${column.key}`,
    width: 20,
  }));

  rows.forEach((row) => {
    const rowValues: Record<string, string> = {};
    columns.forEach((column) => {
      rowValues[`${column.source}:${column.key}`] = safeSpreadsheetValue(
        getColumnValue(row, column, fields),
      );
    });
    detailSheet.addRow(rowValues);
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

  await recordSecurityEvent(request, "admin_xlsx_exported", email, { formId });

  return new NextResponse(buffer as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="iscrizioni-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}

