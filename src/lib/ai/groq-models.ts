export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
export const GROQ_FALLBACK_MODEL = "llama-3.3-70b-versatile";

export function groqModelLabel(model: string) {
  const labels: Record<string, string> = {
    "llama-3.3-70b-versatile": "Llama 3.3 70B",
    "qwen/qwen3.6-27b": "Qwen 3.6 27B",
    "qwen/qwen3-32b": "Qwen 3 32B",
    "openai/gpt-oss-20b": "GPT-OSS 20B",
    "openai/gpt-oss-120b": "GPT-OSS 120B"
  };
  return labels[model] ?? model;
}
