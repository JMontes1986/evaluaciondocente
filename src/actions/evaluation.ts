"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStudentSession } from "@/lib/security/student-session";
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
    feedback: formData.get("feedback"),
    answers
  });
  if (!parsed.success) return { error: "Responde todas las preguntas antes de enviar." };
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
