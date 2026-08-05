"use client";
import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { loginAction } from "@/actions/auth";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, {});
  return <form action={action} className="space-y-5">
    <div className="space-y-2">
      <label htmlFor="email" className="text-sm font-semibold">Correo electrónico</label>
      <Input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="nombre@colgemelli.edu.co"
        pattern="[^@\\s]+@colgemelli\\.edu\\.co"
        title="Usa un correo del dominio @colgemelli.edu.co"
      />
    </div>
    <div className="space-y-2">
      <label htmlFor="password" className="text-sm font-semibold">Contraseña</label>
      <Input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} />
    </div>
    {state.error && <p role="alert" className="flex gap-2 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" />{state.error}</p>}
    <FormSubmitButton pendingLabel="Ingresando…">Iniciar sesión</FormSubmitButton>
  </form>;
}
