import { Brand } from "@/components/brand";
import { RecoveredPasswordForm } from "@/components/recovered-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Actualizar contraseña" };

export default function UpdatePasswordPage() {
  return <main className="grid min-h-[100dvh] place-items-center px-4"><div className="w-full max-w-md"><div className="mb-7"><Brand /></div><Card><CardHeader><CardTitle>Actualizar contraseña</CardTitle><CardDescription>Define una nueva contraseña para tu cuenta institucional.</CardDescription></CardHeader><CardContent><RecoveredPasswordForm /></CardContent></Card></div></main>;
}
