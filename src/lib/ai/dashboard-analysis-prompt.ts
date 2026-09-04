import { encode } from "@toon-format/toon";
import { scorePercentage } from "@/lib/calculations/scores";

interface AverageItem {
  name: string;
  average: number;
  responses: number;
}

interface QuestionItem {
  label: string;
  question: string;
  average: number;
  responses: number;
  always: number;
  almostAlways: number;
  sometimes: number;
  never: number;
}

interface IntersectionItem {
  teacher: string;
  grade: string;
  average: number;
  responses: number;
}

interface DashboardAnalysisInput {
  periodName: string;
  privacyThreshold: number;
  metrics: {
    evaluations: number;
    students: number;
    teachers: number;
    average: number;
  };
  teachers: AverageItem[];
  grades: AverageItem[];
  questions: QuestionItem[];
  teacherGradePerformance: IntersectionItem[];
}

const MAX_INTERSECTIONS = 24;

function percentage(value: number) {
  return Number(scorePercentage(value).toFixed(1));
}

function distributionPercentage(count: number, total: number) {
  return total ? Number(((count / total) * 100).toFixed(1)) : 0;
}

function selectPerformanceExtremes(items: IntersectionItem[]) {
  const sorted = [...items].sort((a, b) => a.average - b.average);
  const sideSize = Math.floor(MAX_INTERSECTIONS / 2);
  const selected = [...sorted.slice(0, sideSize), ...sorted.slice(-sideSize)];
  return [...new Map(selected.map((item) => [`${item.teacher}:${item.grade}`, item])).values()];
}

function createTeacherAliases(input: DashboardAnalysisInput) {
  const aliases = new Map<string, string>();
  const register = (teacher: string) => {
    if (!aliases.has(teacher)) {
      aliases.set(teacher, `Docente ${String(aliases.size + 1).padStart(2, "0")}`);
    }
  };

  input.teachers.forEach((item) => register(item.name));
  input.teacherGradePerformance.forEach((item) => register(item.teacher));
  return aliases;
}

function instructions() {
  return [
    "Actúa como consultor sénior en analítica de datos, inteligencia de negocios y evaluación educativa.",
    "Redacta en español un informe ejecutivo coherente, preciso y útil para directivos académicos.",
    "Trabaja exclusivamente con los datos agregados suministrados. No inventes cifras, causas, metas históricas ni identidades de estudiantes.",
    "Todos los indicadores p están en porcentaje (0 a 100) y n representa el tamaño de muestra. Compara porcentajes con una decimal y expresa diferencias como puntos porcentuales.",
    "Interpreta magnitud, dispersión, brechas, consistencia entre indicadores y tamaño de muestra. Distingue evidencia, hipótesis y causalidad; señala qué debe validarse cualitativamente.",
    "Evita generalidades, repeticiones y juicios personales. Cada hallazgo debe incluir evidencia numérica, implicación institucional y acción sugerida.",
    "Responde exclusivamente en TOON válido, sin Markdown, sin bloque de código y sin texto antes o después del objeto TOON.",
    "Sé compacto: máximo 500 palabras, evita repeticiones y limita cada campo textual a una sola línea de hasta 18 palabras.",
    "No uses comas dentro de los campos textuales; usa punto y coma si necesitas separar ideas para conservar el TOON válido.",
    "Usa exactamente este contrato y estas cantidades; las llaves son literales:",
    "resumen[2]: dos párrafos breves de lectura integral",
    "decisiones[3]{titulo,evidencia,accion}: tres decisiones principales",
    "kpi_variabilidad: nivel global y brechas considerando n",
    "fortalezas[3]{hallazgo,evidencia,accion}: patrones sólidos que conviene transferir",
    "alertas[4]{titulo,evidencia,validar,accion}: prioridades sin afirmar causalidad no demostrada",
    "segmentos[3]{segmento,evidencia,accion}: docentes, grados o intersecciones relevantes sin rankings punitivos",
    "preguntas[4]{pregunta,distribucion,lectura,accion}: distribución, polarización o concentración",
    "plan[3]{horizonte,accion,responsable,indicador,resultado}: filas exactas para 30, 60 y 90 días",
    "limitaciones[2]: representatividad y validaciones necesarias",
    "conclusion: conclusión ejecutiva breve",
    "No copies toda la tabla ni expliques el formato de entrada."
  ].join("\n");
}

function compactAverage(items: AverageItem[], key: "docente" | "grado") {
  return items.map((item) => ({
    [key]: item.name,
    p: percentage(item.average),
    n: item.responses
  }));
}

function compactTeachers(items: AverageItem[], aliases: ReadonlyMap<string, string>) {
  return items.map((item) => ({
    docente: aliases.get(item.name) ?? "Docente",
    p: percentage(item.average),
    n: item.responses
  }));
}

function compactQuestions(items: QuestionItem[]) {
  return items.map((item) => ({
    pregunta: item.label,
    criterio: item.question,
    p: percentage(item.average),
    n: item.responses,
    distribucion_pct: {
      nunca: distributionPercentage(item.never, item.responses),
      algunas_veces: distributionPercentage(item.sometimes, item.responses),
      casi_siempre: distributionPercentage(item.almostAlways, item.responses),
      siempre: distributionPercentage(item.always, item.responses)
    }
  }));
}

export function buildDashboardAnalysisPrompts(input: DashboardAnalysisInput) {
  const teacherAliases = createTeacherAliases(input);
  const baseData = {
    periodo: input.periodName,
    umbral_privacidad: input.privacyThreshold,
    kpi: {
      evaluaciones: input.metrics.evaluations,
      estudiantes: input.metrics.students,
      docentes: input.metrics.teachers,
      promedio_pct: percentage(input.metrics.average)
    },
    docentes: compactTeachers(input.teachers, teacherAliases),
    grados: compactAverage(input.grades, "grado"),
    preguntas: compactQuestions(input.questions)
  };
  const intersections = selectPerformanceExtremes(input.teacherGradePerformance).map((item) => ({
    docente: teacherAliases.get(item.teacher) ?? "Docente",
    grado: item.grade,
    p: percentage(item.average),
    n: item.responses
  }));
  const mainData = {
    ...baseData,
    intersecciones_extremas: intersections,
    nota_intersecciones: `Se incluyen solo las ${intersections.length} combinaciones extremas para controlar el tamaño del análisis.`
  };
  const promptHeader = instructions();
  const prompt = `${promptHeader}\n\nDATOS ANALÍTICOS AGREGADOS (TOON):\n${encode(mainData, { delimiter: "\t" })}`;
  const fallbackPrompt = `${promptHeader}\n\nVERSIÓN COMPACTA DE LOS DATOS AGREGADOS (TOON):\n${encode(baseData, { delimiter: "\t" })}`;

  return { prompt, fallbackPrompt };
}
