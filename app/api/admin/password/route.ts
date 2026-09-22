import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminEmail, SESSION_COOKIE_NAME, unauthorizedResponse } from "@/lib/admin-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { consumeRateLimit, recordSecurityEvent } from "@/lib/security";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(14, "La nuova password deve contenere almeno 14 caratteri")
      .max(128),
  })
  .refine(
    ({ newPassword }) =>
      /[a-z]/.test(newPassword) &&
      /[A-Z]/.test(newPassword) &&
      /[0-9]/.test(newPassword) &&
      /[^A-Za-z0-9]/.test(newPassword),
    { message: "Usa maiuscole, minuscole, numeri e simboli" },
  );

export async function PUT(request: Request) {
  const email = await getAdminEmail();
  if (!email) return unauthorizedResponse();

  try {
    const allowed = await consumeRateLimit(
      request,
      "admin-password-change",
      email,
      5,
      60 * 60,
    );
    if (!allowed) {
      return NextResponse.json(
        { message: "Troppi tentativi. Riprova più tardi." },
        { status: 429, headers: { "Retry-After": "3600" } },
      );
    }

    const body = passwordSchema.parse(await request.json());
    const supabase = createSupabaseAdminClient();
    const { data: passwordValid } = await supabase.rpc(
      "verify_user_password",
      { p_email: email, p_password: body.currentPassword },
    );
    if (passwordValid !== true) {
      await recordSecurityEvent(request, "admin_password_change_failed", email);
      return NextResponse.json(
        { message: "Password attuale non valida" },
        { status: 401 },
      );
    }

    const { data: updated, error } = await supabase.rpc(
      "update_user_password",
      { p_email: email, p_new_password: body.newPassword },
    );
    if (error || updated !== true) {
      return NextResponse.json(
        { message: "Impossibile aggiornare la password" },
        { status: 400 },
      );
    }

    await supabase
      .from("admin_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("email", email)
      .is("revoked_at", null);
    await recordSecurityEvent(request, "admin_password_changed", email);

    const response = NextResponse.json({
      message: "Password aggiornata. Accedi nuovamente.",
    });
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? "Password non valida" },
        { status: 400 },
      );
    }
    return NextResponse.json({ message: "Errore interno" }, { status: 500 });
  }
}