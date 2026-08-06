import Link from "next/link";
import { Search } from "lucide-react";
import { createStudentAction } from "@/actions/admin";
import { PageHeading } from "@/components/admin/page-heading";
import { StatusButton } from "@/components/admin/status-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizePostgrestSearch } from "@/lib/security/query";

interface StudentsPageProps {
  searchParams: Promise<{
    buscar?: string;
    grado?: string;
    ano?: string;
    estado?: string;
  }>;
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const filters = await searchParams;
  const search = filters.buscar?.trim().slice(0, 80) ?? "";
  const gradeId = filters.grado ?? "";
  const yearId = filters.ano ?? "";
  const status = filters.estado ?? "";
  const admin = createAdminClient();

  let studentsQuery = admin
    .from("students")
    .select("id,code,full_name,grade_id,academic_year_id,active")
    .order("full_name")
    .limit(1000);

  if (search) {
    const safeSearch = sanitizePostgrestSearch(search);
    if (safeSearch) {
      studentsQuery = studentsQuery.or(`code.ilike.%${safeSearch}%,full_name.ilike.%${safeSearch}%`);
    }
  }
  if (gradeId) studentsQuery = studentsQuery.eq("grade_id", gradeId);
  if (yearId) studentsQuery = studentsQuery.eq("academic_year_id", yearId);
  if (status === "activo") studentsQuery = studentsQuery.eq("active", true);
  if (status === "inactivo") studentsQuery = studentsQuery.eq("active", false);

  const [{ data: students }, { data: grades }, { data: years }] = await Promise.all([
    studentsQuery,
    admin.from("grades").select("id,name").eq("active", true).order("order_number"),
    admin.from("academic_years").select("id,name").order("name", { ascending: false })
  ]);

  const gradeMap = new Map((grades ?? []).map((grade) => [grade.id, grade.name]));
  const yearMap = new Map((years ?? []).map((year) => [year.id, year.name]));
  const hasFilters = Boolean(search || gradeId || yearId || status);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeading
        eyebrow="Gestión académica"
        title="Estudiantes"
        description="Los códigos solo son visibles para administradores autorizados."
      />

      <form
        action={createStudentAction}
        className="mb-5 grid gap-3 rounded-xl border bg-card p-5 lg:grid-cols-[.7fr_1.2fr_1fr_1fr_auto]"
      >
        <Input name="code" required placeholder="Código" aria-label="Código" />
        <Input name="fullName" required placeholder="Nombre completo" aria-label="Nombre completo" />
        <select
          name="gradeId"
          required
          className="min-h-11 rounded-lg border bg-background px-3 text-sm"
          aria-label="Grado"
        >
          <option value="">Grado</option>
          {grades?.map((grade) => <option key={grade.id} value={grade.id}>{grade.name}</option>)}
        </select>
        <select
          name="academicYearId"
          required
          className="min-h-11 rounded-lg border bg-background px-3 text-sm"
          aria-label="Año académico"
        >
          <option value="">Año</option>
          {years?.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
        </select>
        <Button type="submit">Agregar</Button>
      </form>

      <form method="get" className="mb-5 rounded-xl border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Search className="size-4 text-primary" aria-hidden="true" />
          <h2 className="font-semibold">Buscar y filtrar estudiantes</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.5fr)_1fr_1fr_1fr_auto_auto]">
          <Input
            name="buscar"
            defaultValue={search}
            placeholder="Código o nombre"
            aria-label="Buscar por código o nombre"
          />
          <select
            name="grado"
            defaultValue={gradeId}
            className="min-h-11 rounded-lg border bg-background px-3 text-sm"
            aria-label="Filtrar por grado"
          >
            <option value="">Todos los grados</option>
            {grades?.map((grade) => <option key={grade.id} value={grade.id}>{grade.name}</option>)}
          </select>
          <select
            name="ano"
            defaultValue={yearId}
            className="min-h-11 rounded-lg border bg-background px-3 text-sm"
            aria-label="Filtrar por año"
          >
            <option value="">Todos los años</option>
            {years?.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
          </select>
          <select
            name="estado"
            defaultValue={status}
            className="min-h-11 rounded-lg border bg-background px-3 text-sm"
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
          <Button type="submit">Filtrar</Button>
          {hasFilters && (
            <Button asChild variant="outline">
              <Link href="/administracion/estudiantes">Limpiar</Link>
            </Button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <div className="border-b px-4 py-3 text-sm text-muted-foreground">
          {students?.length ?? 0} {(students?.length ?? 0) === 1 ? "estudiante encontrado" : "estudiantes encontrados"}
        </div>
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4">Código</th>
              <th className="p-4">Nombre</th>
              <th className="p-4">Grado</th>
              <th className="p-4">Año</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {students?.map((student) => (
              <tr key={student.id}>
                <td className="p-4 font-mono">{student.code}</td>
                <td className="p-4 font-medium">{student.full_name}</td>
                <td className="p-4">{gradeMap.get(student.grade_id)}</td>
                <td className="p-4">{yearMap.get(student.academic_year_id)}</td>
                <td className="p-4"><Badge>{student.active ? "Activo" : "Inactivo"}</Badge></td>
                <td className="p-4">
                  <div className="flex justify-end">
                    <StatusButton table="students" id={student.id} active={student.active} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!students?.length && (
          <p className="p-10 text-center text-sm text-muted-foreground">
            {hasFilters
              ? "No hay estudiantes que coincidan con los filtros seleccionados."
              : "No hay estudiantes registrados."}
          </p>
        )}
      </div>
    </div>
  );
}
