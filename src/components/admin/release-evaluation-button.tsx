"use client";

import { releaseStudentEvaluationAction } from "@/actions/evaluation-monitoring";
import { Button } from "@/components/ui/button";

export function ReleaseEvaluationButton({
  evaluationId,
  teacherName
}: {
  evaluationId: string;
  teacherName: string;
}) {
  return (
    <form
      action={releaseStudentEvaluationAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `¿Liberar la evaluación de ${teacherName}? Se eliminarán sus respuestas y el estudiante deberá realizarla nuevamente.`
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="evaluationId" value={evaluationId} />
      <Button type="submit" variant="outline" size="sm">Liberar encuesta</Button>
    </form>
  );
}
