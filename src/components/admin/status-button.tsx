import { toggleActiveAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";

type Table = "teachers" | "students" | "grades" | "subjects" | "teacher_assignments" | "evaluation_questions" | "evaluation_periods";
export function StatusButton({ table, id, active }: { table: Table; id: string; active: boolean }) {
  const action = toggleActiveAction.bind(null, table, id, !active);
  return <form action={action}><Button type="submit" variant="ghost" size="sm">{active ? "Desactivar" : "Activar"}</Button></form>;
}
