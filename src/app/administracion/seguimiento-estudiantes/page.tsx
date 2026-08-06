import Link from "next/link";
import { CheckCircle2, ClipboardList, Clock3, RotateCcw, Search, UserRoundCheck } from "lucide-react";
import { PageHeading } from "@/components/admin/page-heading";
import { ReleaseEvaluationButton } from "@/components/admin/release-evaluation-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getEvaluationMonitoring } from "@/lib/services/evaluation-monitoring-service";
import { requireModule } from "@/lib/auth/permissions";

interface StudentMonitoringPageProps {
  searchParams: Promise<{
    evaluacion?: string;
    grado?: string;
    buscar?: string;
    estudiante?: string;
  }>;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function StudentMonitoringPage({ searchParams }: StudentMonitoringPageProps) {
  await requireModule("seguimiento");
  const params = await searchParams;
  const periodId = uuidPattern.test(params.evaluacion ?? "") ? params.evaluacion : undefined;
  const gradeId = uuidPattern.test(params.grado ?? "") ? params.grado : undefined;
  const studentId = uuidPattern.test(params.estudiante ?? "") ? params.estudiante : undefined;
  const search = params.buscar?.trim().slice(0, 80) ?? "";
  const data = await getEvaluationMonitoring({ periodId, gradeId, studentId, search });
  const totalCompleted = data.students.reduce((sum, student) => sum + student.completed, 0);
  const totalExpected = data.students.reduce((sum, student) => sum + student.expected, 0);
  const fullyCompleted = data.students.filter(
    (student) => student.expected > 0 && student.completed === student.expected
  ).length;

  const studentHref = (selectedId?: string) => {
    const query = new URLSearchParams();
    if (data.period?.id) query.set("evaluacion", data.period.id);
    if (gradeId) query.set("grado", gradeId);
    if (search) query.set("buscar", search);
    if (selectedId) query.set("estudiante", selectedId);
    return `/administracion/seguimiento-estudiantes?${query.toString()}`;
  };

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeading
        eyebrow="Control operativo"
        title="Seguimiento de encuestas por estudiante"
        description="Consulta qué evaluaciones realizó cada estudiante y libera una encuesta cuando deba responderla nuevamente."
      />

      <div className="mb-5 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-950">
        Esta pantalla muestra únicamente el estado de entrega. Las respuestas y calificaciones del estudiante no se exponen.
      </div>

      <form method="get" className="mb-5 grid gap-3 rounded-xl border bg-card p-5 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1.4fr_auto_auto]">
        <div>
          <label htmlFor="monitoring-period" className="mb-2 block text-sm font-semibold">Evaluación semestral</label>
          <select
            id="monitoring-period"
            name="evaluacion"
            defaultValue={data.period?.id ?? ""}
            className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm"
          >
            {data.periods.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="monitoring-grade" className="mb-2 block text-sm font-semibold">Grado</label>
          <select
            id="monitoring-grade"
            name="grado"
            defaultValue={gradeId ?? ""}
            className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm"
          >
            <option value="">Todos los grados</option>
            {data.grades.map((grade) => <option key={grade.id} value={grade.id}>{grade.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="monitoring-search" className="mb-2 block text-sm font-semibold">Buscar estudiante</label>
          <Input
            id="monitoring-search"
            name="buscar"
            defaultValue={search}
            placeholder="Código o nombre"
          />
        </div>
        <Button type="submit" className="self-end"><Search className="size-4" />Buscar</Button>
        {(gradeId || search) && (
          <Button asChild variant="outline" className="self-end">
            <Link href={data.period ? `/administracion/seguimiento-estudiantes?evaluacion=${data.period.id}` : "/administracion/seguimiento-estudiantes"}>
              Limpiar
            </Link>
          </Button>
        )}
      </form>

      <section className="mb-5 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-3">
        <Metric icon={UserRoundCheck} value={data.students.length} label="Estudiantes consultados" />
        <Metric icon={CheckCircle2} value={`${totalCompleted} / ${totalExpected}`} label="Encuestas realizadas" />
        <Metric icon={ClipboardList} value={fullyCompleted} label="Estudiantes al día" />
      </section>

      {data.selectedStudent && (
        <section className="mb-5 rounded-xl border bg-card">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Detalle del estudiante</p>
              <h2 className="mt-1 text-xl font-semibold">{data.selectedStudent.full_name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Código {data.selectedStudent.code} · {data.selectedStudent.gradeName}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={studentHref()}>Cerrar detalle</Link>
            </Button>
          </div>
          <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
            {data.details.map((detail) => (
              <article key={detail.teacherId} className="rounded-xl border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{detail.teacherName}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{detail.subjectNames.join(", ")}</p>
                  </div>
                  <Badge>{detail.evaluationId ? "Realizada" : "Pendiente"}</Badge>
                </div>
                {detail.submittedAt ? (
                  <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-4 text-emerald-700" />
                    Enviada el {new Intl.DateTimeFormat("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "America/Bogota"
                    }).format(new Date(detail.submittedAt))}
                  </p>
                ) : (
                  <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="size-4 text-amber-700" />Aún no ha sido enviada
                  </p>
                )}
                {detail.evaluationId && (
                  <div className="mt-4 border-t pt-4">
                    <ReleaseEvaluationButton
                      evaluationId={detail.evaluationId}
                      teacherName={detail.teacherName}
                    />
                  </div>
                )}
              </article>
            ))}
            {!data.details.length && (
              <p className="md:col-span-2 xl:col-span-3 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                El grado del estudiante no tiene docentes activos asignados.
              </p>
            )}
          </div>
        </section>
      )}

      <div className="overflow-x-auto rounded-xl border bg-card">
        <div className="border-b px-5 py-3 text-sm text-muted-foreground">
          {data.students.length} {data.students.length === 1 ? "estudiante encontrado" : "estudiantes encontrados"}
        </div>
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4">Código</th>
              <th className="p-4">Estudiante</th>
              <th className="p-4">Grado</th>
              <th className="p-4">Progreso</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.students.map((student) => {
              const percentage = student.expected ? (student.completed / student.expected) * 100 : 0;
              const complete = student.expected > 0 && student.completed === student.expected;
              return (
                <tr key={student.id}>
                  <td className="p-4 font-mono">{student.code}</td>
                  <td className="p-4 font-medium">{student.full_name}</td>
                  <td className="p-4">{student.gradeName}</td>
                  <td className="p-4">
                    <div className="w-48">
                      <div className="mb-1 flex justify-between text-xs">
                        <span>{student.completed} de {student.expected}</span>
                        <span>{Math.round(percentage)}%</span>
                      </div>
                      <Progress value={percentage} label={`Progreso de ${student.full_name}`} />
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge>{complete ? "Completo" : student.completed ? "En progreso" : "Pendiente"}</Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end">
                      <Button asChild variant="outline" size="sm">
                        <Link href={studentHref(student.id)}>
                          <RotateCcw className="size-4" />Revisar
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!data.students.length && (
          <p className="p-10 text-center text-sm text-muted-foreground">
            No hay estudiantes que coincidan con los filtros seleccionados.
          </p>
        )}
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  value,
  label
}: {
  icon: typeof ClipboardList;
  value: string | number;
  label: string;
}) {
  return (
    <div className="bg-card p-5">
      <Icon className="size-5 text-primary" />
      <p className="mt-4 font-mono text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
