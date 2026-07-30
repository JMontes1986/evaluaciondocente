"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStudentSession, destroyStudentSession } from "@/lib/security/student-session";
import { studentLoginRateLimiter } from "@/lib/security/rate-limit";
import { studentCodeSchema } from "@/lib/validation/schemas";
import type { FormState } from "@/actions/auth";

export async function studentLoginAction(_state: FormState, formData: FormData): Promise<FormState> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimit = await studentLoginRateLimiter.check(`student-login:${forwarded}`);
  if (!rateLimit.allowed) return { error: "Demasiados intentos. Espera unos minutos antes de continuar." };
  const parsed = studentCodeSchema.safeParse(formData.get("code"));
  if (!parsed.success) return { error: "No fue posible validar el código ingresado." };
  const admin = createAdminClient();
  const { data: student } = await admin.from("students").select("id,academic_year_id").eq("code", parsed.data).eq("active", true).maybeSingle();
  if (!student) return { error: "No fue posible validar el código ingresado." };
  const now = new Date().toISOString();
  const { data: period } = await admin.from("evaluation_periods").select("id").eq("academic_year_id", student.academic_year_id).eq("active", true).lte("start_date", now).gte("end_date", now).limit(1).maybeSingle();
  if (!period) return { error: "Actualmente no existe una evaluación docente semestral habilitada." };
  await createStudentSession(student.id);
  redirect("/evaluacion");
}

export async function studentLogoutAction() {
  await destroyStudentSession();
  redirect("/estudiante");
}
