import Link from "next/link";
import { Download } from "lucide-react";
import { QuestionAverageChart, ScoreDistributionChart } from "@/components/admin/dashboard-charts";
import { PageHeading } from "@/components/admin/page-heading";
import { QuestionDistributionChart } from "@/components/admin/teacher-results-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatScore, formatScorePercentage } from "@/lib/calculations/scores";
import { getTeacherResults } from "@/lib/services/teacher-results-service";

export const metadata = { title: "Resultados por docente" };

interface TeacherResultsPageProps {
  searchParams: Promise<{ docente?: string; evaluacion?: string }>;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const percentageFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

function formatResponsePercentage(count: number, total: number) {
  const percentage = total ? (count / total) * 100 : 0;
  return `${percentageFormatter.format(percentage)} %`;
}

export default async function TeacherResultsPage({ searchParams }: TeacherResultsPageProps) {
  const params = await searchParams;
  const teacherId = uuidPattern.test(params.docente ?? "") ? params.docente : undefined;
  const periodId = uuidPattern.test(params.evaluacion ?? "") ? params.evaluacion : undefined;
  const data = await getTeacherResults({ teacherId, periodId });
  const report = data.report;
  const questionChartData = report?.questions.map((question) => ({
    id: question.id,
    label: question.label,
    question: question.question,
    average: question.average,
    responses: question.responses,
    always: question.always,
    almostAlways: question.almostAlways,
    sometimes: question.sometimes,
    never: question.never
  })) ?? [];

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeading
        eyebrow="Análisis individual"
        title="Resultados por docente"
        description="Revisa el desempeño pregunta por pregunta y los comentarios anónimos sin exponer la identidad de los estudiantes."
      >
        {report?.available && data.teacher && data.period ? (
          <Button asChild>
            <Link href={`/api/exports/teacher-word?teacher=${data.teacher.id}&period=${data.period.id}`}>
              <Download className="size-4" /> Descargar formato Word
            </Link>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href="/administracion/docentes">Volver a docentes</Link>
        </Button>
      </PageHeading>

      <form method="get" className="grid gap-4 rounded-xl border bg-card p-5 lg:grid-cols-[1.2fr_1fr_auto] lg:items-end">
        <div className="space-y-2">
          <label htmlFor="teacher-result-teacher" className="block text-sm font-semibold">Docente</label>
          <select
            id="teacher-result-teacher"
            name="docente"
            required
            defaultValue={data.teacher?.id ?? ""}
            className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm"
          >
            <option value="">Selecciona un docente</option>
            {data.teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.full_name}{teacher.active ? "" : " — Inactivo"}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="teacher-result-period" className="block text-sm font-semibold">Evaluación semestral</label>
          <select
            id="teacher-result-period"
            name="evaluacion"
            defaultValue={data.period?.id ?? ""}
            className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm"
          >
            {data.periods.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}
          </select>
        </div>
        <Button type="submit">Consultar resultados</Button>
      </form>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Los resultados y comentarios solo se muestran cuando el docente tiene al menos {data.minResponses} evaluaciones en el semestre seleccionado.
      </p>

      {!data.teacher ? (
        <section className="mt-8 rounded-xl border border-dashed bg-card px-6 py-14 text-center">
          <p className="text-lg font-semibold">Selecciona un docente para comenzar</p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Encontrarás el promedio general, cada pregunta, la distribución de respuestas, oportunidades de mejora y comentarios.
          </p>
        </section>
      ) : data.error ? (
        <section role="alert" className="mt-8 rounded-xl border border-destructive/25 bg-destructive/5 p-6 text-destructive">
          <h2 className="font-semibold">No fue posible generar el informe</h2>
          <p className="mt-2 text-sm">{data.error}</p>
        </section>
      ) : !report?.available ? (
        <section className="mt-8 rounded-xl border border-dashed bg-card px-6 py-14 text-center">
          <Badge>Privacidad protegida</Badge>
          <h2 className="mt-5 text-xl font-semibold">Aún no hay suficientes evaluaciones</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {data.teacher.full_name} tiene {report?.responseCount ?? 0} de las {data.minResponses} respuestas mínimas necesarias en {data.period?.name}.
          </p>
        </section>
      ) : (
        <>
          <section className="mt-8 overflow-hidden rounded-xl border bg-[#102a4b] text-white">
            <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-end lg:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-white/55">{data.period?.name}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">{data.teacher.full_name}</h2>
                <p className="mt-2 text-sm text-white/60">{data.teacher.email ?? "Sin correo institucional registrado"}</p>
              </div>
              <div className="md:text-right">
                <p className="font-mono text-5xl font-semibold tracking-tight">{formatScorePercentage(report.average)}</p>
                <p className="mt-2 font-mono text-base font-semibold text-white/70">{formatScore(report.average)} / 4</p>
                <p className="mt-1 text-xs text-white/55">Promedio general</p>
              </div>
            </div>
            <div className="grid border-t border-white/10 sm:grid-cols-3">
              <Metric label="Evaluaciones recibidas" value={report.responseCount} />
              <Metric label="Preguntas analizadas" value={report.questions.length} />
              <Metric label="Comentarios recibidos" value={report.comments.length} />
            </div>
          </section>

          <section className="mt-6 grid gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-2">
            <QuestionInsight
              label="Pregunta con menor resultado"
              question={data.lowestQuestion}
              tone="priority"
            />
            <QuestionInsight
              label="Pregunta con mejor resultado"
              question={data.highestQuestion}
              tone="strength"
            />
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
            <ChartSection
              title="Promedio pregunta por pregunta"
              description="Rojo indica prioridad, amarillo seguimiento y verde fortaleza."
            >
              <QuestionAverageChart data={questionChartData} />
            </ChartSection>
            <ChartSection
              title="Distribución general"
              description="Porcentaje consolidado de todas las respuestas del docente."
            >
              <ScoreDistributionChart data={data.distribution} valueMode="percentage" />
            </ChartSection>
          </div>

          <ChartSection
            title="Cómo respondieron en cada pregunta"
            description="Cada barra representa el 100 % de las respuestas y muestra el porcentaje correspondiente a cada opción de la escala institucional."
            className="mt-6"
          >
            <QuestionDistributionChart data={report.questions} />
          </ChartSection>

          <section className="mt-6 overflow-hidden rounded-xl border bg-card">
            <div className="border-b p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Detalle completo por pregunta</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Resultados expresados en porcentaje y ordenados de menor a mayor. La distribución
                muestra qué proporción de respuestas recibió cada opción.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-sm">
                <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-4">Pregunta</th>
                    <th className="p-4">Criterio</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4 text-center">Resultado</th>
                    <th className="p-4 text-center">Nunca</th>
                    <th className="p-4 text-center">Algunas veces</th>
                    <th className="p-4 text-center">Casi siempre</th>
                    <th className="p-4 text-center">Siempre</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[...report.questions].sort((a, b) => a.average - b.average).map((question) => (
                    <tr key={question.id}>
                      <td className="p-4 font-mono font-bold">{question.label}</td>
                      <td className="max-w-xl p-4 leading-relaxed">{question.question}</td>
                      <td className="p-4 text-muted-foreground">{question.category ?? "General"}</td>
                      <td className="p-4 text-center font-mono font-bold">{formatScorePercentage(question.average)}</td>
                      <td className="p-4 text-center">{formatResponsePercentage(question.never, question.responses)}</td>
                      <td className="p-4 text-center">{formatResponsePercentage(question.sometimes, question.responses)}</td>
                      <td className="p-4 text-center">{formatResponsePercentage(question.almostAlways, question.responses)}</td>
                      <td className="p-4 text-center">{formatResponsePercentage(question.always, question.responses)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-6 overflow-hidden rounded-xl border bg-card">
            <div className="border-b p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Comentarios de estudiantes</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Observaciones abiertas presentadas de forma anónima.</p>
                </div>
                <Badge>{report.comments.length} comentarios</Badge>
              </div>
            </div>
            {report.comments.length ? (
              <ol className="divide-y">
                {report.comments.map((comment, index) => (
                  <li key={`${index}-${comment.slice(0, 24)}`} className="grid gap-3 p-5 sm:grid-cols-[42px_1fr] sm:p-6">
                    <span className="grid size-9 place-items-center rounded-full bg-secondary font-mono text-xs font-bold text-secondary-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="max-w-4xl text-sm leading-7">{comment}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="p-10 text-center text-sm text-muted-foreground">No se recibieron comentarios abiertos en este semestre.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-white/10 p-5 sm:not-last:border-r lg:px-8">
      <p className="font-mono text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-white/55">{label}</p>
    </div>
  );
}

function QuestionInsight({
  label,
  question,
  tone
}: {
  label: string;
  question: Awaited<ReturnType<typeof getTeacherResults>>["lowestQuestion"];
  tone: "priority" | "strength";
}) {
  return (
    <article className="bg-card p-5 sm:p-6">
      <p className={`text-xs font-semibold uppercase tracking-[.14em] ${tone === "priority" ? "text-amber-700" : "text-emerald-700"}`}>
        {label}
      </p>
      <div className="mt-4 flex items-start justify-between gap-5">
        <div>
          <p className="font-mono text-sm font-bold">{question?.label ?? "Sin datos"}</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed">{question?.question ?? "No hay preguntas analizadas."}</p>
        </div>
        {question ? (
          <span className="shrink-0 text-right font-mono">
            <span className="block text-3xl font-semibold tracking-tight">{formatScorePercentage(question.average)}</span>
            <span className="mt-1 block text-sm font-semibold text-muted-foreground">{formatScore(question.average)} / 4</span>
          </span>
        ) : null}
      </div>
    </article>
  );
}

function ChartSection({
  title,
  description,
  className = "",
  children
}: {
  title: string;
  description: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-xl border bg-card p-5 sm:p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}
