import Link from "next/link";
import { Activity, ChevronLeft, ChevronRight, Search, ShieldAlert, UserRoundCheck } from "lucide-react";
import { PageHeading } from "@/components/admin/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuditLogs } from "@/lib/services/audit-log-service";

export const metadata = { title: "Logs de auditoría" };

interface LogsPageProps {
  searchParams: Promise<{ q?: string; accion?: string; entidad?: string; estado?: string; pagina?: string }>;
}

const actionLabels: Record<string, string> = {
  ADMIN_LOGIN_SUCCESS: "Inicio de sesión", ADMIN_LOGIN_FAILURE: "Acceso rechazado", ADMIN_LOGOUT: "Cierre de sesión",
  ADMIN_PASSWORD_RESET_REQUEST: "Recuperación de contraseña solicitada",
  STUDENT_LOGIN_SUCCESS: "Acceso de estudiante", STUDENT_LOGIN_FAILURE: "Acceso estudiantil rechazado",
  STUDENT_LOGOUT: "Cierre de sesión estudiantil",
  STUDENT_SUBMIT_EVALUATION: "Evaluación enviada", STUDENT_SUBMIT_EVALUATION_FAILURE: "Evaluación rechazada",
  ADMIN_CREATE_TEACHER: "Docente creado", ADMIN_CREATE_STUDENT: "Estudiante creado",
  ADMIN_BULK_UPSERT_TEACHER_ASSIGNMENTS: "Asignaciones creadas", ADMIN_REASSIGN_TEACHER_ASSIGNMENTS: "Asignaciones reasignadas",
  ADMIN_CREATE_SUBJECT: "Asignatura creada", ADMIN_UPDATE_SUBJECT: "Asignatura actualizada",
  ADMIN_SAVE_SEMESTER_EVALUATION: "Semestre guardado", ADMIN_CREATE_QUESTION: "Pregunta creada",
  ADMIN_IMPORT_TEACHERS_CSV: "Docentes importados", ADMIN_IMPORT_STUDENTS_CSV: "Estudiantes importados",
  ADMIN_RELEASE_STUDENT_EVALUATION: "Evaluación liberada", SUPER_ADMIN_CREATE_RESTRICTED_USER: "Usuario creado",
  SUPER_ADMIN_UPDATE_RESTRICTED_USER: "Usuario actualizado", ADMIN_UPDATE_SYSTEM_SETTINGS: "Configuración actualizada",
  EXPORT: "Informe exportado", UPDATE_ACTIVATE: "Registro activado", UPDATE_DEACTIVATE: "Registro desactivado"
};

function stringValue(value: unknown) { return typeof value === "string" ? value : ""; }

