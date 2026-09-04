import { decode } from "@toon-format/toon";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
}

function rows(value: unknown) {
  return Array.isArray(value)
    ? value.map(asRecord).filter((row): row is UnknownRecord => Boolean(row))
    : [];
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function cell(value: unknown) {
  return text(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function toonPayload(value: string) {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:toon)?\s*\r?\n([\s\S]*?)\r?\n```$/i);
  return fenced?.[1].trim() ?? trimmed;
}

function decodeRecord(value: string) {
  try {
    return asRecord(decode(toonPayload(value), { strict: false }));
  } catch {
    return null;
  }
}

function bullets(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function numbered(items: UnknownRecord[], fields: string[]) {
  return items.map((item, index) => {
    const title = text(item.titulo) || text(item.hallazgo) || `Hallazgo ${index + 1}`;
    const details = fields
      .map((field) => [field, text(item[field])] as const)
      .filter((entry) => entry[1])
      .map(([field, value]) => `- **${field}:** ${value}`)
      .join("\n");
    return `### ${index + 1}. ${title}\n\n${details}`;
  }).join("\n\n");
}

function table(items: UnknownRecord[], columns: Array<[string, string]>) {
  if (!items.length) return "";
  const header = `| ${columns.map(([, label]) => label).join(" | ")} |`;
  const separator = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = items.map((item) => `| ${columns.map(([key]) => cell(item[key])).join(" | ")} |`).join("\n");
  return `${header}\n${separator}\n${body}`;
}

function section(title: string, body: string) {
  return body ? `## ${title}\n\n${body}` : "";
}

export function renderTeacherAnalysisResponse(value: string) {
  const data = decodeRecord(value);
  if (!data) return value.trim();

  const output = [
    section("Diagnóstico integral", strings(data.apertura).join("\n\n")),
    section("Lectura ejecutiva", table(rows(data.lectura), [
      ["respuesta", "Respuesta"], ["pct", "%"], ["lectura", "Lectura"]
    ])),
    section("Hallazgos prioritarios", numbered(rows(data.hallazgos), ["evidencia", "lectura", "accion"])),
    section("Ranking de intervención", table(rows(data.prioridades), [
      ["indicador", "Indicador"], ["distribucion", "Distribución"], ["motivo", "Motivo"], ["accion", "Acción"]
    ])),
    section("Perfil pedagógico", text(data.perfil) ? `> ${text(data.perfil)}` : ""),
    section("Metas sugeridas para el siguiente periodo", rows(data.metas).map((item) => {
      const meta = text(item.meta);
      const indicador = text(item.indicador);
      return `- ${meta}${indicador ? ` — **Indicador:** ${indicador}` : ""}`;
    }).join("\n")),
    section("Conclusión institucional", text(data.conclusion))
  ].filter(Boolean);

  return output.length >= 4 ? output.join("\n\n") : value.trim();
}

export function renderDashboardAnalysisResponse(value: string) {
  const data = decodeRecord(value);
  if (!data) return value.trim();

  const output = [
    section("Resumen ejecutivo", strings(data.resumen).join("\n\n")),
    section("Decisiones prioritarias", numbered(rows(data.decisiones), ["evidencia", "accion"])),
    section("Lectura de KPI y variabilidad", text(data.kpi_variabilidad)),
    section("Fortalezas", bullets(rows(data.fortalezas).map((item) => {
      const finding = text(item.hallazgo);
      const evidence = text(item.evidencia);
      const action = text(item.accion);
      return `${finding}${evidence ? ` — ${evidence}` : ""}${action ? ` **Acción:** ${action}` : ""}`;
    }).filter(Boolean))),
    section("Alertas y causas por validar", numbered(rows(data.alertas), ["evidencia", "validar", "accion"])),
    section("Segmentación", table(rows(data.segmentos), [
      ["segmento", "Segmento"], ["evidencia", "Evidencia"], ["accion", "Acción"]
    ])),
    section("Preguntas críticas", table(rows(data.preguntas), [
      ["pregunta", "Pregunta"], ["distribucion", "Distribución"], ["lectura", "Lectura"], ["accion", "Acción"]
    ])),
    section("Plan 30/60/90 días", table(rows(data.plan), [
      ["horizonte", "Horizonte"], ["accion", "Acción"], ["responsable", "Responsable"], ["indicador", "Indicador"], ["resultado", "Resultado esperado"]
    ])),
    section("Limitaciones y próximos análisis", bullets(strings(data.limitaciones))),
    section("Conclusión ejecutiva", text(data.conclusion))
  ].filter(Boolean);

  return output.length >= 5 ? output.join("\n\n") : value.trim();
}
