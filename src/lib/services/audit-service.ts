import "server-only";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

type AuditStatus = "success" | "failure" | "warning";
type AuditCategory = "authentication" | "data_change" | "evaluation" | "import" | "export" | "security" | "system";

interface AuditEvent {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  category: AuditCategory;
  status?: AuditStatus;
  metadata?: Record<string, unknown>;
}

const sensitiveKeys = /password|contrase|token|secret|authorization|cookie|student_code|codigo_estudiante|answers|respuestas/i;

function sanitize(value: unknown, key = ""): unknown {
  if (sensitiveKeys.test(key)) return "[REDACTADO]";
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitize(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => [childKey, sanitize(childValue, childKey)]));
  }
  if (typeof value === "string") return value.slice(0, 1000);
  return value;
}

export async function writeAuditLog(event: AuditEvent) {
  let requestContext: Record<string, unknown> = {};
  try {
    const requestHeaders = await headers();
    requestContext = {
      ip: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      user_agent: requestHeaders.get("user-agent")?.slice(0, 500) ?? null
    };
  } catch {
    // Algunos procesos internos no tienen contexto HTTP.
  }

  const metadata = sanitize({
    category: event.category,
    status: event.status ?? "success",
    ...requestContext,
    ...(event.metadata ?? {})
  }) as Record<string, unknown>;

  const { error } = await createAdminClient().from("audit_logs").insert({
    user_id: event.actorId ?? null,
    action: event.action,
    entity: event.entity,
    entity_id: event.entityId ?? null,
    metadata
  });

  // La auditoría nunca debe interrumpir la operación principal.
  if (error) console.error("AUDIT_LOG_WRITE_FAILED", error.message);
}