function pageHref(params: Awaited<LogsPageProps["searchParams"]>, page: number) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.accion) query.set("accion", params.accion);
  if (params.entidad) query.set("entidad", params.entidad);
  if (params.estado) query.set("estado", params.estado);
  query.set("pagina", String(page));
  return `/administracion/logs?${query}`;
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const params = await searchParams;
  const requestedPage = Number.parseInt(params.pagina ?? "1", 10);
  const data = await getAuditLogs({ query: params.q?.trim(), action: params.accion, entity: params.entidad, status: params.estado, page: Number.isFinite(requestedPage) ? requestedPage : 1 });
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeading eyebrow="Solo SUPER_ADMIN" title="Logs de auditoría" description="Trazabilidad de accesos, cambios, evaluaciones, importaciones, exportaciones y eventos de seguridad." />
      <section className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-3" aria-label="Resumen de auditoría">
        <Metric icon={Activity} label="Eventos totales" value={data.total} />
        <Metric icon={UserRoundCheck} label="Eventos en 24 horas" value={data.lastDay} />
        <Metric icon={ShieldAlert} label="Eventos fallidos" value={data.failures} />
      </section>

      <form method="get" className="mt-6 grid gap-3 rounded-xl border bg-card p-5 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto_auto]">
        <div><label htmlFor="log-search" className="mb-2 block text-sm font-semibold">Buscar</label><Input id="log-search" name="q" defaultValue={params.q} placeholder="Acción o entidad" /></div>
        <Filter label="Acción" name="accion" defaultValue={params.accion} options={data.actions.map((value) => [value, actionLabels[value] ?? value])} />
        <Filter label="Entidad" name="entidad" defaultValue={params.entidad} options={data.entities.map((value) => [value, value])} />
        <Filter label="Estado" name="estado" defaultValue={params.estado} options={[["success", "Exitoso"], ["failure", "Fallido"], ["warning", "Advertencia"]]} />
        <Button type="submit" className="self-end"><Search className="size-4" />Filtrar</Button>
        <Button asChild variant="outline" className="self-end"><Link href="/administracion/logs">Limpiar</Link></Button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[1050px] text-sm">
          <thead className="border-b bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-4">Fecha</th><th className="p-4">Usuario</th><th className="p-4">Evento</th><th className="p-4">Entidad</th><th className="p-4">Estado</th><th className="p-4">Detalle</th></tr></thead>
          <tbody className="divide-y">
            {data.logs.map((log) => {
              const eventMetadata = (log.metadata ?? {}) as Record<string, unknown>;
              const status = stringValue(eventMetadata.status) || "success";
              return <tr key={log.id} className="align-top">
                <td className="whitespace-nowrap p-4 text-muted-foreground">{new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(log.created_at))}</td>
                <td className="p-4"><p className="font-medium">{log.actor?.name ?? (stringValue(eventMetadata.actor_type) === "student" ? "Estudiante" : "Sistema / anónimo")}</p>{log.actor && <p className="mt-1 text-xs text-muted-foreground">{log.actor.role}</p>}</td>
                <td className="p-4"><p className="font-medium">{actionLabels[log.action] ?? log.action}</p><code className="mt-1 block text-[11px] text-muted-foreground">{log.action}</code></td>
                <td className="p-4"><p>{log.entity}</p>{log.entity_id && <code className="mt-1 block max-w-40 truncate text-[11px] text-muted-foreground" title={log.entity_id}>{log.entity_id}</code>}</td>
                <td className="p-4"><StatusBadge status={status} /></td>
                <td className="p-4"><details><summary className="cursor-pointer font-medium text-primary">Ver datos</summary><pre className="mt-3 max-h-64 max-w-lg overflow-auto whitespace-pre-wrap rounded-lg bg-secondary p-3 text-xs">{JSON.stringify(eventMetadata, null, 2)}</pre></details></td>
              </tr>;
            })}
          </tbody>
        </table>
        {!data.logs.length && <p className="p-10 text-center text-sm text-muted-foreground">No hay eventos que coincidan con los filtros.</p>}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Página {data.page} de {totalPages} · {data.total} eventos</p>
        <div className="flex gap-2">
          {data.page > 1 ? <Button asChild variant="outline" size="sm"><Link href={pageHref(params, data.page - 1)}><ChevronLeft className="size-4" />Anterior</Link></Button> : <Button variant="outline" size="sm" disabled><ChevronLeft className="size-4" />Anterior</Button>}
          {data.page < totalPages ? <Button asChild variant="outline" size="sm"><Link href={pageHref(params, data.page + 1)}>Siguiente<ChevronRight className="size-4" /></Link></Button> : <Button variant="outline" size="sm" disabled>Siguiente<ChevronRight className="size-4" /></Button>}
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: number }) { return <article className="bg-card p-5"><Icon className="size-5 text-primary" /><p className="mt-4 font-mono text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></article>; }
function Filter({ label, name, defaultValue, options }: { label: string; name: string; defaultValue?: string; options: string[][] }) { return <div><label htmlFor={`log-${name}`} className="mb-2 block text-sm font-semibold">{label}</label><select id={`log-${name}`} name={name} defaultValue={defaultValue ?? ""} className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm"><option value="">Todos</option>{options.map(([value, optionLabel]) => <option key={value} value={value}>{optionLabel}</option>)}</select></div>; }
function StatusBadge({ status }: { status: string }) { const labels: Record<string, string> = { success: "Exitoso", failure: "Fallido", warning: "Advertencia" }; const colors: Record<string, string> = { success: "border-emerald-700/20 bg-emerald-700/10 text-emerald-800", failure: "border-red-700/20 bg-red-700/10 text-red-800", warning: "border-amber-700/20 bg-amber-700/10 text-amber-800" }; return <Badge className={colors[status]}>{labels[status] ?? status}</Badge>; }
