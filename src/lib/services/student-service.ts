import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PendingTeacher {
  assignmentId: string;
  teacherId: string;
  teacherName: string;
  photoUrl: string | null;
  subjectName: string;
}

export async function getStudentEvaluationContext(studentId: string) {
  const admin = createAdminClient();
  const { data: student } = await admin.from("students").select("id,full_name,grade_id,academic_year_id").eq("id", studentId).eq("active", true).maybeSingle();
  if (!student) return null;
  const now = new Date().toISOString();
  const [{ data: grade }, { data: period }, { data: assignments }] = await Promise.all([
    admin.from("grades").select("name").eq("id", student.grade_id).single(),
    admin.from("evaluation_periods").select("id,name,allow_feedback").eq("academic_year_id", student.academic_year_id).eq("active", true).lte("start_date", now).gte("end_date", now).limit(1).maybeSingle(),
    admin.from("teacher_assignments").select("id,teacher_id,subject_id").eq("grade_id", student.grade_id).eq("academic_year_id", student.academic_year_id).eq("active", true)
  ]);
  if (!period) return { student, gradeName: grade?.name ?? "", period: null, pending: [], completed: [] };
  const teacherIds = [...new Set((assignments ?? []).map((item) => item.teacher_id))];
  const subjectIds = [...new Set((assignments ?? []).map((item) => item.subject_id))];
  const [{ data: teachers }, { data: subjects }, { data: evaluations }] = await Promise.all([
    teacherIds.length ? admin.from("teachers").select("id,full_name,photo_url").in("id", teacherIds).eq("active", true) : Promise.resolve({ data: [] }),
    subjectIds.length ? admin.from("subjects").select("id,name").in("id", subjectIds).eq("active", true) : Promise.resolve({ data: [] }),
    admin.from("evaluations").select("teacher_id").eq("student_id", student.id).eq("evaluation_period_id", period.id)
  ]);
  const completedIds = new Set((evaluations ?? []).map((item) => item.teacher_id));
  const teacherMap = new Map((teachers ?? []).map((item) => [item.id, item]));
  const subjectMap = new Map((subjects ?? []).map((item) => [item.id, item.name]));
  const unique = new Map<string, PendingTeacher>();
  for (const assignment of assignments ?? []) {
    const teacher = teacherMap.get(assignment.teacher_id);
    if (teacher && !unique.has(teacher.id)) unique.set(teacher.id, {
      assignmentId: assignment.id,
      teacherId: teacher.id,
      teacherName: teacher.full_name,
      photoUrl: teacher.photo_url,
      subjectName: subjectMap.get(assignment.subject_id) ?? "Asignatura"
    });
  }
  const all = [...unique.values()];
  return {
    student, gradeName: grade?.name ?? "", period,
    pending: all.filter((item) => !completedIds.has(item.teacherId)),
    completed: all.filter((item) => completedIds.has(item.teacherId))
  };
}

export async function getEvaluationFormContext(studentId: string, teacherId: string) {
  const context = await getStudentEvaluationContext(studentId);
  if (!context?.period) return null;
  const teacher = context.pending.find((item) => item.teacherId === teacherId);
  if (!teacher) return null;
  const { data: questions } = await createAdminClient().from("evaluation_questions")
    .select("id,text,category,order_number").eq("active", true).order("order_number");
  return { ...context, teacher, questions: questions ?? [] };
}
