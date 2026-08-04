import "server-only";

import { requireModule } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSystemSettings } from "@/lib/services/system-settings-service";

interface EvaluationRow {
  id: string;
  teacher_id: string;
  student_id: string;
  grade_id: string;
  feedback: string | null;
  submitted_at: string;
}

interface AnswerRow {
  evaluation_id: string;
  question_id: string;
  score: number;
}

function average(scores: number[]) {
  return scores.length ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2)) : 0;
}

function favorable(scores: number[]) {
  return scores.length
    ? Number(((scores.filter((score) => score >= 3).length / scores.length) * 100).toFixed(1))
    : 0;
}

async function fetchEvaluations(periodId: string) {
  const admin = createAdminClient();
  const rows: EvaluationRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data } = await admin
      .from("evaluations")
      .select("id,teacher_id,student_id,grade_id,feedback,submitted_at")
      .eq("evaluation_period_id", periodId)
      .range(offset, offset + 999);
    const page = (data ?? []) as EvaluationRow[];
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}

async function fetchAnswers(evaluationIds: string[]) {
  const admin = createAdminClient();
  const rows: AnswerRow[] = [];
  for (let start = 0; start < evaluationIds.length; start += 100) {
    const ids = evaluationIds.slice(start, start + 100);
    for (let offset = 0; ; offset += 1000) {
      const { data } = await admin
        .from("evaluation_answers")
        .select("evaluation_id,question_id,score")
        .in("evaluation_id", ids)
        .range(offset, offset + 999);
      const page = (data ?? []) as AnswerRow[];
      rows.push(...page);
      if (page.length < 1000) break;
    }
  }
  return rows;
}

export async function getReportsOverview(periodId?: string) {
  await requireModule("informes");
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const [{ data: periods }, { data: teachers }, { data: grades }, { data: questions }, settings] = await Promise.all([
    admin.from("evaluation_periods").select("id,name,active,start_date,end_date").order("start_date", { ascending: false }),
    admin.from("teachers").select("id,full_name").order("full_name"),
    admin.from("grades").select("id,name,order_number").order("order_number"),
    admin.from("evaluation_questions").select("id,text,category,order_number").order("order_number"),
    getSystemSettings()
  ]);

  const period = (periods ?? []).find((item) => item.id === periodId)
    ?? (periods ?? []).find((item) => item.active && item.start_date <= now && item.end_date >= now)
    ?? periods?.[0]
    ?? null;

  if (!period) {
    return {
      periods: periods ?? [], period: null, minResponses: settings.minResponses,
      metrics: { evaluations: 0, students: 0, teachers: 0, average: 0, favorable: 0, comments: 0 },
      teachers: [], questions: [], grades: [], activity: []
    };
  }

  const evaluations = await fetchEvaluations(period.id);
  const answers = await fetchAnswers(evaluations.map((item) => item.id));
  const allScores = answers.map((item) => item.score);

  const teacherRows = (teachers ?? []).map((teacher) => {
    const teacherEvaluations = evaluations.filter((item) => item.teacher_id === teacher.id);
    const ids = new Set(teacherEvaluations.map((item) => item.id));
    const scores = answers.filter((item) => ids.has(item.evaluation_id)).map((item) => item.score);
    const available = teacherEvaluations.length >= settings.minResponses;
    return {
      id: teacher.id,
      name: teacher.full_name,
      evaluations: teacherEvaluations.length,
      average: available ? average(scores) : null,
      favorable: available ? favorable(scores) : null,
      comments: teacherEvaluations.filter((item) => item.feedback?.trim()).length,
      available
    };
  }).filter((item) => item.evaluations > 0).sort((a, b) => (b.average ?? -1) - (a.average ?? -1));

  const questionRows = (questions ?? []).map((question) => {
    const scores = answers.filter((item) => item.question_id === question.id).map((item) => item.score);
    const available = evaluations.length >= settings.minResponses;
    return {
      id: question.id,
      label: `P${question.order_number}`,
      question: question.text,
      category: question.category,
      responses: scores.length,
      average: available ? average(scores) : null,
      favorable: available ? favorable(scores) : null,
      priority: available && average(scores) < 2.5
    };
  }).filter((item) => item.responses > 0).sort((a, b) => (a.average ?? 5) - (b.average ?? 5));

  const gradeRows = (grades ?? []).map((grade) => {
    const gradeEvaluations = evaluations.filter((item) => item.grade_id === grade.id);
    const ids = new Set(gradeEvaluations.map((item) => item.id));
    const scores = answers.filter((item) => ids.has(item.evaluation_id)).map((item) => item.score);
    const available = gradeEvaluations.length >= settings.minResponses;
    return {
      id: grade.id,
      name: grade.name,
      evaluations: gradeEvaluations.length,
      students: new Set(gradeEvaluations.map((item) => item.student_id)).size,
      average: available ? average(scores) : null,
      favorable: available ? favorable(scores) : null,
      available
    };
  }).filter((item) => item.evaluations > 0);

  const activityMap = new Map<string, number>();
  for (const evaluation of evaluations) {
    const day = evaluation.submitted_at.slice(0, 10);
    activityMap.set(day, (activityMap.get(day) ?? 0) + 1);
  }
  const activity = [...activityMap.entries()].map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));

  return {
    periods: periods ?? [],
    period,
    minResponses: settings.minResponses,
    metrics: {
      evaluations: evaluations.length,
      students: new Set(evaluations.map((item) => item.student_id)).size,
      teachers: new Set(evaluations.map((item) => item.teacher_id)).size,
      average: evaluations.length >= settings.minResponses ? average(allScores) : 0,
      favorable: evaluations.length >= settings.minResponses ? favorable(allScores) : 0,
      comments: evaluations.filter((item) => item.feedback?.trim()).length
    },
    teachers: teacherRows,
    questions: questionRows,
    grades: gradeRows,
    activity
  };
}

export async function getPeriodSummary(periodId: string) {
  const report = await getReportsOverview(periodId);
  return {
    period: report.period?.name ?? "Periodo",
    evaluationCount: report.metrics.evaluations,
    rows: report.teachers.map((teacher) => ({
      name: teacher.name,
      responses: teacher.evaluations,
      average: teacher.average ?? 0
    }))
  };
}
