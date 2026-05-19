import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/admin-session";

export async function POST() {
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
