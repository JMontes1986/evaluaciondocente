import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ClipboardCheck,
  GraduationCap,
  Star,
  UsersRound
} from "lucide-react";
import {
  AverageBarChart,
  PerformanceScatterChart,
  QuestionAverageChart,
  ScoreDistributionChart,
  TeacherGradeHeatmap
} from "@/components/admin/dashboard-charts";
import { AiDecisionAnalysis } from "@/components/admin/ai-decision-analysis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboardData } from "@/lib/services/analytics-service";

export const metadata = { title: "Dashboard analítico" };

interface AdminDashboardPageProps {
  searchParams: Promise<{
    evaluacion?: string;
    docente?: string;
    grado?: string;
  }>;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const params = await searchParams;
  const periodId = uuidPattern.test(params.evaluacion ?? "") ? params.evaluacion : undefined;
  const teacherId = uuidPattern.test(params.docente ?? "") ? params.docente : undefined;
  const gradeId = uuidPattern.test(params.grado ?? "") ? params.grado : undefined;
  const data = await getDashboardData({ periodId, teacherId, gradeId });
  const hasFilters = Boolean(periodId || teacherId || gradeId);
  const metrics = [
    ["Evaluaciones analizadas", data.metrics.evaluations, ClipboardCheck],
    ["Estudiantes participantes", data.metrics.students, GraduationCap],
    ["Docentes evaluados", data.metrics.teachers, UsersRound],
    ["Promedio general", `${data.metrics.average} / 4`, Star]
  ] as const;

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-sm font-semibold text-primary">Inteligencia institucional</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-.035em]">Dashboard para toma de decisiones</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Analiza fortalezas y oportunidades por docente, grado y pregunta sin exponer la identidad de los estudiantes.
          </p>
        </div>
        {data.period ? <Badge>{data.period.name}</Badge> : <Badge>Sin evaluaciones configuradas</Badge>}
      </div>

