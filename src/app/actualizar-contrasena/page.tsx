import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { RecoveredPasswordForm } from "@/components/recovered-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { studentSessionSecret } from "@/lib/env";
import { PASSWORD_RECOVERY_COOKIE, verifyPasswordRecoveryMarker } from "@/lib/security/password-recovery";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Actualizar contraseña" };

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const [{ data: { user } }, cookieStore] = await Promise.all([supabase.auth.getUser(), cookies()]);
  const marker = cookieStore.get(PASSWORD_RECOVERY_COOKIE)?.value;
  if (!user || !verifyPasswordRecoveryMarker(marker, user.id, studentSessionSecret())) {
    redirect("/recuperar-contrasena?error=enlace-invalido");
  }
  return <main className="grid min-h-[100dvh] place-items-center px-4"><div className="w-full max-w-md"><div className="mb-7"><Brand /></div><Card><CardHeader><CardTitle>Actualizar contraseña</CardTitle><CardDescription>Define una nueva contraseña para tu cuenta institucional.</CardDescription></CardHeader><CardContent><RecoveredPasswordForm /></CardContent></Card></div></main>;
}
