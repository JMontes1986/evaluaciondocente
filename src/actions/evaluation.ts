"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/services/audit-service";
import { getStudentSession } from "@/lib/security/student-session";
import { evaluationSchema } from "@/lib/validation/schemas";

export interface EvaluationState { error?: string; success?: boolean }

export async function submitEvaluationAction(_state: EvaluationState, formData: FormData): Promise<EvaluationState> {
  const session = await getStudentSession();
  if (!session) {
    await writeAuditLog({ action: "STUDENT_SUBMIT_EVALUATION_FAILURE", entity: "evaluations", category: "evaluation", status: "failure", metadata: { reason: "expired_session", actor_type: "student" } });
    return { error: "La sesión venció. Ingresa nuevamente." };
  }
  let answers: unknown;
  try { answers = JSON.parse(String(formData.get("answers") ?? "[]")); }
  catch { return { error: "Las respuestas no tienen un formato válido." }; }
  const parsed = evaluationSchema.safeParse({
    teacherId: formData.get("teacherId"),
    assignmentId: formData.get("assignmentId"),
    periodId: formData.get("periodId"),
    feedback: formData.get("feedback") ?? "",
    answers
  });
  if (!parsed.success) {
    await writeAuditLog({ action: "STUDENT_SUBMIT_EVALUATION_FAILURE", entity: "evaluations", entityId: session.student_id, category: "evaluation", status: "failure", metadata: { reason: "invalid_form", actor_type: "student" } });
    const answersIssue = parsed.error.issues.some((issue) => issue.path[0] === "answers");
    return {
      error: answersIssue
        ? "Responde todas las preguntas antes de enviar."
        : "No fue posible validar los datos de la evaluación. Actualiza la página e intenta nuevamente."
    };
  }
  const admin = createAdminClient();
  const { data: evaluationId, error } = await admin.rpc("submit_teacher_evaluation", {
    p_student_id: session.student_id,
    p_teacher_id: parsed.data.teacherId,
    p_assignment_id: parsed.data.assignmentId,
    p_period_id: parsed.data.periodId,
    p_answers: parsed.data.answers.map((item) => ({ question_id: item.questionId, score: item.score })),
    p_feedback: parsed.data.feedback || null
  });
  if (error) {
    const periodClosed = error.message.includes("PERIOD_NOT_ACTIVE");
    await writeAuditLog({ action: "STUDENT_SUBMIT_EVALUATION_FAILURE", entity: "evaluations", entityId: session.student_id, category: "evaluation", status: "failure", metadata: { reason: error.message.includes("ALREADY_SUBMITTED") ? "already_submitted" : periodClosed ? "period_closed" : "database_error", teacher_id: parsed.data.teacherId, period_id: parsed.data.periodId, actor_type: "student" } });
    if (error.message.includes("ALREADY_SUBMITTED")) return { error: "Esta evaluación ya fue registrada." };
    if (periodClosed) return { error: "La evaluación docente fue cerrada por la institución y ya no admite respuestas." };
    return { error: "No fue posible guardar la evaluación. Intenta nuevamente." };
  }
  await writeAuditLog({ action: "STUDENT_SUBMIT_EVALUATION", entity: "evaluations", entityId: typeof evaluationId === "string" ? evaluationId : null, category: "evaluation", metadata: { student_id: session.student_id, teacher_id: parsed.data.teacherId, period_id: parsed.data.periodId, assignment_id: parsed.data.assignmentId, actor_type: "student", answer_count: parsed.data.answers.length, has_feedback: Boolean(parsed.data.feedback) } });
  return { success: true };
}
