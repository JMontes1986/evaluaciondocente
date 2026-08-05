import { z } from "zod";
import { requireAdmin } from "@/lib/auth/permissions";
import { buildDashboardAnalysisPrompts } from "@/lib/ai/dashboard-analysis-prompt";
import { generateGroqDashboardAnalysis, GroqDashboardError } from "@/lib/ai/groq-dashboard";
import { adminAiRateLimiter } from "@/lib/security/rate-limit";
import { getDashboardData } from "@/lib/services/analytics-service";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

const requestSchema = z.object({
  periodId: z.uuid().optional(),
  teacherId: z.uuid().optional(),
  gradeId: z.uuid().optional()
});

export async function POST(request: Request) {
  const adminUser = await requireAdmin();
  const rateLimit = await adminAiRateLimiter.check(`dashboard-ai:${adminUser.id}`);
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Los filtros no son válidos." }, { status: 400 });

  const data = await getDashboardData(parsed.data);
  if (!data.period || data.metrics.evaluations < data.minResponses || !data.questionAverages.length) {
    return Response.json(
      { error: `Se requieren al menos ${data.minResponses} evaluaciones para generar un análisis.` },
      { status: 422 }
    );
  }

  const requestedModel = process.env.GROQ_MODEL;
  const { prompt, fallbackPrompt } = buildDashboardAnalysisPrompts({
    periodName: data.period.name,
    privacyThreshold: data.minResponses,
    metrics: data.metrics,
    teachers: data.teacherAverages,
    grades: data.gradeAverages,
    questions: data.questionAverages,
    teacherGradePerformance: data.scatter
  });

  let result: Awaited<ReturnType<typeof generateGroqDashboardAnalysis>>;
  try {
    result = await generateGroqDashboardAnalysis({
      apiKey,
      model: requestedModel,
      prompt,
      fallbackPrompt
    });
  } catch (caught) {
    if (caught instanceof GroqDashboardError) {
      console.error("Groq dashboard analysis failed", {
        upstreamStatus: caught.upstreamStatus,
        detail: caught.upstreamDetail?.slice(0, 500)
      });
      const headers = caught.retryAfterSeconds
        ? { "Retry-After": String(caught.retryAfterSeconds) }
        : undefined;
      return Response.json({ error: caught.message }, { status: caught.status, headers });
    }
    console.error("Unexpected Groq dashboard analysis failure", caught);
    return Response.json({ error: "No fue posible comunicarse con Groq. Intenta nuevamente." }, { status: 502 });
  }

  await createAdminClient().from("audit_logs").insert({
    user_id: adminUser.id,
    action: "ADMIN_GENERATE_GROQ_DASHBOARD_ANALYSIS",
    entity: "evaluation_periods",
    entity_id: data.period.id,
    metadata: {
      model: result.model,
      compacted_input: result.compacted,
      requested_model: requestedModel ?? null,
      prompt_characters: prompt.length,
      compact_prompt_characters: fallbackPrompt.length,
      teacher_filter: parsed.data.teacherId ?? null,
      grade_filter: parsed.data.gradeId ?? null,
      evaluations: data.metrics.evaluations
    }
  });

  return Response.json({ analysis: result.analysis, model: result.model }, {
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
