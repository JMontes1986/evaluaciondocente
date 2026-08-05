import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import {
  populateTeacherEvaluationTemplate,
  type TeacherEvaluationTemplateData
} from "@/lib/documents/teacher-evaluation-template";

const templatePath = path.join(
  process.cwd(),
  "src",
  "assets",
  "evaluacion-estudiantes-docentes-2025.docx"
);

export async function generateTeacherEvaluationWord(data: TeacherEvaluationTemplateData) {
  const template = await readFile(templatePath);
  const zip = await JSZip.loadAsync(template);
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) throw new Error("La plantilla Word no contiene word/document.xml.");

  const documentXml = await documentFile.async("string");
  zip.file("word/document.xml", populateTeacherEvaluationTemplate(documentXml, data));

  return zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });
}
