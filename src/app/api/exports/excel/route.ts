import ExcelJS from "exceljs";
import { NextRequest } from "next/server";
import { requireModule } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReportsOverview } from "@/lib/services/report-service";

function addSheet(workbook: ExcelJS.Workbook, name: string, headers: string[], rows: (string | number)[][]) {
  const sheet = workbook.addWorksheet(name);
  sheet.addRow(headers);
  rows.forEach((row) => sheet.addRow(row));
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF102A4B" } };
  sheet.columns.forEach((column) => { column.width = 24; });
  return sheet;
}

export async function GET(request: NextRequest) {
  const user = await requireModule("informes");
  const periodId = request.nextUrl.searchParams.get("period");
  if (!periodId) return new Response("Evaluación semestral requerida", { status: 400 });

  const report = await getReportsOverview(periodId);
  if (!report.period) return new Response("Evaluación semestral no encontrada", { status: 404 });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Colegio Franciscano Agustín Gemelli";
  const summary = workbook.addWorksheet("Resumen ejecutivo");
  summary.addRows([
    ["EVALUACIÓN DOCENTE COLGEMELLI"],
    ["Evaluación semestral", report.period.name],
    ["Evaluaciones", report.metrics.evaluations],
    ["Estudiantes participantes", report.metrics.students],
    ["Docentes evaluados", report.metrics.teachers],
    ["Promedio institucional", report.metrics.average],
    ["Respuestas favorables (%)", report.metrics.favorable],
    ["Comentarios recibidos", report.metrics.comments],
    ["Umbral de privacidad", report.minResponses],
    ["Generado", new Date().toISOString()]
  ]);
  summary.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  summary.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF102A4B" } };
  summary.columns = [{ width: 32 }, { width: 28 }];

  addSheet(workbook, "Por docente", ["Docente", "Evaluaciones", "Promedio / 4", "Favorable %", "Comentarios"], report.teachers.map((item) => [item.name, item.evaluations, item.average ?? "Dato protegido", item.favorable ?? "Dato protegido", item.comments]));
  addSheet(workbook, "Por pregunta", ["Pregunta", "Categoría", "Enunciado", "Respuestas", "Promedio / 4", "Favorable %", "Prioridad"], report.questions.map((item) => [item.label, item.category ?? "General", item.question, item.responses, item.average ?? "Dato protegido", item.favorable ?? "Dato protegido", item.priority ? "Sí" : "No"]));
  addSheet(workbook, "Por grado", ["Grado", "Evaluaciones", "Estudiantes", "Promedio / 4", "Favorable %"], report.grades.map((item) => [item.name, item.evaluations, item.students, item.average ?? "Dato protegido", item.favorable ?? "Dato protegido"]));
  addSheet(workbook, "Participación", ["Fecha", "Evaluaciones registradas"], report.activity.map((item) => [item.date, item.count]));

  await createAdminClient().from("audit_logs").insert({
    user_id: user.id,
    action: "EXPORT",
    entity: "evaluations",
    metadata: { format: "xlsx", period_id: periodId, report_sections: ["summary", "teachers", "questions", "grades", "participation"] }
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="informe_evaluacion_${periodId}.xlsx"`
    }
  });
}
