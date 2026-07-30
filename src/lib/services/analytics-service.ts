import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface DashboardFilters {
  periodId?: string;
  teacherId?: string;
  gradeId?: string;
}

export interface AverageDatum {
  id: string;
  name: string;
  average: number;
  responses: number;
}

export interface QuestionDatum {
  id: string;
  label: string;
  question: string;
  average: number;
  responses: number;
  always: number;
  almostAlways: number;
  sometimes: number;
  never: number;
}

export interface ScatterDatum {
  name: string;
  teacher: string;
  grade: string;
  average: number;
  responses: number;
}

export interface HeatmapDatum {
  teacherId: string;
  teacher: string;
  grades: Record<string, { average: number; responses: number }>;
}

interface EvaluationRow {
  id: string;
  teacher_id: string;
  student_id: string;
  grade_id: string;
}

interface AnswerRow {
  evaluation_id: string;
  question_id: string;
  score: number;
}

async function fetchEvaluations(periodId: string, filters: DashboardFilters): Promise<EvaluationRow[]> {
  const admin = createAdminClient();
  const evaluations: EvaluationRow[] = [];

  for (let offset = 0; ; offset += 1000) {
    let query = admin
      .from("evaluations")
      .select("id,teacher_id,student_id,grade_id")
      .eq("evaluation_period_id", periodId)
      .range(offset, offset + 999);
    if (filters.teacherId) query = query.eq("teacher_id", filters.teacherId);
    if (filters.gradeId) query = query.eq("grade_id", filters.gradeId);
    const { data } = await query;
    const page = (data ?? []) as EvaluationRow[];
    evaluations.push(...page);
    if (page.length < 1000) break;
  }

  return evaluations;
}

async function fetchAnswers(evaluationIds: string[]): Promise<AnswerRow[]> {
  const admin = createAdminClient();
  const answers: AnswerRow[] = [];

  for (let start = 0; start < evaluationIds.length; start += 100) {
    const ids = evaluationIds.slice(start, start + 100);
    for (let offset = 0; ; offset += 1000) {
      const { data } = await admin
        .from("evaluation_answers")
        .select("evaluation_id,question_id,score")
        .in("evaluation_id", ids)
        .range(offset, offset + 999);
      const page = data ?? [];
      answers.push(...page);
      if (page.length < 1000) break;
    }
  }

  return answers;
}

function average(sum: number, count: number) {
  return count ? Number((sum / count).toFixed(2)) : 0;
}

