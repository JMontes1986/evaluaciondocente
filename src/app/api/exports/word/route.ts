import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPeriodSummary } from "@/lib/services/report-service";

export async function GET(request:NextRequest){
  const user=await requireAdmin(),periodId=request.nextUrl.searchParams.get("period");if(!periodId)return new Response("Evaluación semestral requerida",{status:400});
  const summary=await getPeriodSummary(periodId);
  const table=new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
    new TableRow({children:["Docente","Promedio","Evaluaciones"].map(text=>new TableCell({children:[new Paragraph({children:[new TextRun({text,bold:true})]})]}))}),
    ...summary.rows.map(row=>new TableRow({children:[row.name,`${row.average} / 4`,String(row.responses)].map(text=>new TableCell({children:[new Paragraph(text)]}))}))
  ]});
  const doc=new Document({sections:[{children:[
    new Paragraph({text:"COLEGIO FRANCISCANO AGUSTÍN GEMELLI",heading:HeadingLevel.HEADING_2}),
    new Paragraph({text:"EVALUACIÓN DOCENTE",heading:HeadingLevel.TITLE}),
    new Paragraph({text:`Evaluación semestral: ${summary.period}`}),
    new Paragraph({text:`Número de evaluaciones: ${summary.evaluationCount}`}),
    new Paragraph({text:"Resultados consolidados por docente",heading:HeadingLevel.HEADING_1}),
    table,new Paragraph({text:"Informe agregado sin nombres, códigos ni identificadores de estudiantes."})
  ]}]});
  await createAdminClient().from("audit_logs").insert({user_id:user.id,action:"EXPORT",entity:"evaluations",metadata:{format:"docx",period_id:periodId}});
  const buffer=await Packer.toBuffer(doc);return new Response(buffer as BodyInit,{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","Content-Disposition":"attachment; filename=\"evaluacion_docente.docx\""}});
}
