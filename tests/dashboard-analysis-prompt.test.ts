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
    teachers: [{ name: "Ana Pérez", average: 3.84, responses: 114 }],
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
  assert.match(prompt, /Docente 01/);
  assert.doesNotMatch(prompt, /Ana Pérez/);
  assert.doesNotMatch(fallbackPrompt, /Ana Pérez/);
  assert.ok(fallbackPrompt.length < prompt.length);
  assert.doesNotMatch(fallbackPrompt, /intersecciones_extremas/);
});

test("mantiene alias consistentes y no filtra nombres en las intersecciones", () => {
  const input = {
    periodName: "Evaluación 2025",
    privacyThreshold: 5,
    metrics: { evaluations: 30, students: 20, teachers: 2, average: 3.2 },
    teachers: [
      { name: "María Rodríguez", average: 3.7, responses: 18 },
      { name: "Carlos Gómez", average: 2.7, responses: 12 }
    ],
    grades: [{ name: "9°", average: 3.2, responses: 30 }],
    questions: [],
    teacherGradePerformance: [
      { teacher: "María Rodríguez", grade: "9°", average: 3.7, responses: 18 },
      { teacher: "Carlos Gómez", grade: "9°", average: 2.7, responses: 12 }
    ]
  };

  const { prompt, fallbackPrompt } = buildDashboardAnalysisPrompts(input);
  for (const output of [prompt, fallbackPrompt]) {
    assert.doesNotMatch(output, /María Rodríguez|Carlos Gómez/);
    assert.match(output, /Docente 01/);
    assert.match(output, /Docente 02/);
  }
});