export async function getDashboardData(filters: DashboardFilters = {}) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const [{ data: periods }, { data: teachers }, { data: grades }, { data: questions }] = await Promise.all([
    admin.from("evaluation_periods").select("id,name,active,start_date,end_date").order("start_date", { ascending: false }),
    admin.from("teachers").select("id,full_name,active").order("full_name"),
    admin.from("grades").select("id,name,active").order("order_number"),
    admin.from("evaluation_questions").select("id,text,order_number").order("order_number")
  ]);

  const requestedPeriod = (periods ?? []).find((period) => period.id === filters.periodId);
  const currentPeriod = (periods ?? []).find(
    (period) => period.active && period.start_date <= now && period.end_date >= now
  );
  const period = requestedPeriod ?? currentPeriod ?? periods?.[0] ?? null;
  const configuredMinResponses = Number(process.env.MIN_RESPONSES_FOR_REPORT ?? 5);
  const minResponses = Number.isFinite(configuredMinResponses)
    ? Math.max(1, configuredMinResponses)
    : 5;

  if (!period) {
    return {
      period: null,
      periods: periods ?? [],
      teachers: teachers ?? [],
      grades: grades ?? [],
      minResponses,
      metrics: { evaluations: 0, students: 0, teachers: 0, average: 0 },
      teacherAverages: [] as AverageDatum[],
      gradeAverages: [] as AverageDatum[],
      questionAverages: [] as QuestionDatum[],
      scatter: [] as ScatterDatum[],
      heatmap: [] as HeatmapDatum[],
      distribution: [] as { name: string; score: number; count: number }[],
      highestTeacher: null as AverageDatum | null,
      lowestTeacher: null as AverageDatum | null,
      highestQuestion: null as QuestionDatum | null,
      lowestQuestion: null as QuestionDatum | null
    };
  }

  const evaluations = await fetchEvaluations(period.id, filters);
  const answers = evaluations.length >= minResponses
    ? await fetchAnswers(evaluations.map((evaluation) => evaluation.id))
    : [];

  const teacherMap = new Map((teachers ?? []).map((teacher) => [teacher.id, teacher.full_name]));
  const gradeMap = new Map((grades ?? []).map((grade) => [grade.id, grade.name]));
  const questionMap = new Map((questions ?? []).map((question) => [question.id, question]));
  const evaluationMap = new Map(evaluations.map((evaluation) => [evaluation.id, evaluation]));
  const responseCountsByTeacher = new Map<string, number>();
  const responseCountsByGrade = new Map<string, number>();
  const responseCountsByTeacherGrade = new Map<string, number>();

  for (const evaluation of evaluations) {
    responseCountsByTeacher.set(evaluation.teacher_id, (responseCountsByTeacher.get(evaluation.teacher_id) ?? 0) + 1);
    responseCountsByGrade.set(evaluation.grade_id, (responseCountsByGrade.get(evaluation.grade_id) ?? 0) + 1);
    const key = `${evaluation.teacher_id}:${evaluation.grade_id}`;
    responseCountsByTeacherGrade.set(key, (responseCountsByTeacherGrade.get(key) ?? 0) + 1);
  }

  const teacherScores = new Map<string, { sum: number; count: number }>();
  const gradeScores = new Map<string, { sum: number; count: number }>();
  const questionScores = new Map<string, { sum: number; count: number; scores: [number, number, number, number] }>();
  const teacherGradeScores = new Map<string, { sum: number; count: number }>();
  const distributionCounts = [0, 0, 0, 0];

  for (const answer of answers) {
    const evaluation = evaluationMap.get(answer.evaluation_id);
    if (!evaluation) continue;
    const teacherScore = teacherScores.get(evaluation.teacher_id) ?? { sum: 0, count: 0 };
    teacherScore.sum += answer.score;
    teacherScore.count += 1;
    teacherScores.set(evaluation.teacher_id, teacherScore);

    const gradeScore = gradeScores.get(evaluation.grade_id) ?? { sum: 0, count: 0 };
    gradeScore.sum += answer.score;
    gradeScore.count += 1;
    gradeScores.set(evaluation.grade_id, gradeScore);

    const questionScore = questionScores.get(answer.question_id) ?? {
      sum: 0,
      count: 0,
      scores: [0, 0, 0, 0] as [number, number, number, number]
    };
    questionScore.sum += answer.score;
    questionScore.count += 1;
    questionScore.scores[answer.score - 1] += 1;
    questionScores.set(answer.question_id, questionScore);

    const combination = `${evaluation.teacher_id}:${evaluation.grade_id}`;
    const combinedScore = teacherGradeScores.get(combination) ?? { sum: 0, count: 0 };
    combinedScore.sum += answer.score;
    combinedScore.count += 1;
    teacherGradeScores.set(combination, combinedScore);
    distributionCounts[answer.score - 1] += 1;
  }

  const teacherAverages: AverageDatum[] = [...teacherScores.entries()]
    .map(([id, score]) => ({
      id,
      name: teacherMap.get(id) ?? "Docente",
      average: average(score.sum, score.count),
      responses: responseCountsByTeacher.get(id) ?? 0
    }))
    .filter((item) => item.responses >= minResponses)
    .sort((a, b) => b.average - a.average);

  const gradeAverages: AverageDatum[] = [...gradeScores.entries()]
    .map(([id, score]) => ({
      id,
      name: gradeMap.get(id) ?? "Grado",
      average: average(score.sum, score.count),
      responses: responseCountsByGrade.get(id) ?? 0
    }))
    .filter((item) => item.responses >= minResponses)
    .sort((a, b) => b.average - a.average);

  const questionAverages: QuestionDatum[] = [...questionScores.entries()]
    .map(([id, score]) => {
      const question = questionMap.get(id);
      return {
        id,
        label: `P${question?.order_number ?? ""}`,
        question: question?.text ?? "Pregunta",
        average: average(score.sum, score.count),
        responses: score.count,
        always: score.scores[3],
        almostAlways: score.scores[2],
        sometimes: score.scores[1],
        never: score.scores[0]
      };
    })
    .filter((item) => item.responses >= minResponses)
    .sort((a, b) => Number(a.label.slice(1)) - Number(b.label.slice(1)));

  const scatter: ScatterDatum[] = [...teacherGradeScores.entries()]
    .map(([key, score]) => {
      const [teacherId, gradeId] = key.split(":");
      return {
        name: `${teacherMap.get(teacherId) ?? "Docente"} · ${gradeMap.get(gradeId) ?? "Grado"}`,
        teacher: teacherMap.get(teacherId) ?? "Docente",
        grade: gradeMap.get(gradeId) ?? "Grado",
        average: average(score.sum, score.count),
        responses: responseCountsByTeacherGrade.get(key) ?? 0
      };
    })
    .filter((item) => item.responses >= minResponses);

  const heatmap: HeatmapDatum[] = teacherAverages.map((teacher) => {
    const cells: HeatmapDatum["grades"] = {};
    for (const grade of grades ?? []) {
      const key = `${teacher.id}:${grade.id}`;
      const score = teacherGradeScores.get(key);
      const responses = responseCountsByTeacherGrade.get(key) ?? 0;
      if (score && responses >= minResponses) {
        cells[grade.id] = { average: average(score.sum, score.count), responses };
      }
    }
    return { teacherId: teacher.id, teacher: teacher.name, grades: cells };
  });

  const sortedQuestions = [...questionAverages].sort((a, b) => b.average - a.average);
  const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);

  return {
    period,
    periods: periods ?? [],
    teachers: (teachers ?? []).filter((teacher) => teacher.active),
    grades: (grades ?? []).filter((grade) => grade.active),
    minResponses,
    metrics: {
      evaluations: evaluations.length,
      students: new Set(evaluations.map((evaluation) => evaluation.student_id)).size,
      teachers: new Set(evaluations.map((evaluation) => evaluation.teacher_id)).size,
      average: average(totalScore, answers.length)
    },
    teacherAverages,
    gradeAverages,
    questionAverages,
    scatter,
    heatmap,
    distribution: [
      { name: "Nunca", score: 1, count: distributionCounts[0] },
      { name: "Algunas Veces", score: 2, count: distributionCounts[1] },
      { name: "Casi Siempre", score: 3, count: distributionCounts[2] },
      { name: "Siempre", score: 4, count: distributionCounts[3] }
    ],
    highestTeacher: teacherAverages[0] ?? null,
    lowestTeacher: teacherAverages.at(-1) ?? null,
    highestQuestion: sortedQuestions[0] ?? null,
    lowestQuestion: sortedQuestions.at(-1) ?? null
  };
}
