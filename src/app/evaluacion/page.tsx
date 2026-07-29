import Link from "next/link";
import { CheckCircle2, ChevronRight, GraduationCap, LogOut, PartyPopper } from "lucide-react";
import { redirect } from "next/navigation";
import { studentLogoutAction } from "@/actions/student";
import { Brand } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getStudentSession } from "@/lib/security/student-session";
import { getStudentEvaluationContext } from "@/lib/services/student-service";
import { firstName } from "@/lib/utils";

export const metadata = { title: "Mis evaluaciones" };

export default async function EvaluationsPage() {
  const session = await getStudentSession();
  if (!session) redirect("/estudiante?expired=1");
  const context = await getStudentEvaluationContext(session.student_id);
  if (!context) redirect("/estudiante");
  const total = context.pending.length + context.completed.length;
  const progress = total ? context.completed.length / total * 100 : 0;
  return <main className="min-h-[100dvh] bg-background">
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6"><Brand /><form action={studentLogoutAction}><Button variant="ghost" size="sm"><LogOut className="size-4" /> Salir</Button></form></div>
    </header>
    <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-12">
      <div className="grid gap-7 border-b pb-8 md:grid-cols-[1fr_auto] md:items-end">
        <div><p className="text-sm font-semibold text-primary">Hola, {firstName(context.student.full_name)}</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.035em] sm:text-4xl">Tus evaluaciones docentes</h1><div className="mt-4 flex flex-wrap gap-2"><Badge><GraduationCap className="mr-1.5 size-3.5" />Grado {context.gradeName}</Badge>{context.period && <Badge>{context.period.name}</Badge>}</div></div>
        <div className="w-full min-w-64 md:w-72"><div className="mb-2 flex justify-between text-sm"><span className="font-semibold">{context.completed.length} de {total} docentes</span><span className="text-muted-foreground">{Math.round(progress)}%</span></div><Progress value={progress} label="Progreso de evaluaciones" /></div>
      </div>
      {!context.period ? <Empty title="Actualmente no existe un periodo de evaluación activo." /> :
      context.pending.length === 0 ? <Empty title="Has completado todas tus evaluaciones." completed /> :
      <section className="py-9"><h2 className="text-xl font-semibold tracking-tight">Docentes pendientes</h2><div className="mt-5 divide-y rounded-xl border bg-card">{context.pending.map((teacher) => <div key={teacher.teacherId} className="grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <div className="grid size-12 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">{teacher.teacherName.split(" ").slice(0,2).map((n)=>n[0]).join("")}</div>
        <div><h3 className="font-semibold">{teacher.teacherName}</h3><p className="text-sm text-muted-foreground">{teacher.subjectName}</p></div>
        <Button asChild><Link href={`/evaluacion/${teacher.teacherId}`}>Evaluar <ChevronRight className="size-4" /></Link></Button>
      </div>)}</div></section>}
      {context.completed.length > 0 && <section className="pb-10"><h2 className="text-lg font-semibold">Evaluaciones realizadas</h2><div className="mt-4 divide-y rounded-xl border bg-card">{context.completed.map((teacher) => <div key={teacher.teacherId} className="flex items-center justify-between gap-4 p-4"><div><p className="font-medium">{teacher.teacherName}</p><p className="text-sm text-muted-foreground">{teacher.subjectName}</p></div><span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700"><CheckCircle2 className="size-4" /> Completado</span></div>)}</div></section>}
    </div>
  </main>;
}

function Empty({ title, completed = false }: { title: string; completed?: boolean }) {
  const Icon = completed ? PartyPopper : GraduationCap;
  return <div className="my-10 rounded-xl border border-dashed bg-card p-10 text-center"><Icon className="mx-auto size-9 text-primary" /><h2 className="mt-4 text-lg font-semibold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{completed ? "Gracias por aportar al mejoramiento continuo de nuestro colegio." : "Vuelve a consultar cuando el colegio habilite un nuevo periodo."}</p></div>;
}
