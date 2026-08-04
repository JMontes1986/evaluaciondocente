"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStudentSession, destroyStudentSession, getStudentSession } from "@/lib/security/student-session";
import { writeAuditLog } from "@/lib/services/audit-service";
import {
  studentCodeLoginRateLimiter,
  studentNetworkLoginRateLimiter
} from "@/lib/security/rate-limit";
import { studentCodeSchema } from "@/lib/validation/schemas";
import type { FormState } from "@/actions/auth";

export async function studentLoginAction(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = studentCodeSchema.safeParse(formData.get("code"));
  if (!parsed.success) {
    await writeAuditLog({ action: "STUDENT_LOGIN_FAILURE", entity: "student_sessions", category: "authentication", status: "failure", metadata: { reason: "invalid_input", actor_type: "student" } });
    return { error: "No fue posible validar el código ingresado." };
  }
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const codeFingerprint = createHash("sha256").update(parsed.data).digest("hex");
  const [networkRateLimit, codeRateLimit] = await Promise.all([
    studentNetworkLoginRateLimiter.check(`student-network-login:${forwarded}`),
    studentCodeLoginRateLimiter.check(`student-code-login:${forwarded}:${codeFingerprint}`)
  ]);
  if (!networkRateLimit.allowed || !codeRateLimit.allowed) {
    await writeAuditLog({ action: "STUDENT_LOGIN_FAILURE", entity: "student_sessions", category: "security", status: "warning", metadata: { reason: "rate_limited", actor_type: "student" } });
    return { error: "Demasiados intentos para este c\u00f3digo. Espera unos minutos antes de continuar." };
  }

  const admin = createAdminClient();
  const { data: student } = await admin.from("students").select("id,academic_year_id").eq("code", parsed.data).eq("active", true).maybeSingle();
  if (!student) {
    await writeAuditLog({ action: "STUDENT_LOGIN_FAILURE", entity: "student_sessions", category: "authentication", status: "failure", metadata: { reason: "unknown_or_inactive_student", actor_type: "student" } });
    return { error: "No fue posible validar el código ingresado." };
  }
  const now = new Date().toISOString();
  const { data: period } = await admin.from("evaluation_periods").select("id").eq("academic_year_id", student.academic_year_id).eq("active", true).lte("start_date", now).gte("end_date", now).limit(1).maybeSingle();
  if (!period) {
    await writeAuditLog({ action: "STUDENT_LOGIN_FAILURE", entity: "student_sessions", entityId: student.id, category: "authentication", status: "failure", metadata: { reason: "no_active_period", actor_type: "student" } });
    return { error: "Actualmente no existe una evaluación docente semestral habilitada." };
  }
  await createStudentSession(student.id);
  await writeAuditLog({ action: "STUDENT_LOGIN_SUCCESS", entity: "student_sessions", entityId: student.id, category: "authentication", metadata: { actor_type: "student", period_id: period.id } });
  redirect("/evaluacion");
}

export async function studentLogoutAction() {
  const session = await getStudentSession();
  if (session) await writeAuditLog({ action: "STUDENT_LOGOUT", entity: "student_sessions", entityId: session.student_id, category: "authentication", metadata: { actor_type: "student" } });
  await destroyStudentSession();
  redirect("/estudiante");
}
