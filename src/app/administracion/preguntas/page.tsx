import { createQuestionAction } from "@/actions/admin";
import { PageHeading } from "@/components/admin/page-heading";
import { StatusButton } from "@/components/admin/status-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireModule } from "@/lib/auth/permissions";

interface QuestionsPageProps {
  searchParams: Promise<{ estado?: string }>;
}

export default async function QuestionsPage({ searchParams }: QuestionsPageProps) {
  await requireModule("preguntas");
  const { estado } = await searchParams;
  const status = estado === "activas" || estado === "inactivas" ? estado : "todas";
  const admin = createAdminClient();
  let questionsQuery = admin
    .from("evaluation_questions")
    .select("id,text,category,order_number,active")
    .order("order_number");

  if (status === "activas") questionsQuery = questionsQuery.eq("active", true);
  if (status === "inactivas") questionsQuery = questionsQuery.eq("active", false);

  const { data: questions } = await questionsQuery;

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeading
        eyebrow="Instrumento de evaluación"
        title="Preguntas"
        description="Las preguntas con respuestas se conservan y pueden desactivarse sin perder el histórico."
      />

      <form
        action={createQuestionAction}
        className="mb-5 grid gap-3 rounded-xl border bg-card p-5 lg:grid-cols-[2fr_1fr_.4fr_auto]"
      >
        <Input name="text" required placeholder="Texto de la pregunta" aria-label="Pregunta" />
        <Input name="category" placeholder="Categoría" aria-label="Categoría" />
        <Input name="orderNumber" type="number" min="1" required placeholder="Orden" aria-label="Orden" />
        <Button type="submit">Agregar</Button>
      </form>

      <form method="get" className="mb-5 flex flex-col gap-3 rounded-xl border bg-card p-5 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="question-status" className="mb-2 block text-sm font-semibold">
            Filtrar por estado
          </label>
          <select
            id="question-status"
            name="estado"
            defaultValue={status}
            className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm"
          >
            <option value="todas">Todas las preguntas</option>
            <option value="activas">Preguntas activas</option>
            <option value="inactivas">Preguntas inactivas</option>
          </select>
        </div>
        <Button type="submit">Aplicar filtro</Button>
      </form>

      <div className="divide-y rounded-xl border bg-card">
        <div className="px-5 py-3 text-sm text-muted-foreground">
          {questions?.length ?? 0} {(questions?.length ?? 0) === 1 ? "pregunta encontrada" : "preguntas encontradas"}
        </div>
        {questions?.map((question) => (
          <div key={question.id} className="grid gap-3 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
            <span className="grid size-8 place-items-center rounded-full bg-secondary font-mono text-xs font-bold">
              {question.order_number}
            </span>
            <div>
              <p className="font-medium">{question.text}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {question.category ?? "Sin categoría"} · <Badge>{question.active ? "Activa" : "Inactiva"}</Badge>
              </p>
            </div>
            <StatusButton table="evaluation_questions" id={question.id} active={question.active} />
          </div>
        ))}
        {!questions?.length && (
          <p className="p-10 text-center text-sm text-muted-foreground">
            No hay preguntas que coincidan con el filtro seleccionado.
          </p>
        )}
      </div>
    </div>
  );
}
