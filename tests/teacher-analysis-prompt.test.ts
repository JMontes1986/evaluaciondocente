import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTeacherAnalysisPrompt,
  personalizeTeacherAnalysis
} from "../src/lib/ai/teacher-analysis-prompt";

test("construye un análisis docente profundo, cuantitativo y anonimizado", () => {
  const prompt = buildTeacherAnalysisPrompt({
    periodName: "Primer semestre 2026",
    privacyThreshold: 5,
    responseCount: 154,
    average: 3.22,
    commentCount: 34,
    questions: [{
      label: "P22",
      question: "Socializa y retroalimenta las pruebas de seguimiento",
      category: "Evaluación",
      average: 2.39,
      responses: 154,
      always: 50,
      almostAlways: 27,
      sometimes: 10,
      never: 67
    }]
  });

  assert.match(prompt, /1\.600 a 2\.500 palabras/);
  assert.match(prompt, /Ranking inteligente de intervención/);
  assert.match(prompt, /Metas sugeridas para el siguiente periodo/);
  assert.match(prompt, /promedio_4:\s+3[,.]22/);
  assert.match(prompt, /p:\s+80[,.]5/);
  assert.match(prompt, /nunca:\s+43[,.]5/);
  assert.match(prompt, /comentarios_no_enviados:\s+34/);
  assert.match(prompt, /DOCENTE_EVALUADO/);
  assert.doesNotMatch(prompt, /nombre del docente|correo institucional|teacher_id/i);
});

test("muestra el nombre real solo después de recibir el análisis de Groq", () => {
  const analysis = [
    "**DOCENTE_EVALUADO** presenta fortalezas.",
    "El acompañamiento a la persona docente debe continuar.",
    "La planeación del docente evaluado es consistente."
  ].join("\n");

  const personalized = personalizeTeacherAnalysis(analysis, "Cindy Arboleda Lara");

  assert.match(personalized, /\*\*Cindy Arboleda Lara\*\*/);
  assert.match(personalized, /a Cindy Arboleda Lara/);
  assert.match(personalized, /de Cindy Arboleda Lara/);
  assert.doesNotMatch(personalized, /DOCENTE_EVALUADO|persona docente|docente evaluado/i);
});
