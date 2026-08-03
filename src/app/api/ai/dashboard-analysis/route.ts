import { encode } from "@toon-format/toon";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/permissions";
import { adminAiRateLimiter } from "@/lib/security/rate-limit";
import { getDashboardData } from "@/lib/services/analytics-service";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

const requestSchema = z.object({
  periodId: z.uuid().optional(),
  teacherId: z.uuid().optional(),
  gradeId: z.uuid().optional()
});

const completionSchema = z.object({
  choices: z.array(z.object({
    message: z.object({ content: z.string().nullable().optional() }),
    finish_reason: z.string().nullable().optional()
  })).min(1)
});

export async function POST(request: Request) {
  const adminUser = await requireAdmin();
  const rateLimit = await adminAiRateLimiter.check(`dashboard-ai:${adminUser.id}`);
  if (!rateLimit.allowed) {
    return Response.json(
      { error: `Espera ${rateLimit.retryAfterSeconds} segundos antes de generar otro análisis.` },
      { status: 429 }
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

  const model = process.env.GROQ_MODEL ?? "qwen/qwen3.6-27b";
  const analyticalData = {
    evaluation: data.period.name,
    privacyThreshold: data.minResponses,
    metrics: data.metrics,
    teachers: data.teacherAverages,
    grades: data.gradeAverages,
    questions: data.questionAverages.map((question) => ({
      label: question.label,
      criterion: question.question,
      average: question.average,
      responses: question.responses,
      distribution: {
        never: question.never,
        sometimes: question.sometimes,
        almostAlways: question.almostAlways,
        always: question.always
      }
    })),
    teacherGradePerformance: data.scatter
  };
  const analyticalDataToon = encode(analyticalData, { delimiter: "\t" });

  const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: [
            "Eres un analista educativo experto en evaluación docente y mejora institucional.",
            "Responde en español claro, profesional y accionable.",
            "Analiza únicamente los datos agregados proporcionados; no inventes datos ni intentes inferir identidades de estudiantes.",
            "Distingue correlaciones de causas y menciona cuando una conclusión requiera validación cualitativa.",
            "Estructura el informe con: Resumen ejecutivo, fortalezas, alertas prioritarias, análisis por docente y grado, preguntas críticas, y plan de acción a 30/60/90 días.",
            "Incluye cifras concretas y prioriza máximo cinco decisiones."
          ].join(" ")
        },
        {
          role: "user",
          content: [
            "Genera un an\u00e1lisis para toma de decisiones con estos datos en formato TOON:",
            "```toon",
            analyticalDataToon,
            "```"
          ].join("\n")
        }
      ],
      temperature: 0.6,
      max_completion_tokens: 4096,
      top_p: 0.8,
      reasoning_effort: "none",
      stream: false
    }),
    signal: AbortSignal.timeout(55_000)
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text();
    console.error("Groq dashboard analysis failed", upstream.status, detail.slice(0, 500));
    return Response.json({ error: "Groq no pudo generar el análisis. Intenta nuevamente." }, { status: 502 });
  }

  const completion = completionSchema.safeParse(await upstream.json());
  if (!completion.success) {
    console.error("Groq dashboard analysis returned an invalid completion");
    return Response.json({ error: "Groq devolvi\u00f3 una respuesta inv\u00e1lida. Intenta nuevamente." }, { status: 502 });
  }

  const analysis = completion.data.choices[0].message.content?.trim();
  if (!analysis) {
    console.error(
      "Groq dashboard analysis returned no content",
      completion.data.choices[0].finish_reason ?? "unknown"
    );
    return Response.json({ error: "Groq no devolvi\u00f3 contenido. Intenta nuevamente." }, { status: 502 });
  }

  await createAdminClient().from("audit_logs").insert({
    user_id: adminUser.id,
    action: "ADMIN_GENERATE_GROQ_DASHBOARD_ANALYSIS",
    entity: "evaluation_periods",
    entity_id: data.period.id,
    metadata: {
      model,
      teacher_filter: parsed.data.teacherId ?? null,
      grade_filter: parsed.data.gradeId ?? null,
      evaluations: data.metrics.evaluations
    }
  });

  return Response.json({ analysis }, {
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
