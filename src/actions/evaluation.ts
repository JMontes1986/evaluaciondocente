"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { commentModerationRateLimiter } from "@/lib/security/rate-limit";
import { getStudentSession } from "@/lib/security/student-session";
import { moderateEvaluationComment } from "@/lib/services/comment-moderation-service";
import { evaluationSchema } from "@/lib/validation/schemas";

export interface EvaluationState { error?: string; success?: boolean }

export async function submitEvaluationAction(_state: EvaluationState, formData: FormData): Promise<EvaluationState> {
  const session = await getStudentSession();
  if (!session) return { error: "La sesión venció. Ingresa nuevamente." };
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
    const answersIssue = parsed.error.issues.some((issue) => issue.path[0] === "answers");
    return {
      error: answersIssue
        ? "Responde todas las preguntas antes de enviar."
        : "No fue posible validar los datos de la evaluación. Actualiza la página e intenta nuevamente."
    };
  }
  if (parsed.data.feedback) {
    const rateLimit = await commentModerationRateLimiter.check(`submit:${session.student_id}`);
    if (!rateLimit.allowed) {
      return { error: `Espera ${rateLimit.retryAfterSeconds} segundos antes de intentar nuevamente.` };
    }
    const moderation = await moderateEvaluationComment(parsed.data.feedback);
    if (!moderation.allowed) {
      return {
        error: moderation.warning ?? "El comentario contiene lenguaje inapropiado. Modifícalo para continuar."
      };
    }
  }
  const admin = createAdminClient();
  const { error } = await admin.rpc("submit_teacher_evaluation", {
    p_student_id: session.student_id,
    p_teacher_id: parsed.data.teacherId,
    p_assignment_id: parsed.data.assignmentId,
    p_period_id: parsed.data.periodId,
    p_answers: parsed.data.answers.map((item) => ({ question_id: item.questionId, score: item.score })),
    p_feedback: parsed.data.feedback || null
  });
  if (error) {
    if (error.message.includes("ALREADY_SUBMITTED")) return { error: "Esta evaluación ya fue registrada." };
    return { error: "No fue posible guardar la evaluación. Intenta nuevamente." };
  }
  return { success: true };
}
