import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getDashboardData() {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: period } = await admin.from("evaluation_periods").select("id,name").eq("active", true).lte("start_date", now).gte("end_date", now).limit(1).maybeSingle();
  const { data: rawStats } = await admin.rpc("get_dashboard_statistics", { p_period_id: period?.id ?? null });
  const stats = rawStats ?? { students: 0, evaluations: 0, teachers: 0, participation_percent: 0, completion_percent: 0, average_score: 0 };
  if (!period) return { period: null, stats, teacherAverages: [] };
  const { data: evaluations } = await admin.from("evaluations").select("id,teacher_id").eq("evaluation_period_id", period.id);
  const ids = (evaluations ?? []).map((item) => item.id);
  const teacherIds = [...new Set((evaluations ?? []).map((item) => item.teacher_id))];
  const [{ data: answers }, { data: teachers }] = await Promise.all([
    ids.length ? admin.from("evaluation_answers").select("evaluation_id,score").in("evaluation_id", ids) : Promise.resolve({ data: [] }),
    teacherIds.length ? admin.from("teachers").select("id,full_name").in("id", teacherIds) : Promise.resolve({ data: [] })
  ]);
  const evaluationTeacher = new Map((evaluations ?? []).map((item) => [item.id, item.teacher_id]));
  const sums = new Map<string, { sum: number; count: number }>();
  for (const answer of answers ?? []) {
    const teacherId = evaluationTeacher.get(answer.evaluation_id);
    if (!teacherId) continue;
    const current = sums.get(teacherId) ?? { sum: 0, count: 0 };
    sums.set(teacherId, { sum: current.sum + answer.score, count: current.count + 1 });
  }
  const teacherAverages = (teachers ?? []).map((teacher) => {
    const value = sums.get(teacher.id);
    return { name: teacher.full_name.split(" ").slice(0, 2).join(" "), average: value ? Number((value.sum / value.count).toFixed(2)) : 0 };
  }).sort((a,b) => b.average-a.average);
  return { period, stats, teacherAverages };
}
