import { createQuestionAction } from "@/actions/admin";
import { PageHeading } from "@/components/admin/page-heading";
import { StatusButton } from "@/components/admin/status-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function QuestionsPage() {
  const { data: questions } = await createAdminClient().from("evaluation_questions").select("id,text,category,order_number,active").order("order_number");
  return <div className="mx-auto max-w-[1400px]"><PageHeading eyebrow="Instrumento de evaluación" title="Preguntas" description="Las preguntas con respuestas se conservan y pueden desactivarse sin perder el histórico." />
    <form action={createQuestionAction} className="mb-7 grid gap-3 rounded-xl border bg-card p-5 lg:grid-cols-[2fr_1fr_.4fr_auto]"><Input name="text" required placeholder="Texto de la pregunta" aria-label="Pregunta"/><Input name="category" placeholder="Categoría" aria-label="Categoría"/><Input name="orderNumber" type="number" min="1" required placeholder="Orden" aria-label="Orden"/><Button type="submit">Agregar</Button></form>
    <div className="divide-y rounded-xl border bg-card">{questions?.map(q=><div key={q.id} className="grid gap-3 p-5 md:grid-cols-[auto_1fr_auto] md:items-center"><span className="grid size-8 place-items-center rounded-full bg-secondary font-mono text-xs font-bold">{q.order_number}</span><div><p className="font-medium">{q.text}</p><p className="mt-1 text-xs text-muted-foreground">{q.category ?? "Sin categoría"} · <Badge>{q.active?"Activa":"Inactiva"}</Badge></p></div><StatusButton table="evaluation_questions" id={q.id} active={q.active}/></div>)}{!questions?.length&&<p className="p-10 text-center text-sm text-muted-foreground">No hay preguntas configuradas.</p>}</div>
  </div>;
}
