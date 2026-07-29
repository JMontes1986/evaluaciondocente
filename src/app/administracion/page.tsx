import { Activity, ClipboardCheck, GraduationCap, Percent, Star } from "lucide-react";
import { TeacherAverageChart } from "@/components/admin/dashboard-charts";
import { Badge } from "@/components/ui/badge";
import { getDashboardData } from "@/lib/services/analytics-service";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const { period, stats, teacherAverages } = await getDashboardData();
  const metrics = [
    ["Estudiantes habilitados", stats.students ?? 0, GraduationCap],
    ["Evaluaciones realizadas", stats.evaluations ?? 0, ClipboardCheck],
    ["Participación", `${stats.participation_percent ?? 0}%`, Percent],
    ["Progreso total", `${stats.completion_percent ?? 0}%`, Activity],
    ["Promedio institucional", `${stats.average_score ?? 0} / 4`, Star]
  ] as const;
  return <div className="mx-auto max-w-[1400px]">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6"><div><p className="text-sm font-semibold text-primary">Vista institucional</p><h1 className="mt-1 text-3xl font-semibold tracking-[-.035em]">Dashboard general</h1></div>{period ? <Badge>Periodo: {period.name}</Badge> : <Badge>Sin periodo activo</Badge>}</div>
    <section className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 xl:grid-cols-5" aria-label="Indicadores principales">{metrics.map(([label,value,Icon]) => <div key={label} className="bg-card p-5"><Icon className="size-5 text-primary" /><p className="mt-5 font-mono text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p></div>)}</section>
    <section className="mt-8 rounded-xl border bg-card p-5 sm:p-6"><div className="mb-6"><h2 className="text-lg font-semibold">Promedio general por docente</h2><p className="mt-1 text-sm text-muted-foreground">Escala institucional de 1 a 4.</p></div><TeacherAverageChart data={teacherAverages} /></section>
  </div>;
}
