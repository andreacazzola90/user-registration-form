import "server-only";

import { createHmac } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function getSecuritySecret() {
  const secret =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.REGISTRATION_MANAGE_TOKEN_SECRET?.trim();
  if (!secret) throw new Error("Missing ADMIN_SESSION_SECRET");
  return secret;
}

export function getClientIp(request: Request) {
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export function hashSecurityValue(value: string) {
  return createHmac("sha256", getSecuritySecret())
    .update(value)
    .digest("hex");
}

export async function consumeRateLimit(
  request: Request,
  scope: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
) {
  const keyHash = hashSecurityValue(
    `${scope}:${getClientIp(request)}:${identifier.toLowerCase()}`,
  );
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_key_hash: keyHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  return data === true;
}

export async function recordSecurityEvent(
  request: Request,
  eventType: string,
  actorEmail?: string,
  metadata: Record<string, unknown> = {},
) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("security_events").insert({
    event_type: eventType,
    actor_email: actorEmail?.trim().toLowerCase() || null,
    ip_hash: hashSecurityValue(getClientIp(request)),
    user_agent: request.headers.get("user-agent")?.slice(0, 500) || null,
    metadata,
  });
  if (error) console.error("Failed to record security event", error.message);
}