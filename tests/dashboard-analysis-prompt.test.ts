import test from "node:test";
import assert from "node:assert/strict";
import { buildDashboardAnalysisPrompts } from "../src/lib/ai/dashboard-analysis-prompt";

test("construye un informe BI porcentual y limita las intersecciones", () => {
  const teacherGradePerformance = Array.from({ length: 40 }, (_, index) => ({
    teacher: `Docente ${index + 1}`,
    grade: `${(index % 11) + 1}°`,
    average: 2.5 + (index * 0.03),
    responses: 20 + index
  }));
  const { prompt, fallbackPrompt } = buildDashboardAnalysisPrompts({
    periodName: "Evaluación 2025",
    privacyThreshold: 5,
    metrics: { evaluations: 1668, students: 154, teachers: 15, average: 3.42 },
    teachers: [{ name: "Docente A", average: 3.84, responses: 114 }],
    grades: [{ name: "11°", average: 3.65, responses: 120 }],
    questions: [{
      label: "P1",
      question: "Demuestra dominio de los temas",
      average: 3.04,
      responses: 100,
      never: 5,
      sometimes: 15,
      almostAlways: 40,
      always: 40
    }],
    teacherGradePerformance
  });

  assert.match(prompt, /inteligencia de negocios/i);
  assert.match(prompt, /promedio_pct:\s+85[,.]5/);
  assert.match(prompt, /intersecciones_extremas\[24\s/);
  assert.match(prompt, /PLAN 30\/60\/90 DÍAS/);
  assert.ok(fallbackPrompt.length < prompt.length);
  assert.doesNotMatch(fallbackPrompt, /intersecciones_extremas/);
});
