export interface EvaluationQuestionDistribution {
  orderNumber: number;
  responses: number;
  always: number;
  almostAlways: number;
  sometimes: number;
  never: number;
}

export interface TeacherEvaluationTemplateData {
  teacherName: string;
  periodName: string;
  generatedAt: Date;
  responseCount: number;
  questions: EvaluationQuestionDistribution[];
  comments: string[];
}

const expectedQuestionCount = 23;
const cellPattern = /<w:tc\b[\s\S]*?<\/w:tc>/g;
const rowPattern = /<w:tr\b[\s\S]*?<\/w:tr>/g;

function cleanText(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/[\r\n\t]+/g, " ").trim();
}

export function escapeWordXml(value: string) {
  return cleanText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function formatDistributionPercentage(value: number, total: number) {
  if (!total) return "0,0%";
  return `${((value / total) * 100).toFixed(1).replace(".", ",")}%`;
}

function runProperties({ bold = false, size = 18 }: { bold?: boolean; size?: number } = {}) {
  return `<w:rPr><w:rFonts w:ascii="Caviar Dreams" w:hAnsi="Caviar Dreams" w:cs="Arial"/>${bold ? "<w:b/><w:bCs/>" : ""}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/><w:lang w:val="es-CO"/></w:rPr>`;
}

function cellWithText(cellXml: string, text: string, bold = true) {
  const properties = cellXml.match(/<w:tcPr>[\s\S]*?<\/w:tcPr>/)?.[0] ?? "";
  const run = runProperties({ bold });
  return `<w:tc>${properties}<w:p><w:pPr><w:spacing w:before="0" w:after="0"/><w:jc w:val="center"/>${run}</w:pPr><w:r>${run}<w:t>${escapeWordXml(text)}</w:t></w:r></w:p></w:tc>`;
}

function resultRow(rowXml: string, values: string[], totalLabel = false) {
  const cells = rowXml.match(cellPattern);
  if (!cells || cells.length !== 5) throw new Error("La fila de la plantilla no tiene las cinco columnas esperadas.");
  const nextCells = [...cells];
  if (totalLabel) nextCells[0] = cellWithText(cells[0], "TOTAL", true);
  values.forEach((value, index) => {
    nextCells[index + 1] = cellWithText(cells[index + 1], value, true);
  });
  let nextRow = rowXml;
  cells.forEach((cell, index) => {
    nextRow = nextRow.replace(cell, nextCells[index]);
  });
  return nextRow;
}

function paragraph(text: string, options: { bold?: boolean; numbered?: boolean } = {}) {
  const run = runProperties({ bold: options.bold, size: options.bold ? 24 : 22 });
  const numbering = options.numbered
    ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="3"/></w:numPr>'
    : "";
  return `<w:p><w:pPr><w:spacing w:before="${options.bold ? 180 : 60}" w:after="120"/>${options.bold ? '<w:jc w:val="center"/>' : ""}${numbering}${run}</w:pPr><w:r>${run}<w:t>${escapeWordXml(text)}</w:t></w:r></w:p>`;
}

function replaceContentAfterTableThroughParagraphContaining(
  documentXml: string,
  marker: string,
  replacement: string
) {
  const tableEnd = documentXml.indexOf("</w:tbl>");
  if (tableEnd < 0) throw new Error("No se encontró la tabla de resultados en la plantilla.");

  const markerIndex = documentXml.indexOf(marker, tableEnd);
  if (markerIndex < 0) throw new Error(`No se encontró el marcador "${marker}" en la plantilla.`);
  const markerEnd = documentXml.indexOf("</w:p>", markerIndex);
  if (markerEnd < 0) throw new Error(`No se pudo localizar el párrafo de "${marker}".`);

  const insertionPoint = tableEnd + "</w:tbl>".length;
  return `${documentXml.slice(0, insertionPoint)}${replacement}${documentXml.slice(markerEnd + 6)}`;
}

function textBoxContent(data: TeacherEvaluationTemplateData) {
  const date = new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Bogota"
  }).format(data.generatedAt);
  const normal = runProperties({ size: 20 });
  const bold = runProperties({ bold: true, size: 20 });
  const line = (label: string, value: string) => `<w:p><w:pPr><w:spacing w:before="0" w:after="0"/>${normal}</w:pPr><w:r>${bold}<w:t>${escapeWordXml(label)}</w:t></w:r><w:r>${normal}<w:t xml:space="preserve"> ${escapeWordXml(value)}</w:t></w:r></w:p>`;
  return `<w:txbxContent>${line("Evaluado(a):", data.teacherName)}${line("Cargo:", "Docente")}${line("Fecha:", date)}${line("Evaluación semestral:", data.periodName)}</w:txbxContent>`;
}

export function populateTeacherEvaluationTemplate(documentXml: string, data: TeacherEvaluationTemplateData) {
  if (data.questions.length !== expectedQuestionCount) {
    throw new Error(`El formato oficial requiere ${expectedQuestionCount} preguntas y el informe contiene ${data.questions.length}.`);
  }

  const orderedQuestions = [...data.questions].sort((a, b) => a.orderNumber - b.orderNumber);
  if (orderedQuestions.some((question, index) => question.orderNumber !== index + 1)) {
    throw new Error("Las preguntas del informe no corresponden al orden 1 a 23 del formato oficial.");
  }

  const rows = documentXml.match(rowPattern);
  if (!rows || rows.length !== expectedQuestionCount + 2) {
    throw new Error("La tabla de la plantilla no contiene el encabezado, las 23 preguntas y el total esperados.");
  }

  const totalCounts = { always: 0, almostAlways: 0, sometimes: 0, never: 0, responses: 0 };
  const nextRows = rows.map((row, index) => {
    if (index === 0) return row;
    if (index <= expectedQuestionCount) {
      const question = orderedQuestions[index - 1];
      totalCounts.always += question.always;
      totalCounts.almostAlways += question.almostAlways;
      totalCounts.sometimes += question.sometimes;
      totalCounts.never += question.never;
      totalCounts.responses += question.responses;
      return resultRow(row, [
        formatDistributionPercentage(question.always, question.responses),
        formatDistributionPercentage(question.almostAlways, question.responses),
        formatDistributionPercentage(question.sometimes, question.responses),
        formatDistributionPercentage(question.never, question.responses)
      ]);
    }
    return resultRow(row, [
      formatDistributionPercentage(totalCounts.always, totalCounts.responses),
      formatDistributionPercentage(totalCounts.almostAlways, totalCounts.responses),
      formatDistributionPercentage(totalCounts.sometimes, totalCounts.responses),
      formatDistributionPercentage(totalCounts.never, totalCounts.responses)
    ], true);
  });

  let rowIndex = 0;
  let output = documentXml.replace(rowPattern, () => nextRows[rowIndex++]);
  output = output.replace(/<w:txbxContent>[\s\S]*?<\/w:txbxContent>/g, textBoxContent(data));

  const commentItems = data.comments.map(cleanText).filter(Boolean);
  const commentsXml = [
    paragraph("COMENTARIOS DE LOS ESTUDIANTES", { bold: true }),
    paragraph(`Evaluaciones recibidas: ${data.responseCount}. Comentarios presentados de forma anónima.`),
    ...(commentItems.length
      ? commentItems.map((comment, index) => paragraph(`${index + 1}. ${comment}`))
      : [paragraph("No se recibieron comentarios abiertos en esta evaluación semestral.")])
  ].join("");
  output = replaceContentAfterTableThroughParagraphContaining(
    output,
    "Sus comentarios son positivos y sugerencias son valiosas para la institución",
    commentsXml
  );

  return output;
}
