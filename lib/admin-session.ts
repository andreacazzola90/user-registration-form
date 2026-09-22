import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAdminSessionToken } from "@/lib/admin-session-token";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const SESSION_COOKIE_NAME = "admin_session";
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

export async function getAdminEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminSessionToken(token) : null;
  if (!session) return null;

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("admin_sessions")
    .select("id")
    .eq("id", session.sessionId)
    .eq("email", session.email)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  return data ? session.email : null;
}

export function unauthorizedResponse() {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}
