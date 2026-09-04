import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTeacherAnalysisPrompt,
  personalizeTeacherAnalysis
} from "../src/lib/ai/teacher-analysis-prompt";
import { renderTeacherAnalysisResponse } from "../src/lib/ai/toon-analysis-response";

test("construye un análisis docente profundo, cuantitativo y anonimizado", () => {
  const prompt = buildTeacherAnalysisPrompt({
    periodName: "Primer semestre 2026",
    privacyThreshold: 5,
    responseCount: 154,
    commentCount: 34,
    questions: [{
      label: "P22",
      question: "Socializa y retroalimenta las pruebas de seguimiento",
      category: "Evaluación",
      responses: 154,
      always: 50,
      almostAlways: 27,
      sometimes: 10,
      never: 67
    }]
  });

  assert.match(prompt, /exclusivamente en TOON válido/);
  assert.match(prompt, /máximo 500 palabras/);
  assert.match(prompt, /hallazgos\[6\]\{titulo,evidencia,lectura,accion\}/);
  assert.match(prompt, /metas\[3\]\{meta,indicador\}/);
  assert.match(prompt, /exclusivamente cuatro respuestas/i);
  assert.match(prompt, /SIEMPRE, CASI SIEMPRE, ALGUNAS VECES y NUNCA/);
  assert.match(prompt, /nunca:\s+43[,.]5/);
  assert.match(prompt, /comentarios_no_enviados:\s+34/);
  assert.match(prompt, /DOCENTE_EVALUADO/);
  assert.doesNotMatch(prompt, /promedio_4:|positiva:|atencion:/);
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

test("convierte la respuesta TOON del análisis docente a Markdown", () => {
  const toon = [
    "apertura[2]: Buen desempeño general,Hay oportunidades concretas",
    "lectura[4]{respuesta,pct,lectura}:",
    "  SIEMPRE,50,Predomina",
    "  CASI SIEMPRE,30,Es frecuente",
    "  ALGUNAS VECES,15,Requiere seguimiento",
    "  NUNCA,5,Es minoritario",
    "hallazgos[1]{titulo,evidencia,lectura,accion}:",
    "  Retroalimentación,P22 tiene 15%,Debe revisarse,Observar clases",
    "prioridades[1]{indicador,distribucion,motivo,accion}:",
    "  P22,S 50 CS 30 AV 15 N 5,Mayor oportunidad,Acordar estrategia",
    "perfil: DOCENTE_EVALUADO muestra una práctica consistente",
    "metas[1]{meta,indicador}:",
    "  Mejorar retroalimentación,Seguimiento mensual",
    "conclusion: Preservar fortalezas y acompañar P22"
  ].join("\n");

  const markdown = renderTeacherAnalysisResponse(toon);
  assert.match(markdown, /## Diagnóstico integral/);
  assert.match(markdown, /\| SIEMPRE \| 50 \| Predomina \|/);
  assert.match(markdown, /### 1\. Retroalimentación/);
  assert.match(markdown, /> DOCENTE_EVALUADO/);
});
