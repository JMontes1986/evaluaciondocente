import test from "node:test";
import assert from "node:assert/strict";
import {
  generateGroqDashboardAnalysis,
  GroqDashboardError
} from "../src/lib/ai/groq-dashboard";

function completion(content: string) {
  return Response.json({
    choices: [{ message: { content }, finish_reason: "stop" }]
  });
}

test("usa el modelo estable sin parámetros de razonamiento incompatibles", async () => {
  let requestBody: Record<string, unknown> | undefined;
  const fetcher = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return completion("Análisis generado");
  }) as typeof fetch;

  const result = await generateGroqDashboardAnalysis({
    apiKey: "test-key",
    prompt: "Datos agregados",
    fetcher
  });

  assert.equal(result.model, "llama-3.3-70b-versatile");
  assert.equal(result.analysis, "Análisis generado");
  assert.equal(requestBody?.reasoning_effort, undefined);
});

test("cambia al modelo estable cuando el modelo configurado no está disponible", async () => {
  const models: string[] = [];
  const fetcher = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { model: string };
    models.push(body.model);
    return models.length === 1
      ? Response.json({ error: { message: "Model unavailable" } }, { status: 404 })
      : completion("Análisis alternativo");
  }) as typeof fetch;

  const result = await generateGroqDashboardAnalysis({
    apiKey: "test-key",
    model: "qwen/modelo-no-disponible",
    prompt: "Datos agregados",
    fetcher
  });

  assert.deepEqual(models, ["qwen/modelo-no-disponible", "llama-3.3-70b-versatile"]);
  assert.equal(result.model, "llama-3.3-70b-versatile");
});

test("conserva el límite de Groq como respuesta 429", async () => {
  const fetcher = (async () => Response.json(
    { error: { message: "Rate limit reached" } },
    { status: 429, headers: { "Retry-After": "12" } }
  )) as typeof fetch;

  await assert.rejects(
    generateGroqDashboardAnalysis({ apiKey: "test-key", prompt: "Datos", fetcher }),
    (caught) => caught instanceof GroqDashboardError
      && caught.status === 429
      && caught.retryAfterSeconds === 12
  );
});

test("reintenta con el informe compacto cuando Groq responde 413", async () => {
  const prompts: string[] = [];
  const fetcher = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as {
      messages: Array<{ content: string }>;
      max_completion_tokens: number;
    };
    prompts.push(body.messages[0].content);
    assert.equal(body.max_completion_tokens, 2200);
    return prompts.length === 1
      ? Response.json({ error: { message: "Request body is too large" } }, { status: 413 })
      : completion("Informe ejecutivo compacto");
  }) as typeof fetch;

  const result = await generateGroqDashboardAnalysis({
    apiKey: "test-key",
    prompt: "Informe completo",
    fallbackPrompt: "Informe compacto",
    fetcher
  });

  assert.deepEqual(prompts, ["Informe completo", "Informe compacto"]);
  assert.equal(result.analysis, "Informe ejecutivo compacto");
  assert.equal(result.compacted, true);
});

test("informa 413 cuando incluso el resumen compacto excede el límite", async () => {
  const fetcher = (async () => Response.json(
    { error: { message: "Request body is too large" } },
    { status: 413 }
  )) as typeof fetch;

  await assert.rejects(
    generateGroqDashboardAnalysis({ apiKey: "test-key", prompt: "Datos", fetcher }),
    (caught) => caught instanceof GroqDashboardError && caught.status === 413
  );
});

test("cambia de modelo si el modelo solicitado rechaza incluso el resumen compacto", async () => {
  const requests: Array<{ model: string; prompt: string }> = [];
  const fetcher = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as {
      model: string;
      messages: Array<{ content: string }>;
    };
    requests.push({ model: body.model, prompt: body.messages[0].content });
    return body.model.startsWith("qwen/")
      ? Response.json({ error: { message: "Request body is too large" } }, { status: 413 })
      : completion("Informe generado con el modelo alternativo");
  }) as typeof fetch;

  const result = await generateGroqDashboardAnalysis({
    apiKey: "test-key",
    model: "qwen/qwen3.6-27b",
    prompt: "Informe completo",
    fallbackPrompt: "Informe compacto",
    fetcher
  });

  assert.deepEqual(requests, [
    { model: "qwen/qwen3.6-27b", prompt: "Informe completo" },
    { model: "qwen/qwen3.6-27b", prompt: "Informe compacto" },
    { model: "llama-3.3-70b-versatile", prompt: "Informe completo" }
  ]);
  assert.equal(result.model, "llama-3.3-70b-versatile");
});
