import Link from "next/link";
import { BarChart3, BookOpenCheck, Download, FileSpreadsheet, GraduationCap, MessageSquareText, UsersRound } from "lucide-react";
import { PageHeading } from "@/components/admin/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getReportsOverview } from "@/lib/services/report-service";

export const metadata = { title: "Centro de informes" };

interface ReportsPageProps {
  searchParams: Promise<{ periodo?: string }>;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function score(value: number | null) {
  return value === null ? "Dato protegido" : `${value.toLocaleString("es-CO", { minimumFractionDigits: 2 })} / 4`;
}

function percentage(value: number | null) {
  return value === null ? "—" : `${value.toLocaleString("es-CO", { maximumFractionDigits: 1 })} %`;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const requestedPeriod = uuidPattern.test(params.periodo ?? "") ? params.periodo : undefined;
  const data = await getReportsOverview(requestedPeriod);

  if (!data.period) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeading eyebrow="Análisis institucional" title="Centro de informes" description="Informes organizados para comprender resultados y orientar decisiones." />
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Configura una evaluación semestral para generar informes.
        </p>
      </div>
    );
  }

  const metricCards = [
    ["Evaluaciones", data.metrics.evaluations, BookOpenCheck],
    ["Estudiantes participantes", data.metrics.students, GraduationCap],
    ["Docentes evaluados", data.metrics.teachers, UsersRound],
    ["Promedio institucional", data.metrics.average ? `${data.metrics.average} / 4` : "Protegido", BarChart3],
    ["Respuestas favorables", data.metrics.average ? `${data.metrics.favorable} %` : "Protegido", FileSpreadsheet],
    ["Comentarios recibidos", data.metrics.comments, MessageSquareText]
  ] as const;

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeading
        eyebrow="Análisis institucional"
        title="Centro de informes"
        description="Consulta resultados por docente, pregunta y grado. Ningún informe expone la identidad de los estudiantes."
      >
        <Badge>{data.period.name}</Badge>
      </PageHeading>

      <section className="rounded-xl border bg-card p-5 sm:p-6" aria-label="Seleccionar semestre y descargar">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="min-w-64 flex-1">
            <label htmlFor="report-period" className="mb-2 block text-sm font-semibold">Evaluación semestral</label>
            <select id="report-period" name="periodo" defaultValue={data.period.id} className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm">
              {data.periods.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}
            </select>
          </div>
          <Button type="submit">Consultar</Button>
          <Button asChild variant="outline"><Link href={`/api/exports/excel?period=${data.period.id}`}><Download className="size-4" /> Excel detallado</Link></Button>
          <Button asChild variant="outline"><Link href={`/api/exports/pdf?period=${data.period.id}`}><Download className="size-4" /> PDF ejecutivo</Link></Button>
          <Button asChild variant="outline"><Link href={`/api/exports/word?period=${data.period.id}`}><Download className="size-4" /> Word</Link></Button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          Los resultados segmentados requieren al menos {data.minResponses} evaluaciones. “Favorable” reúne Casi siempre y Siempre.
        </p>
      </section>

      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Secciones del informe">
        {[["#docentes", "Por docente"], ["#preguntas", "Por pregunta"], ["#grados", "Por grado"], ["#participacion", "Participación"]].map(([href, label]) => (
          <Button key={href} asChild size="sm" variant="outline"><Link href={href}>{label}</Link></Button>
        ))}
      </nav>

      <section className="mt-5 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 xl:grid-cols-6" aria-label="Resumen ejecutivo">
        {metricCards.map(([label, value, Icon]) => (
          <article key={label} className="bg-card p-5">
            <Icon className="size-5 text-primary" />
            <p className="mt-4 font-mono text-xl font-semibold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </article>
        ))}
      </section>

      <ReportSection id="docentes" title="Informe por docente" description="Compara volumen, promedio, favorabilidad y comentarios recibidos. Ordenado por resultado.">
        <DataTable headers={["Docente", "Evaluaciones", "Promedio", "Favorable", "Comentarios"]}>
          {data.teachers.map((teacher) => (
            <tr key={teacher.id} className="border-t">
              <td className="p-4 font-medium">{teacher.name}</td><td className="p-4 text-center">{teacher.evaluations}</td>
              <td className="p-4 text-center">{score(teacher.average)}</td><td className="p-4 text-center">{percentage(teacher.favorable)}</td>
              <td className="p-4 text-center">{teacher.comments}</td>
            </tr>
          ))}
        </DataTable>
      </ReportSection>

      <ReportSection id="preguntas" title="Informe por pregunta" description="Identifica fortalezas y prioridades pedagógicas; las preguntas con promedio inferior a 2,5 se señalan para revisión.">
        <DataTable headers={["Pregunta", "Categoría", "Enunciado", "Respuestas", "Promedio", "Favorable"]}>
          {data.questions.map((question) => (
            <tr key={question.id} className="border-t">
              <td className="p-4"><Badge className={question.priority ? "border-red-700/20 bg-red-700/10 text-red-800" : undefined}>{question.label}</Badge></td>
              <td className="p-4 text-muted-foreground">{question.category ?? "General"}</td><td className="max-w-xl p-4 font-medium">{question.question}</td>
              <td className="p-4 text-center">{question.responses}</td><td className="p-4 text-center">{score(question.average)}</td>
              <td className="p-4 text-center">{percentage(question.favorable)}</td>
            </tr>
          ))}
        </DataTable>
      </ReportSection>

      <ReportSection id="grados" title="Informe por grado" description="Permite detectar diferencias de percepción entre grupos sin mostrar estudiantes individuales.">
        <DataTable headers={["Grado", "Evaluaciones", "Estudiantes", "Promedio", "Favorable"]}>
          {data.grades.map((grade) => (
            <tr key={grade.id} className="border-t">
              <td className="p-4 font-medium">{grade.name}</td><td className="p-4 text-center">{grade.evaluations}</td>
              <td className="p-4 text-center">{grade.students}</td><td className="p-4 text-center">{score(grade.average)}</td>
              <td className="p-4 text-center">{percentage(grade.favorable)}</td>
            </tr>
          ))}
        </DataTable>
      </ReportSection>

      <ReportSection id="participacion" title="Informe de participación" description="Muestra cuándo se registraron las evaluaciones y ayuda a reconocer días de mayor o menor actividad.">
        <DataTable headers={["Fecha", "Evaluaciones registradas"]}>
          {data.activity.map((day) => (
            <tr key={day.date} className="border-t"><td className="p-4 font-medium">{new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${day.date}T00:00:00Z`))}</td><td className="p-4 text-center">{day.count}</td></tr>
          ))}
        </DataTable>
      </ReportSection>
    </div>
  );
}

function ReportSection({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return <section id={id} className="mt-7 scroll-mt-6 overflow-hidden rounded-xl border bg-card"><div className="border-b p-5 sm:p-6"><h2 className="text-xl font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>{children}</section>;
}

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr>{headers.map((header, index) => <th key={header} className={`p-4 ${index > 0 ? "text-center" : ""}`}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
