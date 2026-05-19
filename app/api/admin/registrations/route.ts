import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdminEmail, unauthorizedResponse } from "@/lib/admin-session";

export async function GET(request: Request) {
  const email = await getAdminEmail();
  if (!email) return unauthorizedResponse();

  const supabase = createSupabaseAdminClient();  const { searchParams } = new URL(request.url);
  const formId = searchParams.get("form_id");

  if (!formId) {
    return NextResponse.json({ message: "form_id richiesto" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .eq("form_id", formId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
