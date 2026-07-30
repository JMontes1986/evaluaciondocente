import { createTeacherAssignmentAction } from "@/actions/admin";
import { PageHeading } from "@/components/admin/page-heading";
import { StatusButton } from "@/components/admin/status-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AssignmentsPage() {
  const admin = createAdminClient();
  const [{ data: rows }, { data: teachers }, { data: grades }, { data: subjects }, { data: years }] =
    await Promise.all([
      admin
        .from("teacher_assignments")
        .select("id,teacher_id,grade_id,subject_id,academic_year_id,active")
        .order("created_at", { ascending: false }),
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

      <div className="overflow-x-auto rounded-xl border bg-card">
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
                  <div className="flex justify-end">
                    <StatusButton table="teacher_assignments" id={assignment.id} active={assignment.active} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows?.length && (
          <p className="p-10 text-center text-sm text-muted-foreground">
            No hay asignaciones registradas. Usa el formulario para parametrizar los docentes.
          </p>
        )}
      </div>
    </div>
  );
}
