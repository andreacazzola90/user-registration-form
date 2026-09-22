import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminSessionToken } from "@/lib/admin-session-token";

const SESSION_COOKIE_NAME = "admin_session";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionToken
    ? await verifyAdminSessionToken(sessionToken)
    : null;

  if (!session && request.nextUrl.pathname.startsWith("/admin/dashboard")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    return NextResponse.redirect(redirectUrl);
  }

  if (session && request.nextUrl.pathname === "/admin/login") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
