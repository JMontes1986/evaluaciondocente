import { PageHeading } from "@/components/admin/page-heading";
import { Badge } from "@/components/ui/badge";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import {
  getSecurityMeasures,
  SECURITY_CATEGORIES,
  SECURITY_STATUS_LABELS,
  type SecurityMeasureStatus
} from "@/lib/security/security-measures";
import { cn } from "@/lib/utils";

export const metadata = { title: "Medidas de seguridad" };

const statusStyles: Record<SecurityMeasureStatus, string> = {
  active: "border-emerald-700/20 bg-emerald-700/10 text-emerald-800",
  partial: "border-amber-700/20 bg-amber-700/10 text-amber-900",
  verify: "border-sky-700/20 bg-sky-700/10 text-sky-900",
  pending: "border-red-700/20 bg-red-700/10 text-red-800"
};

const statusDotStyles: Record<SecurityMeasureStatus, string> = {
  active: "bg-emerald-600",
  partial: "bg-amber-500",
  verify: "bg-sky-600",
  pending: "bg-red-600"
};

export default async function SecurityMeasuresPage() {
  await requireSuperAdmin();
  const measures = getSecurityMeasures({ groqConfigured: Boolean(process.env.GROQ_API_KEY) });
  const counts = Object.fromEntries(
    (Object.keys(SECURITY_STATUS_LABELS) as SecurityMeasureStatus[]).map((status) => [
      status,
      measures.filter((measure) => measure.status === status).length
    ])
  ) as Record<SecurityMeasureStatus, number>;
  const attentionCount = counts.partial + counts.verify + counts.pending;

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeading
        eyebrow="Solo SUPER_ADMIN"
        title="Medidas de seguridad"
        description="Inventario operativo de controles implementados y asuntos que todavía requieren validación o cierre. Los estados reflejan evidencia disponible en la aplicación, no sustituyen una auditoría externa."
      />

      <section className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 xl:grid-cols-[1.25fr_repeat(4,1fr)]" aria-label="Resumen de seguridad">
        <div className="bg-[#102a4b] p-5 text-white sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-white/60">Cobertura documentada</p>
          <p className="mt-4 font-mono text-4xl font-semibold tracking-tight">{measures.length}</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/68">Controles y tareas operativas inventariadas en seis áreas.</p>
        </div>
        {(Object.keys(SECURITY_STATUS_LABELS) as SecurityMeasureStatus[]).map((status) => (
          <div key={status} className="border-t bg-card p-5 sm:border-t-0 sm:p-6">
            <div className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", statusDotStyles[status])} aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{SECURITY_STATUS_LABELS[status]}</p>
            </div>
            <p className="mt-5 font-mono text-3xl font-semibold">{counts[status]}</p>
          </div>
        ))}
      </section>

      {attentionCount > 0 ? (
        <div className="mt-5 border-l-4 border-amber-500 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="font-semibold">Hay {attentionCount} medidas que requieren seguimiento.</p>
          <p className="mt-1 leading-relaxed">Prioriza las marcadas como Pendiente y luego confirma las configuraciones externas indicadas como Por verificar.</p>
        </div>
      ) : null}

      <div className="mt-8 space-y-10">
        {SECURITY_CATEGORIES.map((category, categoryIndex) => {
          const categoryMeasures = measures.filter((measure) => measure.category === category);
          const categoryId = `security-category-${categoryIndex + 1}`;
          return (
            <section key={category} aria-labelledby={categoryId}>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.15em] text-primary">Área de control</p>
                  <h2 id={categoryId} className="mt-1 text-xl font-semibold tracking-tight">{category}</h2>
                </div>
                <p className="font-mono text-xs text-muted-foreground">{categoryMeasures.length} medidas</p>
              </div>

              <div className="divide-y rounded-xl border bg-card">
                {categoryMeasures.map((measure) => (
                  <article key={measure.id} className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_180px] md:p-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-semibold">{measure.title}</h3>
                        <Badge className={statusStyles[measure.status]}>{SECURITY_STATUS_LABELS[measure.status]}</Badge>
                      </div>
                      <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">{measure.description}</p>
                      {measure.nextStep ? (
                        <p className="mt-3 border-l-2 border-primary/35 pl-3 text-sm leading-relaxed">
                          <span className="font-semibold">Siguiente acción:</span> {measure.nextStep}
                        </p>
                      ) : null}
                    </div>
                    <div className="md:border-l md:pl-5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Evidencia</p>
                      <p className="mt-2 text-xs leading-relaxed text-foreground/75">{measure.evidence}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
