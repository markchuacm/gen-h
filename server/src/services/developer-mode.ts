import { createHmac, timingSafeEqual } from "node:crypto";

export const DEVELOPER_MODE_TTL_SECONDS = 30 * 60;
export const DEVELOPER_MODE_COOKIE = "verae_developer_mode";

type DeveloperModeGrant = {
  userId: string;
  expiresAt: number;
};

function signature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createDeveloperModeToken(
  userId: string,
  secret: string,
  now: Date = new Date(),
): { token: string; expiresAt: Date } {
  const expiresAt = new Date(now.getTime() + DEVELOPER_MODE_TTL_SECONDS * 1000);
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt: expiresAt.getTime() })).toString("base64url");
  return { token: `${payload}.${signature(payload, secret)}`, expiresAt };
}

export function verifyDeveloperModeToken(
  token: string | undefined,
  expectedUserId: string,
  secret: string,
  now: Date = new Date(),
): DeveloperModeGrant | null {
  if (!token) return null;
  const [payload, suppliedSignature, extra] = token.split(".");
  if (!payload || !suppliedSignature || extra) return null;

  const expectedSignature = signature(payload, secret);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

  try {
    const grant = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as DeveloperModeGrant;
    if (grant.userId !== expectedUserId || !Number.isFinite(grant.expiresAt) || grant.expiresAt <= now.getTime()) {
      return null;
    }
    return grant;
  } catch {
    return null;
  }
}

export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const pair of header.split(";")) {
    const separator = pair.indexOf("=");
    if (separator < 0) continue;
    if (pair.slice(0, separator).trim() === name) return pair.slice(separator + 1).trim();
  }
  return undefined;
}

export function developerModeCookie(token: string, secure: boolean): string {
  return [
    `${DEVELOPER_MODE_COOKIE}=${token}`,
    "Path=/v1/admin",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${DEVELOPER_MODE_TTL_SECONDS}`,
    secure ? "Secure" : null,
  ].filter(Boolean).join("; ");
}

export function clearDeveloperModeCookie(secure: boolean): string {
  return [
    `${DEVELOPER_MODE_COOKIE}=`,
    "Path=/v1/admin",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    secure ? "Secure" : null,
  ].filter(Boolean).join("; ");
}
