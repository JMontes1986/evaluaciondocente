import { createHmac, timingSafeEqual } from "node:crypto";

export const PASSWORD_RECOVERY_COOKIE = process.env.NODE_ENV === "production"
  ? "__Host-colgemelli_password_recovery"
  : "colgemelli_password_recovery";
export const PASSWORD_RECOVERY_TTL_SECONDS = 10 * 60;
export const PASSWORD_RECOVERY_REQUEST_MAX_AGE_SECONDS = 60 * 60;

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`password-recovery:${payload}`)
    .digest("base64url");
}

export function createPasswordRecoveryMarker(
  userId: string,
  secret: string,
  now = Date.now()
) {
  const expiresAt = Math.floor(now / 1000) + PASSWORD_RECOVERY_TTL_SECONDS;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${signature(payload, secret)}`;
}

export function verifyPasswordRecoveryMarker(
  marker: string | undefined,
  userId: string,
  secret: string,
  now = Date.now()
) {
  if (!marker) return false;
  const [markerUserId, expiresAtValue, markerSignature, ...extra] = marker.split(".");
  if (extra.length || !markerUserId || !expiresAtValue || !markerSignature) return false;
  const expiresAt = Number(expiresAtValue);
  if (markerUserId !== userId || !Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(now / 1000)) {
    return false;
  }

  const expected = signature(`${markerUserId}.${expiresAtValue}`, secret);
  const actualBuffer = Buffer.from(markerSignature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function isRecentPasswordRecovery(
  recoverySentAt: string | undefined,
  now = Date.now()
) {
  if (!recoverySentAt) return false;
  const sentAt = Date.parse(recoverySentAt);
  return Number.isFinite(sentAt)
    && sentAt <= now + 30_000
    && now - sentAt <= PASSWORD_RECOVERY_REQUEST_MAX_AGE_SECONDS * 1000;
}

export function passwordRecoveryCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: PASSWORD_RECOVERY_TTL_SECONDS,
    priority: "high" as const
  };
}
