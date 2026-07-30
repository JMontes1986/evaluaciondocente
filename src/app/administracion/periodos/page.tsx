import Link from "next/link";
import { Pencil } from "lucide-react";
import { saveSemesterEvaluationAction } from "@/actions/admin";
import { PageHeading } from "@/components/admin/page-heading";
import { StatusButton } from "@/components/admin/status-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";

interface SemesterEvaluationsPageProps {
  searchParams: Promise<{ editar?: string }>;
}

export default async function SemesterEvaluationsPage({ searchParams }: SemesterEvaluationsPageProps) {
  const { editar } = await searchParams;
  const admin = createAdminClient();
  const [{ data: evaluations }, { data: years }] = await Promise.all([
    admin
      .from("evaluation_periods")
      .select("id,name,start_date,end_date,active,allow_feedback,academic_year_id")
      .order("start_date", { ascending: false }),
    admin.from("academic_years").select("id,name").order("name", { ascending: false })
  ]);
  const yearMap = new Map((years ?? []).map((year) => [year.id, year.name]));
  const editingEvaluation = evaluations?.find((evaluation) => evaluation.id === editar);
  const editingSemester = editingEvaluation?.name.toLocaleLowerCase("es").includes("primer")
    ? "primer"
    : editingEvaluation ? "segundo" : "";
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "America/Bogota" }).format(new Date(value));
  const formatInputDate = (value: string) => {
    const parts = new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "America/Bogota"
    }).formatToParts(new Date(value));
    const get = (type: "year" | "month" | "day") => parts.find((part) => part.type === type)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}`;
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeading
        eyebrow="Calendario"
        title="Evaluaciones docentes semestrales"
        description="Configura la evaluación del primer o segundo semestre y define las fechas en que estará disponible."
      />

      <form
        action={saveSemesterEvaluationAction}
        className="mb-7 grid gap-4 rounded-xl border bg-card p-5 md:grid-cols-2"
      >
        {editingEvaluation && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary/60 px-4 py-3 md:col-span-2">
            <p className="text-sm font-semibold">Editando: {editingEvaluation.name}</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/administracion/periodos">Cancelar</Link>
            </Button>
          </div>
        )}
        <div>
          <label htmlFor="semester" className="mb-2 block text-sm font-semibold">Evaluación</label>
          {editingEvaluation && <input type="hidden" name="semester" value={editingSemester} />}
          <select
            id="semester"
            name={editingEvaluation ? undefined : "semester"}
            required
            disabled={Boolean(editingEvaluation)}
            defaultValue={editingSemester}
            className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm disabled:opacity-70"
          >
            <option value="">Selecciona una evaluación</option>
            <option value="primer">Evaluación docente primer semestre</option>
            <option value="segundo">Evaluación docente segundo semestre</option>
          </select>
        </div>
        <div>
          <label htmlFor="academic-year" className="mb-2 block text-sm font-semibold">Año académico</label>
          {editingEvaluation && <input type="hidden" name="academicYearId" value={editingEvaluation.academic_year_id} />}
          <select
            id="academic-year"
            name={editingEvaluation ? undefined : "academicYearId"}
            required
            disabled={Boolean(editingEvaluation)}
            defaultValue={editingEvaluation?.academic_year_id ?? ""}
            className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm disabled:opacity-70"
          >
            <option value="">Selecciona el año</option>
            {years?.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="start-date" className="mb-2 block text-sm font-semibold">Fecha de apertura</label>
          <input id="start-date" name="startDate" type="date" required defaultValue={editingEvaluation ? formatInputDate(editingEvaluation.start_date) : ""} className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm" />
        </div>
        <div>
          <label htmlFor="end-date" className="mb-2 block text-sm font-semibold">Fecha de cierre</label>
          <input id="end-date" name="endDate" type="date" required defaultValue={editingEvaluation ? formatInputDate(editingEvaluation.end_date) : ""} className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm" />
        </div>
        <label className="flex min-h-11 items-center gap-3 rounded-lg border px-4 text-sm">
          <input name="active" type="checkbox" defaultChecked={editingEvaluation?.active ?? false} className="size-4" />
          Habilitar evaluación
        </label>
        <label className="flex min-h-11 items-center gap-3 rounded-lg border px-4 text-sm">
          <input name="allowFeedback" type="checkbox" defaultChecked={editingEvaluation?.allow_feedback ?? true} className="size-4" />
          Permitir comentarios
        </label>
        <Button type="submit" className="md:col-span-2">
          {editingEvaluation ? "Guardar cambios" : "Guardar evaluación semestral"}
        </Button>
      </form>

      <div className="divide-y rounded-xl border bg-card">
        {evaluations?.map((evaluation) => (
          <div key={evaluation.id} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="font-semibold">{evaluation.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Año {yearMap.get(evaluation.academic_year_id) ?? "sin definir"} · {formatDate(evaluation.start_date)} – {formatDate(evaluation.end_date)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge>{evaluation.active ? "Habilitada" : "Deshabilitada"}</Badge>
                <Badge>{evaluation.allow_feedback ? "Con comentarios" : "Sin comentarios"}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/administracion/periodos?editar=${evaluation.id}`}>
                  <Pencil className="size-4" />
                  Editar
                </Link>
              </Button>
              <StatusButton table="evaluation_periods" id={evaluation.id} active={evaluation.active} />
            </div>
          </div>
        ))}
        {!evaluations?.length && (
          <p className="p-10 text-center text-sm text-muted-foreground">
            Aún no hay evaluaciones semestrales configuradas.
          </p>
        )}
      </div>
    </div>
  );
}
