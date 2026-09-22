const TOKEN_VERSION = 1;

type AdminSessionPayload = {
  sessionId: string;
  email: string;
  exp: number;
  version: number;
};

function getSessionSecret() {
  const secret =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.REGISTRATION_MANAGE_TOKEN_SECRET?.trim();

  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET");
  }

  return secret;
}

function toBase64Url(value: string) {
  return btoa(unescape(encodeURIComponent(value)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  return decodeURIComponent(escape(atob(base64)));
}

async function sign(payloadPart: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadPart),
  );
  return toBase64Url(String.fromCharCode(...new Uint8Array(signature)));
}

export async function createAdminSessionToken(
  sessionId: string,
  email: string,
  maxAge: number,
) {
  const payload: AdminSessionPayload = {
    sessionId,
    email: email.trim().toLowerCase(),
    exp: Date.now() + maxAge * 1000,
    version: TOKEN_VERSION,
  };
  const payloadPart = toBase64Url(JSON.stringify(payload));
  return `${payloadPart}.${await sign(payloadPart)}`;
}

export async function verifyAdminSessionToken(token: string) {
  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return null;

  const expectedSignature = await sign(payloadPart);
  if (expectedSignature.length !== signaturePart.length) return null;

  let difference = 0;
  for (let index = 0; index < expectedSignature.length; index += 1) {
    difference |=
      expectedSignature.charCodeAt(index) ^ signaturePart.charCodeAt(index);
  }
  if (difference !== 0) return null;

  try {
    const payload = JSON.parse(fromBase64Url(payloadPart)) as AdminSessionPayload;
    if (
      payload.version !== TOKEN_VERSION ||
      !payload.sessionId ||
      !payload.email ||
      typeof payload.exp !== "number" ||
      payload.exp <= Date.now()
    ) {
      return null;
    }
    return { sessionId: payload.sessionId, email: payload.email };
  } catch {
    return null;
  }
}