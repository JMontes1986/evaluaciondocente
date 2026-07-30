export interface CsvTable {
  headers: string[];
  rows: string[][];
}

export function decodeCsvBytes(bytes: ArrayBuffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    // Excel en Windows suele guardar los CSV como ANSI (Windows-1252).
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

export function normalizeCsvValue(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es");
}

export function normalizeCsvHeader(value: string) {
  return normalizeCsvValue(value).replace(/[\s_-]+/g, "");
}

function countDelimiter(line: string, delimiter: "," | ";") {
  let count = 0;
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === '"') {
      if (quoted && line[index + 1] === '"') index += 1;
      else quoted = !quoted;
    } else if (!quoted && line[index] === delimiter) {
      count += 1;
    }
  }
  return count;
}

function detectDelimiter(source: string): "," | ";" {
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  return countDelimiter(firstLine, ";") > countDelimiter(firstLine, ",") ? ";" : ",";
}

export function parseCsv(source: string): CsvTable {
  const text = source.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(text);
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      record.push(field.trim());
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      record.push(field.trim());
      if (record.some((value) => value.length > 0)) records.push(record);
      record = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("El archivo contiene una comilla sin cerrar.");
  record.push(field.trim());
  if (record.some((value) => value.length > 0)) records.push(record);
  if (records.length === 0) throw new Error("El archivo CSV está vacío.");

  const headers = records[0].map(normalizeCsvHeader);
  if (headers.some((header) => !header)) {
    throw new Error("Todos los encabezados del archivo deben tener un nombre.");
  }

  return { headers, rows: records.slice(1) };
}

export function findCsvColumn(headers: string[], aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeCsvHeader);
  return headers.findIndex((header) => normalizedAliases.includes(header));
}
