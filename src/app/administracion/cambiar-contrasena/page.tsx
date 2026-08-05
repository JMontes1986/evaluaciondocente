import { KeyRound, ShieldCheck } from "lucide-react";
import { ChangePasswordForm } from "@/components/change-password-form";
import { PageHeading } from "@/components/admin/page-heading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Cambiar contraseña" };

export default function ChangePasswordPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading eyebrow="Seguridad de la cuenta" title="Cambiar contraseña" description="Actualiza tu clave de acceso institucional de forma segura." />
      <div className="grid gap-5 md:grid-cols-[1fr_.72fr]">
        <Card>
          <CardHeader>
            <KeyRound className="mb-3 size-7 text-primary" />
            <CardTitle>Nueva contraseña</CardTitle>
            <CardDescription>Para confirmar tu identidad, escribe primero la contraseña que utilizas actualmente.</CardDescription>
          </CardHeader>
          <CardContent><ChangePasswordForm /></CardContent>
        </Card>
        <aside className="rounded-xl border bg-secondary/45 p-6">
          <ShieldCheck className="size-7 text-primary" />
          <h2 className="mt-5 font-semibold">Recomendaciones</h2>
          <ul className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>No reutilices una contraseña de otra plataforma.</li>
            <li>Evita nombres, fechas y datos fáciles de adivinar.</li>
            <li>No compartas tu contraseña por correo o mensajería.</li>
            <li>Cierra sesión en computadores compartidos.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
