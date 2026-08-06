import { LockKeyhole, LockKeyholeOpen } from "lucide-react";
import { setEvaluationOpenAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";

export function EvaluationWindowButton({ id, open }: { id: string; open: boolean }) {
  const action = setEvaluationOpenAction.bind(null, id, !open);

  return (
    <form action={action}>
      <Button type="submit" variant={open ? "outline" : "default"} size="sm">
        {open ? <LockKeyhole className="size-4" /> : <LockKeyholeOpen className="size-4" />}
        {open ? "Cerrar evaluación" : "Abrir evaluación"}
      </Button>
    </form>
  );
}
