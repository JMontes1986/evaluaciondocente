import { NextRequest } from "next/server";
import { requireModule } from "@/lib/auth/permissions";
import { generateTeacherEvaluationWord } from "@/lib/documents/teacher-evaluation-word";
import { getTeacherResults } from "@/lib/services/teacher-results-service";
import { createAdminClient } from "@/lib/supabase/admin";

function downloadHeaders(filename: string) {
  const asciiName = filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_");
  return {
    "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(filename)}`
  };
}

export async function GET(request: NextRequest) {
  const teacherId = request.nextUrl.searchParams.get("teacher");
  const periodId = request.nextUrl.searchParams.get("period");
  if (!teacherId || !periodId) {
    return new Response("Docente y evaluación semestral requeridos", { status: 400 });
  }

  const user = await requireModule("resultados_docentes");
  const data = await getTeacherResults({ teacherId, periodId });
  if (!data.teacher || !data.period) {
    return new Response("Docente o evaluación semestral no encontrados", { status: 404 });
  }
  if (data.error) {
    return new Response("No fue posible consultar los resultados del docente", { status: 500 });
  }
  if (!data.report?.available) {
    return new Response(
      `El informe requiere al menos ${data.minResponses} evaluaciones para proteger la privacidad de los estudiantes.`,
      { status: 409 }
    );
  }

  const word = await generateTeacherEvaluationWord({
    teacherName: data.teacher.full_name,
    periodName: data.period.name,
    generatedAt: new Date(),
    responseCount: data.report.responseCount,
    questions: data.report.questions,
    comments: data.report.comments
  });

  await createAdminClient().from("audit_logs").insert({
    user_id: user.id,
    action: "EXPORT",
    entity: "teacher_evaluation",
    entity_id: data.teacher.id,
    metadata: { format: "docx", period_id: periodId, teacher_id: teacherId }
  });

  const filename = `evaluacion-${data.teacher.full_name}-${data.period.name}.docx`;
  return new Response(word as BodyInit, { headers: downloadHeaders(filename) });
}
