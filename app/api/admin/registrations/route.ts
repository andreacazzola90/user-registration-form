import { NextResponse } from "next/server";
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
