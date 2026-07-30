"use client";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import { submitEvaluationAction } from "@/actions/evaluation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Question { id: string; text: string; category: string | null; order_number: number }
const options = [
  { score: 4, label: "Siempre" }, { score: 3, label: "Casi Siempre" },
  { score: 2, label: "Algunas Veces" }, { score: 1, label: "Nunca" }
] as const;

export function EvaluationForm({ questions, teacherId, assignmentId, periodId, allowFeedback }: { questions: Question[]; teacherId: string; assignmentId: string; periodId: string; allowFeedback: boolean }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(submitEvaluationAction, {});
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const answered = Object.keys(answers).length;
  const progress = questions.length ? (answered / questions.length) * 100 : 0;
  const payload = useMemo(() => questions.filter((q) => answers[q.id]).map((q) => ({ questionId: q.id, score: answers[q.id] })), [answers, questions]);

  useEffect(() => {
    if (!state.success) return;
    const timer = window.setTimeout(() => router.push("/evaluacion?success=1"), 1300);
    return () => window.clearTimeout(timer);
  }, [state.success, router]);

  if (state.success) return <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center text-emerald-900">
    <CheckCircle2 className="mx-auto size-10" /><h2 className="mt-4 text-xl font-semibold">¡Gracias por tu participación!</h2><p className="mt-2 text-sm">Tu evaluación fue guardada correctamente.</p>
  </div>;

  return <form action={action} className="space-y-6">
    <input type="hidden" name="teacherId" value={teacherId} />
    <input type="hidden" name="assignmentId" value={assignmentId} />
    <input type="hidden" name="periodId" value={periodId} />
    <input type="hidden" name="answers" value={JSON.stringify(payload)} />
    <div className="sticky top-0 z-10 -mx-4 border-b bg-background/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
      <div className="mb-2 flex justify-between text-sm"><span className="font-semibold">{answered} de {questions.length} respondidas</span><span className="text-muted-foreground">{Math.round(progress)}%</span></div>
      <Progress value={progress} label="Progreso de preguntas" />
    </div>
    <div className="rounded-xl border bg-secondary/40 p-4 text-sm">
      <p className="font-semibold">Escala de valoración</p>
      <p className="mt-1 text-muted-foreground">4 - Siempre · 3 - Casi Siempre · 2 - Algunas Veces · 1 - Nunca</p>
    </div>
    {questions.map((question, index) => <fieldset key={question.id} className="rounded-xl border bg-card p-5 shadow-[0_14px_35px_-30px_oklch(0.2_0.06_250/.45)] sm:p-6">
      <legend className="sr-only">Pregunta {index + 1}</legend>
      <div className="flex items-start gap-4">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary font-mono text-xs font-bold text-primary">{index + 1}</span>
        <div><p className="text-xs font-semibold uppercase tracking-[.13em] text-muted-foreground">{question.category ?? "Criterio"}</p><p className="mt-1 font-semibold leading-relaxed">{question.text}</p></div>
      </div>
      <RadioGroup.Root className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" value={answers[question.id]?.toString()} onValueChange={(value) => setAnswers((current) => ({ ...current, [question.id]: Number(value) }))}>
        {options.map((option) => <label key={option.score} className={cn("flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors", answers[question.id] === option.score ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-secondary")}>
          <RadioGroup.Item value={option.score.toString()} className="grid size-5 place-items-center rounded-full border border-current">
            <RadioGroup.Indicator className="size-2.5 rounded-full bg-current" />
          </RadioGroup.Item>
          <span className="font-mono font-bold">{option.score}</span> {option.label}
        </label>)}
      </RadioGroup.Root>
    </fieldset>)}
    {allowFeedback && <div className="space-y-2 rounded-xl border bg-card p-5 sm:p-6">
      <label htmlFor="feedback" className="font-semibold">Comentarios adicionales <span className="font-normal text-muted-foreground">(opcional)</span></label>
      <p className="text-sm text-muted-foreground">No incluyas nombres ni información personal.</p>
      <Textarea id="feedback" name="feedback" maxLength={2000} placeholder="¿Deseas compartir alguna observación que ayude a mejorar la experiencia de aprendizaje?" />
    </div>}
    {state.error && <p role="alert" className="flex gap-2 rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" />{state.error}</p>}
    <Button type="submit" size="lg" disabled={answered !== questions.length || pending} className="w-full sm:w-auto">
      <Send className="size-4" /> {pending ? "Enviando…" : "Enviar evaluación"}
    </Button>
  </form>;
}
