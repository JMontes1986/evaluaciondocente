import { z } from "zod";
import { DEFAULT_GROQ_MODEL, GROQ_FALLBACK_MODEL } from "@/lib/ai/groq-models";

const completionSchema = z.object({
  choices: z.array(z.object({
    message: z.object({ content: z.string().nullable().optional() }),
    finish_reason: z.string().nullable().optional()
  })).min(1),
  usage: z.object({
    prompt_tokens: z.number().int().nonnegative().optional(),
    completion_tokens: z.number().int().nonnegative().optional(),
    total_tokens: z.number().int().nonnegative().optional()
  }).optional()
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
  fallbackPrompt?: string;
  maxCompletionTokens?: number;
  fetcher?: typeof fetch;
}

function requestBody(model: string, prompt: string, maxCompletionTokens: number) {
  const body: Record<string, unknown> = {
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6,
    max_completion_tokens: maxCompletionTokens,
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
  fallbackPrompt,
  maxCompletionTokens = 900,
  fetcher = fetch
}: GenerateGroqDashboardAnalysisOptions) {
  const primaryModel = model?.trim() || DEFAULT_GROQ_MODEL;
  const models = primaryModel === GROQ_FALLBACK_MODEL
    ? [primaryModel, primaryModel]
    : [primaryModel, GROQ_FALLBACK_MODEL];
  const prompts = fallbackPrompt && fallbackPrompt !== prompt
    ? [prompt, fallbackPrompt]
    : [prompt];
  let lastError: GroqDashboardError | null = null;
  let requestAttempt = 0;

  for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
    const attemptedModel = models[modelIndex];
    for (let promptIndex = 0; promptIndex < prompts.length; promptIndex += 1) {
      const attemptedPrompt = prompts[promptIndex];
      requestAttempt += 1;
      let response: Response;
      try {
        response = await fetcher("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody(attemptedModel, attemptedPrompt, maxCompletionTokens)),
          signal: AbortSignal.timeout(requestAttempt === 1 ? 35_000 : 18_000)
        });
      } catch (caught) {
        const detail = caught instanceof Error ? caught.message : "Network error";
        lastError = new GroqDashboardError(
          "Groq tardó demasiado en responder. Intenta nuevamente.",
          504,
          undefined,
          detail
        );
        break;
      }

      if (!response.ok) {
        const detail = await errorDetail(response);
        const error = publicError(response, detail);
        lastError = error;
        if (response.status === 413) {
          if (promptIndex + 1 < prompts.length) continue;
          const nextModel = models[modelIndex + 1];
          if (nextModel && nextModel !== attemptedModel) break;
          throw error;
        }
        if (response.status === 401 || response.status === 429) throw error;
        if (modelIndex + 1 < models.length && retryableStatuses.has(response.status)) break;
        throw error;
      }

      const completion = completionSchema.safeParse(await response.json().catch(() => null));
      const analysis = completion.success
        ? completion.data.choices[0].message.content?.trim()
        : undefined;
      const usage = completion.success ? completion.data.usage : undefined;
      if (analysis) return {
        analysis,
        model: attemptedModel,
        compacted: promptIndex > 0,
        usage: usage ? {
          promptTokens: usage.prompt_tokens ?? null,
          completionTokens: usage.completion_tokens ?? null,
          totalTokens: usage.total_tokens ?? null
        } : null
      };

      const finishReason = completion.success
        ? completion.data.choices[0].finish_reason ?? "unknown"
        : "invalid_completion";
      lastError = new GroqDashboardError(
        "Groq terminó la solicitud sin devolver un análisis. Intenta nuevamente.",
        502,
        response.status,
        finishReason
      );
      break;
    }
  }

  throw lastError ?? new GroqDashboardError("Groq no pudo generar el análisis.", 502);
}
