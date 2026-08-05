import { Bot, CheckCircle2, Clock3, Save, ShieldCheck } from "lucide-react";
import { getRestrictedUsers } from "@/actions/user-access";
import { updateSystemSettingsAction } from "@/actions/system-settings";
import { PageHeading } from "@/components/admin/page-heading";
import { UserAccessManager } from "@/components/admin/user-access-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_GROQ_MODEL } from "@/lib/ai/groq-models";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { getSystemSettings } from "@/lib/services/system-settings-service";

interface SettingsPageProps {
  searchParams: Promise<{ guardado?: string; error?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  await requireSuperAdmin();
  const [settings, status, restrictedUsers] = await Promise.all([
    getSystemSettings(),
    searchParams,
    getRestrictedUsers()
  ]);
  const aiConfigured = Boolean(process.env.GROQ_API_KEY);
  const aiModel = process.env.GROQ_MODEL ?? DEFAULT_GROQ_MODEL;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeading
        eyebrow="Sistema"
        title="Configuración"
        description="Administra los parámetros operativos, la confidencialidad y el acceso por módulos."
      />

      {status.guardado === "1" ? (
        <div role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="size-5" />La configuración fue guardada correctamente.
        </div>
      ) : null}
      {status.error ? (
        <div role="alert" className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {status.error === "validation"
            ? "Revisa los valores ingresados y vuelve a intentar."
            : "No fue posible guardar la configuración."}
        </div>
      ) : null}

      <form action={updateSystemSettingsAction} className="rounded-xl border bg-card">
        <div className="border-b p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="size-5 text-primary" />Privacidad de resultados
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Define cuántas evaluaciones se requieren antes de mostrar resultados segmentados.
          </p>
          <div className="mt-5 max-w-sm">
            <label htmlFor="min-responses" className="mb-2 block text-sm font-semibold">Mínimo de respuestas</label>
            <Input id="min-responses" name="minResponses" type="number" min={3} max={50} required defaultValue={settings.minResponses} />
            <p className="mt-2 text-xs text-muted-foreground">Permitido: entre 3 y 50 respuestas.</p>
          </div>
        </div>

        <div className="border-b p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Clock3 className="size-5 text-primary" />Sesión de estudiantes
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tiempo durante el cual un estudiante puede permanecer autenticado antes de ingresar nuevamente su código.
          </p>
          <div className="mt-5 max-w-sm">
            <label htmlFor="session-minutes" className="mb-2 block text-sm font-semibold">Duración en minutos</label>
            <Input id="session-minutes" name="studentSessionMinutes" type="number" min={15} max={1440} required defaultValue={settings.studentSessionMinutes} />
            <p className="mt-2 text-xs text-muted-foreground">Permitido: entre 15 minutos y 24 horas.</p>
          </div>
        </div>

        <div className="border-b p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Bot className="size-5 text-primary" />Integración de inteligencia artificial con Groq
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                La credencial se administra como secreto en Vercel y nunca se guarda ni se muestra en esta página.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{aiConfigured ? "Credencial configurada" : "Sin credencial"}</Badge>
              <Badge>{aiModel}</Badge>
            </div>
          </div>
          {!aiConfigured ? (
            <p className="mt-4 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-950">
              Para habilitar el análisis asistido del dashboard, configura GROQ_API_KEY en Vercel.
            </p>
          ) : null}
        </div>

        <div className="flex justify-end p-5 sm:p-6">
          <Button type="submit" size="lg"><Save className="size-4" />Guardar configuración</Button>
        </div>
      </form>

      <UserAccessManager users={restrictedUsers} />
    </div>
  );
}
