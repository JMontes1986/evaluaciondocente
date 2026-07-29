import { PageHeading } from "@/components/admin/page-heading";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AssignmentsPage() {
  const admin=createAdminClient();
  const [{data:rows},{data:teachers},{data:grades},{data:subjects},{data:years}]=await Promise.all([
    admin.from("teacher_assignments").select("id,teacher_id,grade_id,subject_id,academic_year_id,active").order("created_at",{ascending:false}),
    admin.from("teachers").select("id,full_name"),admin.from("grades").select("id,name"),admin.from("subjects").select("id,name"),admin.from("academic_years").select("id,name")
  ]);
  const map=<T extends {id:string}>(values:T[]|null|undefined,key:(v:T)=>string)=>new Map((values??[]).map(v=>[v.id,key(v)]));
  const tm=map(teachers,x=>x.full_name),gm=map(grades,x=>x.name),sm=map(subjects,x=>x.name),ym=map(years,x=>x.name);
  return <div className="mx-auto max-w-[1400px]"><PageHeading eyebrow="Relaciones académicas" title="Asignaciones" description="Relación docente, asignatura, grado y año académico."/><div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[760px] text-sm"><thead className="border-b bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-4">Docente</th><th className="p-4">Asignatura</th><th className="p-4">Grado</th><th className="p-4">Año</th><th className="p-4">Estado</th></tr></thead><tbody className="divide-y">{rows?.map(x=><tr key={x.id}><td className="p-4 font-medium">{tm.get(x.teacher_id)}</td><td className="p-4">{sm.get(x.subject_id)}</td><td className="p-4">{gm.get(x.grade_id)}</td><td className="p-4">{ym.get(x.academic_year_id)}</td><td className="p-4">{x.active?"Activa":"Inactiva"}</td></tr>)}</tbody></table>{!rows?.length&&<p className="p-10 text-center text-sm text-muted-foreground">No hay asignaciones registradas.</p>}</div></div>;
}
