import fs from "node:fs";
import path from "node:path";
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  Header,
  HeadingLevel,
  LevelFormat,
  LineRuleType,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  TextRun,
} from "docx";

const ROOT = process.cwd();
const LEGAL_DIR = path.join(ROOT, "docs", "legal");
const documents = [
  {
    source: "POLITICA_TRATAMIENTO_DATOS_APLICACION.md",
    output: "Politica_Tratamiento_Datos_Evaluacion_Docente.docx",
    shortTitle: "Política de tratamiento de datos",
  },
  {
    source: "TERMINOS_Y_CONDICIONES_APLICACION.md",
    output: "Terminos_Condiciones_Evaluacion_Docente.docx",
    shortTitle: "Términos y condiciones",
  },
];

const COLORS = {
  navy: "12385B",
  blue: "2D668F",
  gold: "D5A43B",
  lightBlue: "EAF2F8",
  lightGold: "FBF5E7",
  gray: "5B6570",
  rule: "CFD8E3",
  white: "FFFFFF",
};

function inlineRuns(text) {
  const normalized = text.replace(/ {2,}$/u, "");
  const tokens = normalized.split(/(\*\*[^*]+\*\*|https?:\/\/\S+)/gu).filter(Boolean);
  return tokens.map((token) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return new TextRun({ text: token.slice(2, -2), bold: true });
    }
    if (/^https?:\/\//u.test(token)) {
      const url = token.replace(/[.,;:]$/u, "");
      const punctuation = token.slice(url.length);
      const link = new ExternalHyperlink({
        link: url,
        children: [new TextRun({ text: url, style: "Hyperlink" })],
      });
      return punctuation ? [link, new TextRun(punctuation)] : link;
    }
    return new TextRun(token);
  }).flat();
}

function paragraph(text, options = {}) {
  return new Paragraph({
    children: inlineRuns(text),
    alignment: options.alignment,
    spacing: options.spacing ?? { after: 150, line: 286, lineRule: LineRuleType.AUTO },
    indent: options.indent,
    border: options.border,
    shading: options.shading,
    keepNext: options.keepNext,
  });
}

function parseMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/gu, "\n").split("\n");
  const children = [];
  let paragraphBuffer = [];

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return;
    children.push(paragraph(paragraphBuffer.join(" ").trim()));
    paragraphBuffer = [];
  };

  for (const rawLine of lines) {
    const hardBreak = / {2,}$/u.test(rawLine);
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      flushParagraph();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/u);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      children.push(
        new Paragraph({
          text: heading[2],
          heading:
            level === 1
              ? HeadingLevel.TITLE
              : level === 2
                ? HeadingLevel.HEADING_1
                : HeadingLevel.HEADING_2,
          pageBreakBefore: false,
          keepNext: true,
        }),
      );
      continue;
    }

    if (/^---$/u.test(line.trim())) {
      flushParagraph();
      children.push(
        new Paragraph({
          border: { bottom: { color: COLORS.rule, style: BorderStyle.SINGLE, size: 8 } },
          spacing: { before: 160, after: 220 },
        }),
      );
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      children.push(
        paragraph(line.slice(2), {
          indent: { left: 360, right: 240 },
          shading: { type: ShadingType.CLEAR, color: "auto", fill: COLORS.lightGold },
          border: { left: { color: COLORS.gold, style: BorderStyle.SINGLE, size: 18 } },
          spacing: { before: 120, after: 220, line: 286, lineRule: LineRuleType.AUTO },
        }),
      );
      continue;
    }

    const bullet = line.match(/^-\s+(.+)$/u);
    if (bullet) {
      flushParagraph();
      children.push(
        new Paragraph({
          children: inlineRuns(bullet[1]),
          numbering: { reference: "legal-bullets", level: 0 },
          spacing: { after: 90, line: 270, lineRule: LineRuleType.AUTO },
        }),
      );
      continue;
    }

    paragraphBuffer.push(line.trim());
    if (hardBreak) flushParagraph();
  }
  flushParagraph();
  return children;
}

function buildDocument(markdown, shortTitle) {
  const body = parseMarkdown(markdown);

  return new Document({
    creator: "Colegio Franciscano Agustín Gemelli",
    title: shortTitle,
    subject: "Documento legal de la aplicación Evaluación Docente ColGemelli",
    description: "Borrador para revisión y aprobación institucional",
    styles: {
      default: {
        document: {
          run: { font: "Aptos", size: 21, color: "202A33" },
          paragraph: { spacing: { after: 150, line: 286, lineRule: LineRuleType.AUTO } },
        },
        title: {
          run: { font: "Aptos Display", size: 34, bold: true, color: COLORS.navy },
          paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 120, after: 160 } },
        },
        heading1: {
          run: { font: "Aptos Display", size: 27, bold: true, color: COLORS.navy },
          paragraph: {
            spacing: { before: 300, after: 120 },
            border: { bottom: { color: COLORS.gold, style: BorderStyle.SINGLE, size: 10 } },
          },
        },
        heading2: {
          run: { font: "Aptos Display", size: 23, bold: true, color: COLORS.blue },
          paragraph: { spacing: { before: 220, after: 90 } },
        },
        hyperlink: { run: { color: "0563C1", underline: {} } },
      },
      paragraphStyles: [
        {
          id: "InstitutionalSubtitle",
          name: "Institutional Subtitle",
          basedOn: "Normal",
          next: "Normal",
          run: { size: 24, bold: true, color: COLORS.blue },
          paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 200 } },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "legal-bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 520, hanging: 260 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1000, right: 1080, bottom: 960, left: 1080, header: 420, footer: 420 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "COLEGIO FRANCISCANO AGUSTÍN GEMELLI", bold: true, color: COLORS.navy, size: 17 }),
                  new TextRun({ text: `  |  ${shortTitle}`, color: COLORS.gray, size: 17 }),
                ],
                border: { bottom: { color: COLORS.gold, style: BorderStyle.SINGLE, size: 8 } },
                spacing: { after: 90 },
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Borrador para revisión y aprobación institucional  •  Página ", color: COLORS.gray, size: 17 }),
                  new TextRun({ children: [PageNumber.CURRENT], color: COLORS.gray, size: 17 }),
                ],
                border: { top: { color: COLORS.rule, style: BorderStyle.SINGLE, size: 6 } },
                spacing: { before: 80 },
              }),
            ],
          }),
        },
        children: body,
      },
    ],
  });
}

await fs.promises.mkdir(LEGAL_DIR, { recursive: true });

for (const item of documents) {
  const markdown = await fs.promises.readFile(path.join(LEGAL_DIR, item.source), "utf8");
  const doc = buildDocument(markdown, item.shortTitle);
  const buffer = await Packer.toBuffer(doc);
  await fs.promises.writeFile(path.join(LEGAL_DIR, item.output), buffer);
  process.stdout.write(`${item.output}: ${buffer.length} bytes\n`);
}
