"use client";
import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { studentLoginAction } from "@/actions/student";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Input } from "@/components/ui/input";

export function StudentLoginForm() {
  const [state, action] = useActionState(studentLoginAction, {});
  return <form action={action} className="space-y-5">
    <div className="space-y-2">
      <label htmlFor="code" className="text-sm font-semibold">Código del estudiante</label>
      <Input id="code" name="code" inputMode="text" autoComplete="off" maxLength={40} required placeholder="Ejemplo: 5540" className="font-mono text-lg tracking-wider" />
      <p className="text-xs leading-relaxed text-muted-foreground">El código se valida de forma segura y no se almacena en este dispositivo.</p>
    </div>
    {state.error && <p role="alert" className="flex gap-2 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" />{state.error}</p>}
    <FormSubmitButton pendingLabel="Validando…">Continuar</FormSubmitButton>
  </form>;
}
