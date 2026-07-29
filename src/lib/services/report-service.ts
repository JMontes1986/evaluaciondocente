import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getPeriodSummary(periodId:string){
  const admin=createAdminClient();
  const[{data:period},{data:evaluations}]=await Promise.all([
    admin.from("evaluation_periods").select("name").eq("id",periodId).single(),
    admin.from("evaluations").select("id,teacher_id").eq("evaluation_period_id",periodId)
  ]);
  const evaluationIds=(evaluations??[]).map(x=>x.id),teacherIds=[...new Set((evaluations??[]).map(x=>x.teacher_id))];
  const[{data:answers},{data:teachers}]=await Promise.all([
    evaluationIds.length?admin.from("evaluation_answers").select("evaluation_id,score").in("evaluation_id",evaluationIds):Promise.resolve({data:[]}),
    teacherIds.length?admin.from("teachers").select("id,full_name").in("id",teacherIds):Promise.resolve({data:[]})
  ]);
  const rows=(teachers??[]).map(teacher=>{
    const ids=new Set((evaluations??[]).filter(x=>x.teacher_id===teacher.id).map(x=>x.id));
    const scores=(answers??[]).filter(x=>ids.has(x.evaluation_id)).map(x=>x.score);
    return{name:teacher.full_name,responses:ids.size,average:scores.length?Number((scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(2)):0};
  }).sort((a,b)=>b.average-a.average);
  return{period:period?.name??"Periodo",evaluationCount:evaluations?.length??0,rows};
}
