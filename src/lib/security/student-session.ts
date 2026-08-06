import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSystemSettings } from "@/lib/services/system-settings-service";

const COOKIE_NAME = process.env.NODE_ENV === "production"
  ? "__Host-colgemelli_student_session"
  : "colgemelli_student_session";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createStudentSession(studentId: string) {
  const token = randomBytes(32).toString("base64url");
  const settings = await getSystemSettings();
  const expiresAt = new Date(Date.now() + settings.studentSessionMinutes * 60 * 1000);
  const admin = createAdminClient();
  const { error } = await admin.from("student_sessions").insert({
    student_id: studentId,
    token_hash: hashToken(token),
    expires_at: expiresAt.toISOString()
  });
  if (error) throw new Error("No fue posible crear la sesión.");
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/", expires: expiresAt, priority: "high"
  });
}

export async function getStudentSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const admin = createAdminClient();
  const { data: session } = await admin.from("student_sessions")
    .select("id,student_id,expires_at,revoked_at")
    .eq("token_hash", hashToken(token)).is("revoked_at", null).gt("expires_at", new Date().toISOString()).maybeSingle();
  return session;
}

export async function destroyStudentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await createAdminClient().from("student_sessions").update({ revoked_at: new Date().toISOString() }).eq("token_hash", hashToken(token));
  }
  cookieStore.delete(COOKIE_NAME);
}
