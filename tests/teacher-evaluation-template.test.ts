import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import {
  escapeWordXml,
  formatDistributionPercentage,
  populateTeacherEvaluationTemplate
} from "../src/lib/documents/teacher-evaluation-template";

test("formatea porcentajes para el informe Word", () => {
  assert.equal(formatDistributionPercentage(3, 4), "75,0%");
  assert.equal(formatDistributionPercentage(0, 0), "0,0%");
});

test("protege el XML frente a texto ingresado por estudiantes", () => {
  assert.equal(escapeWordXml("A & B <C>"), "A &amp; B &lt;C&gt;");
});

test("ubica los comentarios inmediatamente después de la tabla sin forzar otra página", async () => {
  const templatePath = path.join(
    process.cwd(),
    "src",
    "assets",
    "evaluacion-estudiantes-docentes-2025.docx"
  );
  const zip = await JSZip.loadAsync(await readFile(templatePath));
  const documentFile = zip.file("word/document.xml");
  assert.ok(documentFile);
  const template = await documentFile.async("string");
  const questions = Array.from({ length: 23 }, (_, index) => ({
    orderNumber: index + 1,
    responses: 1,
    always: 1,
    almostAlways: 0,
    sometimes: 0,
    never: 0
  }));

  const output = populateTeacherEvaluationTemplate(template, {
    teacherName: "Docente de prueba",
    periodName: "Primer semestre",
    generatedAt: new Date("2026-08-31T12:00:00Z"),
    responseCount: 1,
    questions,
    comments: ["Comentario de prueba"]
  });

  const afterTable = output.slice(output.indexOf("</w:tbl>") + "</w:tbl>".length);
  assert.match(afterTable, /^<w:p><w:pPr>/);
  assert.doesNotMatch(afterTable, /<w:pageBreakBefore\/>/);
  assert.doesNotMatch(afterTable, /<w:t>TOTAL<\/w:t>/);
  assert.match(afterTable, /COMENTARIOS DE LOS ESTUDIANTES/);

  zip.file("word/document.xml", output);
  const generatedDocument = await zip.generateAsync({ type: "uint8array" });
  assert.deepEqual(Array.from(generatedDocument.slice(0, 2)), [0x50, 0x4b]);
});
