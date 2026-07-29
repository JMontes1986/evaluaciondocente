import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { EvaluationForm } from "@/components/evaluation-form";
import { Badge } from "@/components/ui/badge";
import { getStudentSession } from "@/lib/security/student-session";
import { getEvaluationFormContext } from "@/lib/services/student-service";

export default async function TeacherEvaluationPage({ params }: { params: Promise<{ teacherId: string }> }) {
  const session = await getStudentSession();
  if (!session) redirect("/estudiante?expired=1");
  const { teacherId } = await params;
  const context = await getEvaluationFormContext(session.student_id, teacherId);
  if (!context) notFound();
  return <main className="min-h-[100dvh] bg-background">
    <header className="border-b bg-card"><div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6"><Brand /><Link href="/evaluacion" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Volver</Link></div></header>
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8"><p className="text-xs font-bold uppercase tracking-[.18em] text-primary/70">Evaluación confidencial</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.035em]">{context.teacher.teacherName}</h1><div className="mt-3 flex flex-wrap gap-2"><Badge>{context.teacher.subjectName}</Badge><Badge><GraduationCap className="mr-1.5 size-3.5" />{context.gradeName}</Badge></div><p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">Evalúa cada criterio con sinceridad. Tus respuestas son confidenciales y se presentan únicamente de forma agregada.</p></div>
      <EvaluationForm questions={context.questions} teacherId={context.teacher.teacherId} assignmentId={context.teacher.assignmentId} periodId={context.period.id} allowFeedback={context.period.allow_feedback} />
    </div>
  </main>;
}
