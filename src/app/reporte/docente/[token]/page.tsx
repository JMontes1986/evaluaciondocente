import { createHash } from "node:crypto";
import { notFound } from "next/navigation";
import { Brand } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { formatScore, formatScorePercentage } from "@/lib/calculations/scores";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSystemSettings } from "@/lib/services/system-settings-service";

export const dynamic="force-dynamic";
export default async function PublicTeacherReport({params}:{params:Promise<{token:string}>}){
  const{token}=await params;if(token.length<32)notFound();const hash=createHash("sha256").update(token).digest("hex"),admin=createAdminClient();
  const{data:link}=await admin.from("report_links").select("teacher_id,evaluation_period_id,expires_at,revoked_at").eq("token_hash",hash).is("revoked_at",null).maybeSingle();
  if(!link||(link.expires_at&&new Date(link.expires_at)<new Date()))notFound();
  const settings=await getSystemSettings();
  const[{data:teacher},{data:period},{data:report}]=await Promise.all([admin.from("teachers").select("full_name").eq("id",link.teacher_id).single(),admin.from("evaluation_periods").select("name").eq("id",link.evaluation_period_id).single(),admin.rpc("get_teacher_report",{p_teacher_id:link.teacher_id,p_period_id:link.evaluation_period_id,p_min_responses:settings.minResponses})]);
  const available=report?.available===true;return <main className="min-h-[100dvh] bg-background"><header className="border-b bg-card"><div className="mx-auto max-w-5xl px-4 py-5"><Brand/></div></header><div className="mx-auto max-w-5xl px-4 py-10"><p className="text-xs font-bold uppercase tracking-[.18em] text-primary/70">Colegio Franciscano Agustín Gemelli</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Evaluación docente</h1><div className="mt-5 flex flex-wrap gap-2"><Badge>{teacher?.full_name}</Badge><Badge>{period?.name}</Badge></div>{!available?<div className="mt-10 rounded-xl border border-dashed p-10 text-center"><h2 className="font-semibold">Aún no existe una cantidad suficiente de respuestas para generar resultados agregados.</h2><p className="mt-2 text-sm text-muted-foreground">Este criterio protege la confidencialidad de los estudiantes.</p></div>:<div className="mt-10 grid gap-5 md:grid-cols-2"><div className="rounded-xl border bg-card p-6"><p className="text-sm text-muted-foreground">Número de evaluaciones</p><p className="mt-2 font-mono text-3xl font-semibold">{String(report.response_count)}</p></div><div className="rounded-xl border bg-card p-6"><p className="text-sm text-muted-foreground">Promedio general</p><p className="mt-2 font-mono text-3xl font-semibold">{formatScore(Number(report.average))} / 4</p><p className="mt-1 font-mono text-sm font-semibold text-primary">{formatScorePercentage(Number(report.average))}</p></div></div>}<p className="mt-10 text-xs leading-relaxed text-muted-foreground">Este informe contiene resultados agregados. No incluye nombres, códigos, identificadores ni datos personales de estudiantes.</p></div></main>
}
