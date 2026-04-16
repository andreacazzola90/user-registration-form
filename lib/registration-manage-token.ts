import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

type ManageTokenPayload = {
  registrationId: string;
  email: string;
  iat: number;
};

type VerifiedToken = {
  registrationId: string;
  email: string;
};

function getSecret() {
  const secret = process.env.REGISTRATION_MANAGE_TOKEN_SECRET?.trim();
  if (!secret) {
    throw new Error("Missing REGISTRATION_MANAGE_TOKEN_SECRET");
  }
  return secret;
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function createSignature(payloadPart: string, secret: string) {
  return createHmac("sha256", secret).update(payloadPart).digest("base64url");
}

export function createRegistrationManageToken(
  registrationId: string,
  email: string,
) {
  const payload: ManageTokenPayload = {
    registrationId,
    email: email.trim().toLowerCase(),
    iat: Date.now(),
  };

  const payloadPart = toBase64Url(JSON.stringify(payload));
  const signaturePart = createSignature(payloadPart, getSecret());

  return `${payloadPart}.${signaturePart}`;
}

export function verifyRegistrationManageToken(
  token: string,
): VerifiedToken | null {
  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) {
    return null;
  }

  const expectedSignature = createSignature(payloadPart, getSecret());

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const actualBuffer = Buffer.from(signaturePart, "utf8");

  if (expectedBuffer.length !== actualBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null;
  }

  const maxAgeDays = Number(
    process.env.REGISTRATION_MANAGE_TOKEN_MAX_AGE_DAYS ?? "30",
  );
  const maxAgeMs =
    (Number.isFinite(maxAgeDays) ? maxAgeDays : 30) * 24 * 60 * 60 * 1000;

  try {
    const payload = JSON.parse(
      fromBase64Url(payloadPart),
    ) as ManageTokenPayload;
    if (
      !payload.registrationId ||
      !payload.email ||
      typeof payload.iat !== "number"
    ) {
      return null;
    }

    if (Date.now() - payload.iat > maxAgeMs) {
      return null;
    }

    return {
      registrationId: payload.registrationId,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export function buildManageRegistrationUrls(
  registrationId: string,
  token: string,
  baseUrl?: string,
) {
  const appBaseUrl =
    baseUrl?.trim() ||
    process.env.APP_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (!appBaseUrl) {
    return null;
  }

  const normalizedBase = appBaseUrl.startsWith("http")
    ? appBaseUrl
    : `https://${appBaseUrl}`;

  const safeBase = normalizedBase.replace(/\/$/, "");
  const query = `id=${encodeURIComponent(registrationId)}&token=${encodeURIComponent(token)}`;
  const manageUrl = `${safeBase}/manage-registration?${query}`;
  const cancelUrl = `${safeBase}/manage-registration?${query}&mode=delete`;

  return { manageUrl, cancelUrl };
}
