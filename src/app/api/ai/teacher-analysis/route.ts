import { z } from "zod";
import { buildTeacherAnalysisPrompt } from "@/lib/ai/teacher-analysis-prompt";
import { generateGroqDashboardAnalysis, GroqDashboardError } from "@/lib/ai/groq-dashboard";
import { canUseExternalAiAnalysis } from "@/lib/auth/dashboard-scope";
import { requireModule } from "@/lib/auth/permissions";
import { adminAiRateLimiter } from "@/lib/security/rate-limit";
import { getTeacherResults } from "@/lib/services/teacher-results-service";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

const requestSchema = z.object({
  periodId: z.uuid(),
  teacherId: z.uuid()
});

export async function POST(request: Request) {
  const adminUser = await requireModule("resultados_docentes");
  if (!canUseExternalAiAnalysis(adminUser.role)) {
    return Response.json(
      { error: "El análisis asistido está disponible únicamente para roles directivos." },
      { status: 403 }
    );
  }

  const rateLimit = await adminAiRateLimiter.check(`teacher-ai:${adminUser.id}`);
  if (!rateLimit.allowed) {
    return Response.json(
      { error: `Espera ${rateLimit.retryAfterSeconds} segundos antes de generar otro análisis.` },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "La integración con Groq no está configurada." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "El docente y la evaluación semestral no son válidos." }, { status: 400 });
  }

  const data = await getTeacherResults(parsed.data);
  if (!data.teacher || !data.period) {
    return Response.json({ error: "No se encontró el docente o la evaluación semestral." }, { status: 404 });
  }
  if (data.error) {
    return Response.json({ error: "No fue posible consultar los resultados del docente." }, { status: 500 });
  }
  if (!data.report?.available || !data.report.questions.length) {
    return Response.json(
      { error: `Se requieren al menos ${data.minResponses} evaluaciones para generar un análisis.` },
      { status: 422 }
    );
  }

  const prompt = buildTeacherAnalysisPrompt({
    periodName: data.period.name,
    privacyThreshold: data.minResponses,
    responseCount: data.report.responseCount,
    average: data.report.average,
    commentCount: data.report.comments.length,
    questions: data.report.questions
  });

  let result: Awaited<ReturnType<typeof generateGroqDashboardAnalysis>>;
  try {
    result = await generateGroqDashboardAnalysis({
      apiKey,
      model: process.env.GROQ_MODEL,
      prompt,
      maxCompletionTokens: 5200
    });
  } catch (caught) {
    if (caught instanceof GroqDashboardError) {
      console.error("Groq teacher analysis failed", {
        upstreamStatus: caught.upstreamStatus,
        detail: caught.upstreamDetail?.slice(0, 500)
      });
      const headers = caught.retryAfterSeconds
        ? { "Retry-After": String(caught.retryAfterSeconds) }
        : undefined;
      return Response.json({ error: caught.message }, { status: caught.status, headers });
    }
    console.error("Unexpected Groq teacher analysis failure", caught);
    return Response.json({ error: "No fue posible comunicarse con Groq. Intenta nuevamente." }, { status: 502 });
  }

  await createAdminClient().from("audit_logs").insert({
    user_id: adminUser.id,
    action: "ADMIN_GENERATE_GROQ_TEACHER_ANALYSIS",
    entity: "teacher_evaluation",
    entity_id: data.teacher.id,
    metadata: {
      model: result.model,
      period_id: data.period.id,
      evaluations: data.report.responseCount,
      prompt_characters: prompt.length,
      comments_shared: false
    }
  });

  return Response.json({ analysis: result.analysis, model: result.model }, {
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
