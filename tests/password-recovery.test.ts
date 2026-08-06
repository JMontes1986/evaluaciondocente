import assert from "node:assert/strict";
import test from "node:test";
import {
  createPasswordRecoveryMarker,
  isRecentPasswordRecovery,
  PASSWORD_RECOVERY_REQUEST_MAX_AGE_SECONDS,
  PASSWORD_RECOVERY_TTL_SECONDS,
  verifyPasswordRecoveryMarker
} from "../src/lib/security/password-recovery";

const userId = "8dfec899-c886-48ee-af46-f419dde7ec6d";
const otherUserId = "bd7e0c3c-f975-460d-8907-5a9ac3c33d41";
const secret = "test-secret-with-at-least-thirty-two-characters";
const now = Date.parse("2026-08-06T15:00:00.000Z");

test("acepta un marcador de recuperación vigente para el mismo usuario", () => {
  const marker = createPasswordRecoveryMarker(userId, secret, now);
  assert.equal(verifyPasswordRecoveryMarker(marker, userId, secret, now), true);
});

test("rechaza marcadores manipulados, ajenos o expirados", () => {
  const marker = createPasswordRecoveryMarker(userId, secret, now);
  assert.equal(verifyPasswordRecoveryMarker(`${marker}x`, userId, secret, now), false);
  assert.equal(verifyPasswordRecoveryMarker(marker, otherUserId, secret, now), false);
  assert.equal(
    verifyPasswordRecoveryMarker(marker, userId, secret, now + (PASSWORD_RECOVERY_TTL_SECONDS + 1) * 1000),
    false
  );
});

test("solo reconoce solicitudes de recuperación recientes", () => {
  assert.equal(isRecentPasswordRecovery(new Date(now - 60_000).toISOString(), now), true);
  assert.equal(isRecentPasswordRecovery(new Date(now - (PASSWORD_RECOVERY_REQUEST_MAX_AGE_SECONDS + 1) * 1000).toISOString(), now), false);
  assert.equal(isRecentPasswordRecovery(undefined, now), false);
});
