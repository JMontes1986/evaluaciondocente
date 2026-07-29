import ExcelJS from "exceljs";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request:NextRequest){
  const user=await requireAdmin();const periodId=request.nextUrl.searchParams.get("period");if(!periodId)return new Response("Periodo requerido",{status:400});
  const admin=createAdminClient();const[{data:period},{data:evaluations},{data:questions}]=await Promise.all([admin.from("evaluation_periods").select("name").eq("id",periodId).single(),admin.from("evaluations").select("id,teacher_id,grade_id,submitted_at").eq("evaluation_period_id",periodId),admin.from("evaluation_questions").select("id,text,category,order_number").order("order_number")]);
  const evalIds=(evaluations??[]).map(x=>x.id),teacherIds=[...new Set((evaluations??[]).map(x=>x.teacher_id))];
  const[{data:answers},{data:teachers}]=await Promise.all([evalIds.length?admin.from("evaluation_answers").select("evaluation_id,question_id,score").in("evaluation_id",evalIds):Promise.resolve({data:[]}),teacherIds.length?admin.from("teachers").select("id,full_name").in("id",teacherIds):Promise.resolve({data:[]})]);
  const wb=new ExcelJS.Workbook();wb.creator="Colegio Franciscano Agustín Gemelli";const summary=wb.addWorksheet("Resumen");summary.addRows([["EVALUACIÓN DOCENTE COLGEMELLI"],["Periodo",period?.name??""],["Evaluaciones",evaluations?.length??0],["Generado",new Date().toISOString()]]);
  const teacherSheet=wb.addWorksheet("Docentes");teacherSheet.addRow(["Docente","Evaluaciones","Promedio"]);for(const teacher of teachers??[]){const teacherEval=new Set((evaluations??[]).filter(x=>x.teacher_id===teacher.id).map(x=>x.id));const scores=(answers??[]).filter(x=>teacherEval.has(x.evaluation_id)).map(x=>x.score);teacherSheet.addRow([teacher.full_name,teacherEval.size,scores.length?Number((scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(2)):0]);}
  const qSheet=wb.addWorksheet("Resultados por pregunta");qSheet.addRow(["Orden","Categoría","Pregunta","Promedio"]);for(const q of questions??[]){const scores=(answers??[]).filter(x=>x.question_id===q.id).map(x=>x.score);qSheet.addRow([q.order_number,q.category??"",q.text,scores.length?Number((scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(2)):0]);}
  ["Resultados por grado","Participación","Comentarios"].forEach(name=>{const ws=wb.addWorksheet(name);ws.addRow(["Información agregada","Sin datos personales de estudiantes"]);});
  wb.eachSheet(ws=>{ws.getRow(1).font={bold:true,color:{argb:"FFFFFFFF"}};ws.getRow(1).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF102A4B"}};ws.columns.forEach(c=>c.width=24);});
  await admin.from("audit_logs").insert({user_id:user.id,action:"EXPORT",entity:"evaluations",metadata:{format:"xlsx",period_id:periodId}});
  const buffer=await wb.xlsx.writeBuffer();return new Response(buffer as ArrayBuffer,{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":`attachment; filename="evaluacion_docente.xlsx"`}});
}
