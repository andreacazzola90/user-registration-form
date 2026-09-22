import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/admin-session";
import { verifyAdminSessionToken } from "@/lib/admin-session-token";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { recordSecurityEvent } from "@/lib/security";

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.slice(SESSION_COOKIE_NAME.length + 1);
  const session = token ? await verifyAdminSessionToken(token) : null;

  if (session) {
    const supabase = createSupabaseAdminClient();
    const revokeAll = new URL(request.url).searchParams.get("all") === "true";
    let revokeQuery = supabase
      .from("admin_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .is("revoked_at", null);
    revokeQuery = revokeAll
      ? revokeQuery.eq("email", session.email)
      : revokeQuery.eq("id", session.sessionId);
    await revokeQuery;
    await recordSecurityEvent(
      request,
      revokeAll ? "admin_logout_all" : "admin_logout",
      session.email,
      {
      sessionId: session.sessionId,
      },
    );
  }

  const response = NextResponse.json({ message: "Logout effettuato" });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
