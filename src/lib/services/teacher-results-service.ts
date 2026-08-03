import "server-only";

import { requireModule } from "@/lib/auth/permissions";
import { getSystemSettings } from "@/lib/services/system-settings-service";
import { createAdminClient } from "@/lib/supabase/admin";

export interface TeacherQuestionResult {
  id: string;
  label: string;
  question: string;
  category: string | null;
  orderNumber: number;
  average: number;
  responses: number;
  always: number;
  almostAlways: number;
  sometimes: number;
  never: number;
}

interface TeacherReport {
  available: boolean;
  responseCount: number;
  average: number;
  questions: TeacherQuestionResult[];
  comments: string[];
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function parseReport(value: unknown): TeacherReport {
  const report = objectValue(value);
  const questions = Array.isArray(report.questions)
    ? report.questions.map((item): TeacherQuestionResult => {
        const question = objectValue(item);
        const distribution = objectValue(question.distribution);
        const always = numberValue(distribution.always);
        const almostAlways = numberValue(distribution.almost_always);
        const sometimes = numberValue(distribution.sometimes);
        const never = numberValue(distribution.never);
        const orderNumber = numberValue(question.order_number);
        return {
          id: String(question.question_id ?? ""),
          label: `P${orderNumber}`,
          question: String(question.text ?? "Pregunta"),
          category: typeof question.category === "string" ? question.category : null,
          orderNumber,
          average: numberValue(question.average),
          responses: always + almostAlways + sometimes + never,
          always,
          almostAlways,
          sometimes,
          never
        };
      })
    : [];
  const comments = Array.isArray(report.comments)
    ? report.comments
        .filter((comment): comment is string => typeof comment === "string")
        .map((comment) => comment.trim())
        .filter(Boolean)
    : [];

  return {
    available: report.available === true,
    responseCount: numberValue(report.response_count),
    average: numberValue(report.average),
    questions: questions.sort((a, b) => a.orderNumber - b.orderNumber),
    comments
  };
}

export async function getTeacherResults({
  teacherId,
  periodId
}: {
  teacherId?: string;
  periodId?: string;
}) {
  await requireModule("resultados_docentes");
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const [{ data: teachers }, { data: periods }, settings] = await Promise.all([
    admin.from("teachers").select("id,full_name,email,active").order("full_name"),
    admin
      .from("evaluation_periods")
      .select("id,name,active,start_date,end_date,allow_feedback")
      .order("start_date", { ascending: false }),
    getSystemSettings()
  ]);

  const teacher = (teachers ?? []).find((item) => item.id === teacherId) ?? null;
  const requestedPeriod = (periods ?? []).find((item) => item.id === periodId);
  const currentPeriod = (periods ?? []).find(
    (item) => item.active && item.start_date <= now && item.end_date >= now
  );
  const period = requestedPeriod ?? currentPeriod ?? periods?.[0] ?? null;

  if (!teacher || !period) {
    return {
      teachers: teachers ?? [],
      periods: periods ?? [],
      teacher,
      period,
      minResponses: settings.minResponses,
      report: null,
      distribution: [],
      lowestQuestion: null,
      highestQuestion: null,
      error: null
    };
  }

  const { data, error } = await admin.rpc("get_teacher_report", {
    p_teacher_id: teacher.id,
    p_period_id: period.id,
    p_min_responses: settings.minResponses
  });
  const report = parseReport(data);
  const rankedQuestions = [...report.questions].sort((a, b) => a.average - b.average);

  return {
    teachers: teachers ?? [],
    periods: periods ?? [],
    teacher,
    period,
    minResponses: settings.minResponses,
    report,
    distribution: [
      { name: "Nunca", score: 1, count: report.questions.reduce((sum, item) => sum + item.never, 0) },
      { name: "Algunas veces", score: 2, count: report.questions.reduce((sum, item) => sum + item.sometimes, 0) },
      { name: "Casi siempre", score: 3, count: report.questions.reduce((sum, item) => sum + item.almostAlways, 0) },
      { name: "Siempre", score: 4, count: report.questions.reduce((sum, item) => sum + item.always, 0) }
    ],
    lowestQuestion: rankedQuestions[0] ?? null,
    highestQuestion: rankedQuestions.at(-1) ?? null,
    error: error?.message ?? null
  };
}
