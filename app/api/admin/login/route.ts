import { NextResponse } from "next/server";
import { randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE,
} from "@/lib/admin-session";
import { createAdminSessionToken } from "@/lib/admin-session-token";
import {
  consumeRateLimit,
  getClientIp,
  hashSecurityValue,
  recordSecurityEvent,
} from "@/lib/security";
import { sendAdminLoginCodeEmail } from "@/lib/mail/smtp";

const MFA_MAX_ATTEMPTS = 5;
const MFA_EXPIRES_IN_MS = 10 * 60 * 1000;
const credentialSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});
const mfaSchema = z.object({
  challengeId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
});

function codesMatch(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

async function createSession(
  request: Request,
  email: string,
  supabase: ReturnType<typeof createSupabaseAdminClient>,
) {
  const expiresAt = new Date(
    Date.now() + SESSION_COOKIE_MAX_AGE * 1000,
  ).toISOString();
  const { data: session, error: sessionError } = await supabase
    .from("admin_sessions")
    .insert({
      email,
      expires_at: expiresAt,
      ip_hash: hashSecurityValue(getClientIp(request)),
      user_agent: request.headers.get("user-agent")?.slice(0, 500) || null,
    })
    .select("id")
    .single();

  if (sessionError || !session) throw sessionError ?? new Error("No session");

  const response = NextResponse.json({ message: "Login effettuato" });
  const sessionToken = await createAdminSessionToken(
    session.id,
    email,
    SESSION_COOKIE_MAX_AGE,
  );
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
  await recordSecurityEvent(request, "admin_login_succeeded", email, {
    sessionId: session.id,
  });
  return response;
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 8 * 1024) {
      return NextResponse.json(
        { message: "Richiesta troppo grande" },
        { status: 413 },
      );
    }

    const rawBody: unknown = await request.json();
    const isMfaRequest =
      typeof rawBody === "object" &&
      rawBody !== null &&
      "challengeId" in rawBody;
    const credentials = isMfaRequest
      ? null
      : credentialSchema.parse(rawBody);
    const mfa = isMfaRequest ? mfaSchema.parse(rawBody) : null;
    const email = credentials?.email.toLowerCase().trim() ?? "";
    const password = credentials?.password ?? "";
    const challengeId = mfa?.challengeId ?? "";
    const code = mfa?.code ?? "";

    const supabase = createSupabaseAdminClient();

    if (challengeId && code) {
      const allowed = await consumeRateLimit(
        request,
        "admin-mfa",
        challengeId,
        MFA_MAX_ATTEMPTS,
        10 * 60,
      );
      if (!allowed) {
        return NextResponse.json(
          { message: "Troppi tentativi. Richiedi un nuovo codice." },
          { status: 429, headers: { "Retry-After": "600" } },
        );
      }

      const { data: challenge } = await supabase
        .from("admin_login_challenges")
        .select("id, email, code_hash, expires_at, attempts")
        .eq("id", challengeId)
        .is("consumed_at", null)
        .maybeSingle();
      const submittedHash = hashSecurityValue(
        `admin-mfa:${challengeId}:${code}`,
      );
      const valid =
        challenge &&
        challenge.attempts < MFA_MAX_ATTEMPTS &&
        new Date(challenge.expires_at).getTime() > Date.now() &&
        codesMatch(submittedHash, challenge.code_hash);

      if (!valid) {
        if (challenge) {
          await supabase
            .from("admin_login_challenges")
            .update({ attempts: challenge.attempts + 1 })
            .eq("id", challenge.id);
        }
        await recordSecurityEvent(request, "admin_mfa_failed", challenge?.email);
        return NextResponse.json(
          { message: "Codice non valido o scaduto" },
          { status: 401 },
        );
      }

      await supabase
        .from("admin_login_challenges")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", challenge.id);
      return createSession(request, challenge.email, supabase);
    }

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email e password richiesti" },
        { status: 400 },
      );
    }

    const allowed = await consumeRateLimit(
      request,
      "admin-login",
      email,
      5,
      15 * 60,
    );
    if (!allowed) {
      await recordSecurityEvent(request, "admin_login_rate_limited", email);
      return NextResponse.json(
        { message: "Troppi tentativi. Riprova tra 15 minuti." },
        { status: 429, headers: { "Retry-After": "900" } },
      );
    }

    const { data, error } = await supabase.rpc("verify_user_password", {
      p_email: email,
      p_password: password,
    });

    if (error || data !== true) {
      await recordSecurityEvent(request, "admin_login_failed", email);
      return NextResponse.json(
        { message: "Credenziali non valide" },
        { status: 401 },
      );
    }

    if (process.env.ADMIN_MFA_ENABLED !== "false") {
      const mfaCode = String(randomInt(100_000, 1_000_000));
      const challengeId = randomUUID();
      const { error: challengeError } = await supabase
        .from("admin_login_challenges")
        .insert({
          id: challengeId,
          email,
          code_hash: hashSecurityValue(
            `admin-mfa:${challengeId}:${mfaCode}`,
          ),
          expires_at: new Date(Date.now() + MFA_EXPIRES_IN_MS).toISOString(),
        });
      if (challengeError) throw challengeError;

      const sent = await sendAdminLoginCodeEmail(email, mfaCode);
      if (!sent) {
        await supabase
          .from("admin_login_challenges")
          .delete()
          .eq("id", challengeId);
        throw new Error("SMTP unavailable for admin MFA");
      }

      await recordSecurityEvent(request, "admin_mfa_requested", email);
      return NextResponse.json({
        message: "Codice di verifica inviato via email",
        requiresMfa: true,
        challengeId,
      });
    }

    return createSession(request, email, supabase);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Dati di accesso non validi" },
        { status: 400 },
      );
    }
    console.error("Unexpected admin login error", error);
    return NextResponse.json({ message: "Errore interno" }, { status: 500 });
  }
}
