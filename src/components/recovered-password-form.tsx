"use client";
import { useActionState } from "react";
import { updateRecoveredPasswordAction } from "@/actions/auth";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Input } from "@/components/ui/input";

export function RecoveredPasswordForm() {
  const [state, action] = useActionState(updateRecoveredPasswordAction, {});
  return <form action={action} className="space-y-4">
    <div className="space-y-2"><label htmlFor="newPassword" className="text-sm font-semibold">Nueva contraseña</label><Input id="newPassword" name="newPassword" type="password" minLength={12} required autoComplete="new-password" /></div>
    <div className="space-y-2"><label htmlFor="confirmPassword" className="text-sm font-semibold">Confirmar contraseña</label><Input id="confirmPassword" name="confirmPassword" type="password" minLength={12} required autoComplete="new-password" /></div>
    {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    {state.success && <p className="text-sm text-emerald-700">{state.success}</p>}
    <FormSubmitButton>Actualizar contraseña</FormSubmitButton>
  </form>;
}
