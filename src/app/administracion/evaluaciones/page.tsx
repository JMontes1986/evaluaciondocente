import { PageHeading } from "@/components/admin/page-heading";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function EvaluationAdminPage() {
  const admin=createAdminClient(); const {data:rows}=await admin.from("evaluations").select("id,teacher_id,grade_id,evaluation_period_id,submitted_at").order("submitted_at",{ascending:false}).limit(250);
  const teacherIds=[...new Set((rows??[]).map(x=>x.teacher_id))],gradeIds=[...new Set((rows??[]).map(x=>x.grade_id))],periodIds=[...new Set((rows??[]).map(x=>x.evaluation_period_id))];
  const [{data:teachers},{data:grades},{data:periods}]=await Promise.all([
    teacherIds.length?admin.from("teachers").select("id,full_name").in("id",teacherIds):Promise.resolve({data:[]}),
    gradeIds.length?admin.from("grades").select("id,name").in("id",gradeIds):Promise.resolve({data:[]}),
    periodIds.length?admin.from("evaluation_periods").select("id,name").in("id",periodIds):Promise.resolve({data:[]})
  ]);
  const tm=new Map((teachers??[]).map(x=>[x.id,x.full_name])),gm=new Map((grades??[]).map(x=>[x.id,x.name])),pm=new Map((periods??[]).map(x=>[x.id,x.name]));
  return <div className="mx-auto max-w-[1400px]"><PageHeading eyebrow="Seguimiento" title="Evaluaciones" description="Registro de envíos sin exponer la identidad del estudiante en la interfaz analítica."/><div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[760px] text-sm"><thead className="border-b bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-4">Docente</th><th className="p-4">Grado</th><th className="p-4">Periodo</th><th className="p-4">Fecha</th></tr></thead><tbody className="divide-y">{rows?.map(x=><tr key={x.id}><td className="p-4 font-medium">{tm.get(x.teacher_id)}</td><td className="p-4">{gm.get(x.grade_id)}</td><td className="p-4">{pm.get(x.evaluation_period_id)}</td><td className="p-4 text-muted-foreground">{new Intl.DateTimeFormat("es-CO",{dateStyle:"medium",timeStyle:"short"}).format(new Date(x.submitted_at))}</td></tr>)}</tbody></table>{!rows?.length&&<p className="p-10 text-center text-sm text-muted-foreground">Aún no hay evaluaciones registradas.</p>}</div></div>;
}