      <form method="get" className="mt-6 grid gap-3 rounded-xl border bg-card p-5 md:grid-cols-2 xl:grid-cols-[1.2fr_1.2fr_1fr_auto_auto]">
        <div>
          <label htmlFor="dashboard-period" className="mb-2 block text-sm font-semibold">Evaluación semestral</label>
          <select
            id="dashboard-period"
            name="evaluacion"
            defaultValue={data.period?.id ?? ""}
            className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm"
          >
            {data.periods.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="dashboard-teacher" className="mb-2 block text-sm font-semibold">Docente</label>
          <select
            id="dashboard-teacher"
            name="docente"
            defaultValue={teacherId ?? ""}
            className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm"
          >
            <option value="">Todos los docentes</option>
            {data.teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="dashboard-grade" className="mb-2 block text-sm font-semibold">Grado</label>
          <select
            id="dashboard-grade"
            name="grado"
            defaultValue={gradeId ?? ""}
            className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm"
          >
            <option value="">Todos los grados</option>
            {data.grades.map((grade) => <option key={grade.id} value={grade.id}>{grade.name}</option>)}
          </select>
        </div>
        <Button type="submit" className="self-end">Analizar</Button>
        {hasFilters && (
          <Button asChild variant="outline" className="self-end">
            <Link href="/administracion">Limpiar</Link>
          </Button>
        )}
      </form>

      <p className="mt-3 text-xs text-muted-foreground">
        Por privacidad, los resultados segmentados se muestran desde {data.minResponses} evaluaciones.
      </p>

      <section className="mt-6 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores principales">
        {metrics.map(([label, value, Icon]) => (
          <div key={label} className="bg-card p-5">
            <Icon className="size-5 text-primary" />
            <p className="mt-5 font-mono text-2xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          title="Docente con mayor promedio"
          value={data.highestTeacher?.name}
          detail={data.highestTeacher ? `${data.highestTeacher.average} / 4 · ${data.highestTeacher.responses} evaluaciones` : undefined}
          positive
        />
        <InsightCard
          title="Docente que requiere atención"
          value={data.lowestTeacher?.name}
          detail={data.lowestTeacher ? `${data.lowestTeacher.average} / 4 · ${data.lowestTeacher.responses} evaluaciones` : undefined}
        />
        <InsightCard
          title="Pregunta mejor valorada"
          value={data.highestQuestion?.label}
          detail={data.highestQuestion ? `${data.highestQuestion.average} / 4 · ${data.highestQuestion.question}` : undefined}
          positive
        />
        <InsightCard
          title="Pregunta prioritaria"
          value={data.lowestQuestion?.label}
          detail={data.lowestQuestion ? `${data.lowestQuestion.average} / 4 · ${data.lowestQuestion.question}` : undefined}
        />
      </section>

      <AiDecisionAnalysis
        configured={Boolean(process.env.GROQ_API_KEY)}
        canAnalyze={data.metrics.evaluations >= data.minResponses && data.questionAverages.length > 0}
        periodId={data.period?.id}
        teacherId={teacherId}
        gradeId={gradeId}
      />

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <ChartSection
          title="Promedio por docente"
          description="Ordenado del resultado más alto al más bajo."
        >
          <AverageBarChart data={data.teacherAverages} ariaLabel="Promedio por docente" />
        </ChartSection>
        <ChartSection
          title="Promedio por grado"
          description="Permite comparar cómo fue evaluado el equipo docente en cada grado."
        >
          <AverageBarChart data={data.gradeAverages} ariaLabel="Promedio por grado" />
        </ChartSection>
        <ChartSection
          title="Distribución de respuestas"
          description="Proporción total entre Nunca, Algunas Veces, Casi Siempre y Siempre."
        >
          <ScoreDistributionChart data={data.distribution} />
        </ChartSection>
        <ChartSection
          title="Dispersión docente–grado"
          description="Eje horizontal: evaluaciones recibidas. Eje vertical: promedio. Cada punto representa un docente en un grado."
        >
          <PerformanceScatterChart data={data.scatter} />
        </ChartSection>
      </div>

      <ChartSection
        title="Resultado de todas las preguntas"
        description="Rojo indica prioridad, amarillo seguimiento y verde fortaleza. Pasa el cursor para leer la pregunta completa."
        className="mt-6"
      >
        <QuestionAverageChart data={data.questionAverages} />
      </ChartSection>

      <ChartSection
        title="Mapa de desempeño por docente y grado"
        description="Los colores permiten localizar rápidamente combinaciones con resultados altos o bajos."
        className="mt-6"
      >
        <TeacherGradeHeatmap data={data.heatmap} grades={data.grades} />
      </ChartSection>

      <section className="mt-6 overflow-hidden rounded-xl border bg-card">
        <div className="border-b p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <BarChart3 className="size-5 text-primary" />
            Detalle para plan de mejoramiento
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Listado ordenado de la pregunta con menor resultado a la de mayor resultado.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4">Pregunta</th>
                <th className="p-4">Criterio</th>
                <th className="p-4 text-center">Promedio</th>
                <th className="p-4 text-center">Nunca</th>
                <th className="p-4 text-center">Algunas veces</th>
                <th className="p-4 text-center">Casi siempre</th>
                <th className="p-4 text-center">Siempre</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[...data.questionAverages].sort((a, b) => a.average - b.average).map((question) => (
                <tr key={question.id}>
                  <td className="p-4 font-mono font-bold">{question.label}</td>
                  <td className="max-w-xl p-4">{question.question}</td>
                  <td className="p-4 text-center font-mono font-bold">{question.average}</td>
                  <td className="p-4 text-center">{question.never}</td>
                  <td className="p-4 text-center">{question.sometimes}</td>
                  <td className="p-4 text-center">{question.almostAlways}</td>
                  <td className="p-4 text-center">{question.always}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.questionAverages.length && (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No hay suficientes respuestas para generar el análisis.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function InsightCard({
  title,
  value,
  detail,
  positive = false
}: {
  title: string;
  value?: string;
  detail?: string;
  positive?: boolean;
}) {
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <article className="rounded-xl border bg-card p-5">
      <Icon className={`size-5 ${positive ? "text-emerald-700" : "text-amber-700"}`} />
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="mt-2 font-semibold">{value ?? "Sin datos suficientes"}</p>
      {detail && <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{detail}</p>}
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
