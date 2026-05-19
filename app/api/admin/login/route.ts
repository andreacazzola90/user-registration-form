import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE,
} from "@/lib/admin-session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email: string = (body.email ?? "").toLowerCase().trim();
    const password: string = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email e password richiesti" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("users")
      .select("email, is_active")
      .eq("email", email)
      .eq("password", password)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { message: "Credenziali non valide" },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ message: "Login effettuato" });
    response.cookies.set(SESSION_COOKIE_NAME, data.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE,
    });
    return response;
  } catch {
    return NextResponse.json({ message: "Errore interno" }, { status: 500 });
  }
}
