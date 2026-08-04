import "server-only";

import { requireSuperAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AuditLogFilters {
  query?: string;
  action?: string;
  entity?: string;
  status?: string;
  page?: number;
}

export async function getAuditLogs(filters: AuditLogFilters = {}) {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = 50;
  let query = admin
    .from("audit_logs")
    .select("id,user_id,action,entity,entity_id,metadata,created_at", { count: "exact" })
    .order("created_at", { ascending: false });
  if (filters.action) query = query.eq("action", filters.action);
  if (filters.entity) query = query.eq("entity", filters.entity);
  if (filters.status) query = query.contains("metadata", { status: filters.status });
  if (filters.query) query = query.or(`action.ilike.%${filters.query.replace(/[%_,()]/g, "")}%,entity.ilike.%${filters.query.replace(/[%_,()]/g, "")}%`);
  const from = (page - 1) * pageSize;
  const { data: logs, count } = await query.range(from, from + pageSize - 1);

  const actorIds = [...new Set((logs ?? []).map((log) => log.user_id).filter((id): id is string => Boolean(id)))];
  const { data: profiles } = actorIds.length
    ? await admin.from("profiles").select("id,full_name,role").in("id", actorIds)
    : { data: [] };
  const actors = new Map((profiles ?? []).map((profile) => [profile.id, { name: profile.full_name, role: profile.role }]));

  const [{ count: lastDay }, { count: failures }, { data: actionRows }, { data: entityRows }] = await Promise.all([
    admin.from("audit_logs").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 86_400_000).toISOString()),
    admin.from("audit_logs").select("id", { count: "exact", head: true }).contains("metadata", { status: "failure" }),
    admin.from("audit_logs").select("action").order("action").limit(1000),
    admin.from("audit_logs").select("entity").order("entity").limit(1000)
  ]);

  return {
    logs: (logs ?? []).map((log) => ({ ...log, actor: log.user_id ? actors.get(log.user_id) ?? null : null })),
    page,
    pageSize,
    total: count ?? 0,
    lastDay: lastDay ?? 0,
    failures: failures ?? 0,
    actions: [...new Set((actionRows ?? []).map((row) => row.action))],
    entities: [...new Set((entityRows ?? []).map((row) => row.entity))]
  };
}
