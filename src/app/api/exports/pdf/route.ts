import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextRequest } from "next/server";
import { requireModule } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPeriodSummary } from "@/lib/services/report-service";

export async function GET(request:NextRequest){
  const user=await requireModule("informes"),periodId=request.nextUrl.searchParams.get("period");if(!periodId)return new Response("Evaluación semestral requerida",{status:400});
  const summary=await getPeriodSummary(periodId),pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  let page=pdf.addPage([595,842]),y=790;const draw=(text:string,size=10,strong=false)=>{page.drawText(text.replace(/[^\x20-\x7E]/g,""),{x:52,y,size,font:strong?bold:font,color:rgb(.07,.16,.28)});y-=size+9;};
  draw("COLEGIO FRANCISCANO AGUSTIN GEMELLI",11,true);draw("EVALUACION DOCENTE",22,true);draw(summary.period,12);y-=12;draw(`Evaluaciones registradas: ${summary.evaluationCount}`,11,true);y-=8;
  for(const row of summary.rows){if(y<70){page=pdf.addPage([595,842]);y=790;}const average=row.average===null?"Dato protegido":`${row.average}/4`;draw(`${row.name}  |  Promedio: ${average}  |  Respuestas: ${row.responses}`,10);}
  page.drawText("Informe agregado sin datos personales de estudiantes.",{x:52,y:35,size:8,font,color:rgb(.35,.4,.48)});
  await createAdminClient().from("audit_logs").insert({user_id:user.id,action:"EXPORT",entity:"evaluations",metadata:{format:"pdf",period_id:periodId}});
  const bytes=await pdf.save();return new Response(bytes as BodyInit,{headers:{"Content-Type":"application/pdf","Content-Disposition":"attachment; filename=\"evaluacion_docente.pdf\""}});
}
