import { z } from "zod";
import { DEFAULT_GROQ_MODEL, GROQ_FALLBACK_MODEL } from "@/lib/ai/groq-models";

const completionSchema = z.object({
  choices: z.array(z.object({
    message: z.object({ content: z.string().nullable().optional() }),
    finish_reason: z.string().nullable().optional()
  })).min(1)
});

const retryableStatuses = new Set([400, 403, 404, 422, 498, 500, 502, 503, 504]);

export class GroqDashboardError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly upstreamStatus?: number,
    readonly upstreamDetail?: string,
    readonly retryAfterSeconds?: number
  ) {
    super(message);
    this.name = "GroqDashboardError";
  }
}

interface GenerateGroqDashboardAnalysisOptions {
  apiKey: string;
  model?: string;
  prompt: string;
  fetcher?: typeof fetch;
}

function requestBody(model: string, prompt: string) {
  const body: Record<string, unknown> = {
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6,
    max_completion_tokens: 3072,
    top_p: 0.8,
    stream: false
  };
  if (model.startsWith("qwen/")) body.reasoning_effort = "none";
  return body;
}

async function errorDetail(response: Response) {
  const text = (await response.text()).slice(0, 800);
  try {
    const parsed = JSON.parse(text) as { error?: { message?: unknown } };
    return typeof parsed.error?.message === "string" ? parsed.error.message : text;
  } catch {
    return text;
  }
}

function retryAfterSeconds(response: Response) {
  const value = Number(response.headers.get("retry-after"));
  return Number.isFinite(value) && value > 0 ? Math.ceil(value) : 60;
}

function publicError(response: Response, detail: string) {
  if (response.status === 401) {
    return new GroqDashboardError(
      "La credencial de Groq no es válida. Actualiza GROQ_API_KEY en Vercel.",
      503,
      response.status,
      detail
    );
  }
  if (response.status === 429) {
    const retryAfter = retryAfterSeconds(response);
    return new GroqDashboardError(
      `Groq alcanzó su límite temporal. Intenta nuevamente en ${retryAfter} segundos.`,
      429,
      response.status,
      detail,
      retryAfter
    );
  }
  if (response.status === 413) {
    return new GroqDashboardError(
      "Los datos enviados a Groq superan el tamaño permitido.",
      413,
      response.status,
      detail
    );
  }
  return new GroqDashboardError(
    "Groq no pudo generar el análisis en este momento. Intenta nuevamente.",
    502,
    response.status,
    detail
  );
}

export async function generateGroqDashboardAnalysis({
  apiKey,
  model,
  prompt,
  fetcher = fetch
}: GenerateGroqDashboardAnalysisOptions) {
  const primaryModel = model?.trim() || DEFAULT_GROQ_MODEL;
  const attempts = primaryModel === GROQ_FALLBACK_MODEL
    ? [primaryModel, primaryModel]
    : [primaryModel, GROQ_FALLBACK_MODEL];
  let lastError: GroqDashboardError | null = null;

  for (let index = 0; index < attempts.length; index += 1) {
    const attemptedModel = attempts[index];
    let response: Response;
    try {
      response = await fetcher("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody(attemptedModel, prompt)),
        signal: AbortSignal.timeout(index === 0 ? 35_000 : 18_000)
      });
    } catch (caught) {
      const detail = caught instanceof Error ? caught.message : "Network error";
      lastError = new GroqDashboardError(
        "Groq tardó demasiado en responder. Intenta nuevamente.",
        504,
        undefined,
        detail
      );
      if (index + 1 < attempts.length) continue;
      throw lastError;
    }

    if (!response.ok) {
      const detail = await errorDetail(response);
      const error = publicError(response, detail);
      if (response.status === 401 || response.status === 413 || response.status === 429) throw error;
      lastError = error;
      if (index + 1 < attempts.length && retryableStatuses.has(response.status)) continue;
      throw error;
    }

    const completion = completionSchema.safeParse(await response.json().catch(() => null));
    const analysis = completion.success
      ? completion.data.choices[0].message.content?.trim()
      : undefined;
    if (analysis) return { analysis, model: attemptedModel };

    const finishReason = completion.success
      ? completion.data.choices[0].finish_reason ?? "unknown"
      : "invalid_completion";
    lastError = new GroqDashboardError(
      "Groq terminó la solicitud sin devolver un análisis. Intenta nuevamente.",
      502,
      response.status,
      finishReason
    );
    if (index + 1 >= attempts.length) throw lastError;
  }

  throw lastError ?? new GroqDashboardError("Groq no pudo generar el análisis.", 502);
}
