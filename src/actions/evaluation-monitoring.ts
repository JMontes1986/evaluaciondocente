"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireModule } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export async function releaseStudentEvaluationAction(formData: FormData) {
  const adminUser = await requireModule("seguimiento");
  const parsed = z.uuid().safeParse(formData.get("evaluationId"));
  if (!parsed.success) return;

  const admin = createAdminClient();
  const { data: evaluation } = await admin
    .from("evaluations")
    .select("id,student_id,teacher_id,evaluation_period_id")
    .eq("id", parsed.data)
    .maybeSingle();
  if (!evaluation) return;

  const { error } = await admin.from("evaluations").delete().eq("id", evaluation.id);
  if (error) return;

  await admin.from("audit_logs").insert({
    user_id: adminUser.id,
    action: "ADMIN_RELEASE_STUDENT_EVALUATION",
    entity: "evaluations",
    entity_id: evaluation.id,
    metadata: {
      student_id: evaluation.student_id,
      teacher_id: evaluation.teacher_id,
      evaluation_period_id: evaluation.evaluation_period_id
    }
  });

  revalidatePath("/administracion/seguimiento-estudiantes");
  revalidatePath("/administracion");
}
