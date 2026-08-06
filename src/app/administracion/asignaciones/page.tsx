import Link from "next/link";
import { ArrowRightLeft, BookOpen, GraduationCap, UsersRound } from "lucide-react";
import { createTeacherAssignmentAction, reassignTeacherAssignmentsAction } from "@/actions/admin";
import { PageHeading } from "@/components/admin/page-heading";
import { StatusButton } from "@/components/admin/status-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireModule } from "@/lib/auth/permissions";

interface AssignmentsPageProps {
  searchParams: Promise<{ docente?: string; grado?: string; editar?: string; reasignacion?: string; cantidad?: string }>;
}

export default async function AssignmentsPage({ searchParams }: AssignmentsPageProps) {
  await requireModule("asignaciones");
  const { docente, grado, editar, reasignacion, cantidad } = await searchParams;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const teacherId = uuidPattern.test(docente ?? "")
    ? docente ?? ""
    : "";
  const selectedGradeId = uuidPattern.test(grado ?? "") ? grado ?? "" : "";
  const editAssignmentId = uuidPattern.test(editar ?? "") ? editar ?? "" : "";
  const admin = createAdminClient();
  let assignmentsQuery = admin
    .from("teacher_assignments")
    .select("id,teacher_id,grade_id,subject_id,academic_year_id,active")
    .order("created_at", { ascending: false });
  if (teacherId) assignmentsQuery = assignmentsQuery.eq("teacher_id", teacherId);

  const [{ data: rows }, { data: visualRows }, { data: teachers }, { data: grades }, { data: subjects }, { data: years }] =
    await Promise.all([
      assignmentsQuery,
      admin
        .from("teacher_assignments")
        .select("teacher_id,grade_id,subject_id,academic_year_id")
        .eq("active", true),
      admin.from("teachers").select("id,full_name,active").order("full_name"),
      admin.from("grades").select("id,name,active").order("order_number"),
      admin.from("subjects").select("id,name,active").order("name"),
      admin.from("academic_years").select("id,name").order("name", { ascending: false })
    ]);

  const map = <T extends { id: string }>(values: T[] | null, label: (value: T) => string) =>
    new Map((values ?? []).map((value) => [value.id, label(value)]));
  const teacherMap = map(teachers, (teacher) => teacher.full_name);
  const gradeMap = map(grades, (grade) => grade.name);
  const subjectMap = map(subjects, (subject) => subject.name);
  const yearMap = map(years, (year) => year.name);
  const editAssignment = (rows ?? []).find((assignment) => assignment.id === editAssignmentId) ?? null;
  const activeTeacherIds = new Set((teachers ?? []).filter((teacher) => teacher.active).map((teacher) => teacher.id));
  const activeSubjectIds = new Set((subjects ?? []).filter((subject) => subject.active).map((subject) => subject.id));
  const activeGradeIds = new Set((grades ?? []).filter((grade) => grade.active).map((grade) => grade.id));
  const activeVisualRows = (visualRows ?? []).filter((assignment) =>
    activeTeacherIds.has(assignment.teacher_id)
    && activeSubjectIds.has(assignment.subject_id)
    && activeGradeIds.has(assignment.grade_id)
  );
  const selectedGrade = (grades ?? []).find((grade) => grade.id === selectedGradeId && grade.active);
  const subjectGroups = new Map<string, { teachers: Set<string>; years: Set<string> }>();
  if (selectedGrade) {
    for (const assignment of activeVisualRows.filter((item) => item.grade_id === selectedGrade.id)) {
      const group = subjectGroups.get(assignment.subject_id) ?? { teachers: new Set<string>(), years: new Set<string>() };
      group.teachers.add(assignment.teacher_id);
      group.years.add(assignment.academic_year_id);
      subjectGroups.set(assignment.subject_id, group);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeading
        eyebrow="Relaciones académicas"
        title="Asignaciones docentes"
        description="Define qué asignatura dicta cada docente en uno o varios grados durante el año académico."
      />

      <form
        action={createTeacherAssignmentAction}
        className="mb-7 grid gap-4 rounded-xl border bg-card p-5 md:grid-cols-2 xl:grid-cols-3"
      >
        <select
          name="teacherId"
          required
          className="min-h-11 rounded-lg border bg-background px-3 text-sm"
          aria-label="Docente"
        >
          <option value="">Selecciona un docente</option>
          {teachers?.filter((teacher) => teacher.active).map((teacher) => (
            <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>
          ))}
        </select>
        <select
          name="subjectId"
          required
          className="min-h-11 rounded-lg border bg-background px-3 text-sm"
          aria-label="Asignatura"
        >
          <option value="">Asignatura</option>
          {subjects?.filter((subject) => subject.active).map((subject) => (
            <option key={subject.id} value={subject.id}>{subject.name}</option>
          ))}
        </select>
        <select
          name="academicYearId"
          required
          className="min-h-11 rounded-lg border bg-background px-3 text-sm"
          aria-label="Año académico"
        >
          <option value="">Año académico</option>
          {years?.map((year) => (
            <option key={year.id} value={year.id}>{year.name}</option>
          ))}
        </select>
        <fieldset className="rounded-xl border p-4 md:col-span-2 xl:col-span-3">
          <legend className="px-2 text-sm font-semibold">Grados en los que dicta la asignatura</legend>
          <p className="mb-3 text-xs text-muted-foreground">Marca todos los grados que correspondan.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {grades?.filter((grade) => grade.active).map((grade) => (
              <label
                key={grade.id}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-secondary"
              >
                <input name="gradeIds" type="checkbox" value={grade.id} className="size-4 accent-primary" />
                {grade.name}
              </label>
            ))}
          </div>
        </fieldset>
        <Button type="submit" className="md:col-span-2 md:justify-self-end xl:col-span-3">
          Guardar asignaciones
        </Button>
      </form>

      {reasignacion && (
        <p
          role={reasignacion === "ok" ? "status" : "alert"}
          className={`mb-5 rounded-xl border p-4 text-sm ${
            reasignacion === "ok"
              ? "border-emerald-700/20 bg-emerald-700/5 text-emerald-800"
              : "border-destructive/25 bg-destructive/5 text-destructive"
          }`}
        >
          {reasignacion === "ok"
            ? `Se reasignaron correctamente ${cantidad ?? "las"} asignaciones al nuevo docente.`
            : reasignacion === "sin-coincidencias"
              ? "No se encontraron asignaciones activas que coincidan con el docente, asignatura, año y grupos seleccionados."
              : reasignacion === "datos-invalidos"
                ? "Revisa los datos: selecciona docentes diferentes y al menos un grupo."
                : "No fue posible completar la reasignación. Inténtalo nuevamente."}
        </p>
      )}

      <details id="reasignar" open={Boolean(editAssignment)} className="mb-7 scroll-mt-6 overflow-hidden rounded-xl border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6">
          <div>
            <h2 className="flex items-center gap-2 font-semibold"><ArrowRightLeft className="size-5 text-primary" />Reasignar grupos a otro docente</h2>
            <p className="mt-1 text-sm text-muted-foreground">Cambia el docente de una asignatura en uno o varios grupos, conservando el historial anterior.</p>
          </div>
          <Badge>Editar asignación</Badge>
        </summary>
        <form action={reassignTeacherAssignmentsAction} className="grid gap-4 border-t bg-secondary/20 p-5 md:grid-cols-2 xl:grid-cols-4 sm:p-6">
          <div>
            <label htmlFor="reassign-current-teacher" className="mb-2 block text-sm font-semibold">Docente actual</label>
            <select id="reassign-current-teacher" name="currentTeacherId" required defaultValue={editAssignment?.teacher_id ?? ""} className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm">
              <option value="">Selecciona el docente actual</option>
              {teachers?.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="reassign-new-teacher" className="mb-2 block text-sm font-semibold">Nuevo docente</label>
            <select id="reassign-new-teacher" name="newTeacherId" required className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm">
              <option value="">Selecciona el nuevo docente</option>
              {teachers?.filter((teacher) => teacher.active).map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="reassign-subject" className="mb-2 block text-sm font-semibold">Asignatura</label>
            <select id="reassign-subject" name="subjectId" required defaultValue={editAssignment?.subject_id ?? ""} className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm">
              <option value="">Selecciona la asignatura</option>
              {subjects?.filter((subject) => subject.active).map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="reassign-year" className="mb-2 block text-sm font-semibold">Año académico</label>
            <select id="reassign-year" name="academicYearId" required defaultValue={editAssignment?.academic_year_id ?? ""} className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm">
              <option value="">Selecciona el año</option>
              {years?.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
            </select>
          </div>
          <fieldset className="rounded-xl border bg-background p-4 md:col-span-2 xl:col-span-4">
            <legend className="px-2 text-sm font-semibold">Grupo o grupos que cambiarán de docente</legend>
            <p className="mb-3 text-xs text-muted-foreground">Solo se modificarán las coincidencias activas de los grupos seleccionados.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
              {grades?.filter((grade) => grade.active).map((grade) => (
                <label key={grade.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 text-sm font-medium hover:bg-secondary">
                  <input name="gradeIds" type="checkbox" value={grade.id} defaultChecked={editAssignment?.grade_id === grade.id} className="size-4 accent-primary" />
                  {grade.name}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="md:col-span-2 xl:col-span-4 xl:justify-self-end">
            <Button type="submit"><ArrowRightLeft className="size-4" />Asignar al nuevo docente</Button>
          </div>
        </form>
      </details>

      <section className="mb-5 rounded-xl border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <GraduationCap className="size-5 text-primary" />
              Revisión gráfica por grado
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecciona un grado para revisar sus asignaturas y docentes asignados.
            </p>
          </div>
          {selectedGrade && (
            <Button asChild variant="outline" size="sm">
              <Link href={teacherId ? `/administracion/asignaciones?docente=${teacherId}` : "/administracion/asignaciones"}>
                Ver todos los grados
              </Link>
            </Button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {grades?.filter((grade) => grade.active).map((grade) => {
            const gradeAssignments = activeVisualRows.filter((assignment) => assignment.grade_id === grade.id);
            const subjectCount = new Set(gradeAssignments.map((assignment) => assignment.subject_id)).size;
            const teacherCount = new Set(gradeAssignments.map((assignment) => assignment.teacher_id)).size;
            const href = teacherId
              ? `/administracion/asignaciones?docente=${teacherId}&grado=${grade.id}`
              : `/administracion/asignaciones?grado=${grade.id}`;

            return (
              <Link
                key={grade.id}
                href={href}
                className={`rounded-xl border p-4 transition-colors hover:border-primary hover:bg-secondary/50 ${
                  selectedGrade?.id === grade.id ? "border-primary bg-primary text-primary-foreground" : "bg-background"
                }`}
              >
                <p className="text-lg font-bold">{grade.name}</p>
                <div className={`mt-3 space-y-1 text-xs ${selectedGrade?.id === grade.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  <p className="flex items-center gap-2"><BookOpen className="size-3.5" />{subjectCount} asignaturas</p>
                  <p className="flex items-center gap-2"><UsersRound className="size-3.5" />{teacherCount} docentes</p>
                </div>
              </Link>
            );
          })}
        </div>

        {selectedGrade && (
          <div className="mt-5 border-t pt-5">
            <h3 className="text-lg font-semibold">Asignaciones de {selectedGrade.name}</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...subjectGroups.entries()].map(([subjectId, group]) => (
                <article key={subjectId} className="rounded-xl border bg-background p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                      <BookOpen className="size-4" />
                    </span>
                    <div>
                      <h4 className="font-semibold">{subjectMap.get(subjectId) ?? "Asignatura"}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[...group.years].map((yearId) => yearMap.get(yearId)).filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {[...group.teachers].map((assignedTeacherId) => (
                      <div key={assignedTeacherId} className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-sm">
                        <UsersRound className="size-4 text-primary" />
                        <span className="font-medium">{teacherMap.get(assignedTeacherId) ?? "Docente"}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            {!subjectGroups.size && (
              <p className="mt-4 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Este grado todavía no tiene asignaturas ni docentes activos asignados.
              </p>
            )}
          </div>
        )}
      </section>

      <form method="get" className="mb-5 grid gap-3 rounded-xl border bg-card p-5 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        {selectedGrade && <input type="hidden" name="grado" value={selectedGrade.id} />}
        <div>
          <label htmlFor="assignment-teacher-filter" className="mb-2 block text-sm font-semibold">
            Buscar asignaciones por docente
          </label>
          <select
            id="assignment-teacher-filter"
            name="docente"
            defaultValue={teacherId}
            className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm"
          >
            <option value="">Todos los docentes</option>
            {teachers?.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>
            ))}
          </select>
        </div>
        <Button type="submit">Aplicar filtro</Button>
        {teacherId && (
          <Button asChild variant="outline">
            <Link href={selectedGrade ? `/administracion/asignaciones?grado=${selectedGrade.id}` : "/administracion/asignaciones"}>
              Limpiar
            </Link>
          </Button>
        )}
      </form>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <div className="border-b px-4 py-3 text-sm text-muted-foreground">
          {rows?.length ?? 0} {(rows?.length ?? 0) === 1 ? "asignación encontrada" : "asignaciones encontradas"}
        </div>
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4">Docente</th>
              <th className="p-4">Asignatura</th>
              <th className="p-4">Grado</th>
              <th className="p-4">Año</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows?.map((assignment) => (
              <tr key={assignment.id}>
                <td className="p-4 font-medium">{teacherMap.get(assignment.teacher_id) ?? "Docente no disponible"}</td>
                <td className="p-4">{subjectMap.get(assignment.subject_id) ?? "Asignatura no disponible"}</td>
                <td className="p-4">{gradeMap.get(assignment.grade_id) ?? "Grado no disponible"}</td>
                <td className="p-4">{yearMap.get(assignment.academic_year_id) ?? "Año no disponible"}</td>
                <td className="p-4"><Badge>{assignment.active ? "Activa" : "Inactiva"}</Badge></td>
                <td className="p-4">
                  <div className="flex justify-end gap-1">
                    {assignment.active && (
                      <Button asChild type="button" variant="ghost" size="sm">
                        <Link href={`/administracion/asignaciones?editar=${assignment.id}#reasignar`}>Editar</Link>
                      </Button>
                    )}
                    <StatusButton table="teacher_assignments" id={assignment.id} active={assignment.active} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows?.length && (
          <p className="p-10 text-center text-sm text-muted-foreground">
            {teacherId
              ? "El docente seleccionado no tiene asignaciones registradas."
              : "No hay asignaciones registradas. Usa el formulario para parametrizar los docentes."}
          </p>
        )}
      </div>
    </div>
  );
}
