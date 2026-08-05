"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { changePasswordAction } from "@/actions/auth";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Input } from "@/components/ui/input";

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePasswordAction, {});

  return (
    <form action={action} className="space-y-5">
      <PasswordField id="current-password" name="currentPassword" label="Contraseña actual" autoComplete="current-password" minLength={8} />
      <PasswordField id="new-password" name="newPassword" label="Nueva contraseña" autoComplete="new-password" minLength={12} />
      <PasswordField id="confirm-password" name="confirmPassword" label="Confirmar nueva contraseña" autoComplete="new-password" minLength={12} />

      <p className="text-xs leading-relaxed text-muted-foreground">
        Debe tener al menos 12 caracteres e incluir una letra mayúscula, una minúscula y un número.
      </p>
      {state.error ? (
        <p role="alert" className="flex gap-2 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />{state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="flex gap-2 rounded-lg border border-emerald-700/20 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />{state.success}
        </p>
      ) : null}
      <FormSubmitButton pendingLabel="Actualizando…">Cambiar contraseña</FormSubmitButton>
    </form>
  );
}

function PasswordField({ id, name, label, autoComplete, minLength }: { id: string; name: string; label: string; autoComplete: string; minLength: number }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      <Input id={id} name={name} type="password" required minLength={minLength} maxLength={128} autoComplete={autoComplete} />
    </div>
  );
}
