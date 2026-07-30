import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface MonitoringFilters {
  periodId?: string;
  gradeId?: string;
  search?: string;
  studentId?: string;
}

interface EvaluationRow {
  id: string;
  student_id: string;
  teacher_id: string;
  submitted_at: string;
}

async function fetchEvaluations(periodId: string, studentIds: string[]) {
  const admin = createAdminClient();
  const evaluations: EvaluationRow[] = [];
  for (let start = 0; start < studentIds.length; start += 75) {
    const ids = studentIds.slice(start, start + 75);
    for (let offset = 0; ; offset += 1000) {
      const { data } = await admin
        .from("evaluations")
        .select("id,student_id,teacher_id,submitted_at")
        .eq("evaluation_period_id", periodId)
        .in("student_id", ids)
        .range(offset, offset + 999);
      const page = (data ?? []) as EvaluationRow[];
      evaluations.push(...page);
      if (page.length < 1000) break;
    }
  }
  return evaluations;
}

export async function getEvaluationMonitoring(filters: MonitoringFilters = {}) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const [{ data: periods }, { data: grades }] = await Promise.all([
    admin
      .from("evaluation_periods")
      .select("id,name,academic_year_id,active,start_date,end_date")
      .order("start_date", { ascending: false }),
    admin.from("grades").select("id,name,active").order("order_number")
  ]);
  const selectedPeriod = (periods ?? []).find((period) => period.id === filters.periodId)
    ?? (periods ?? []).find((period) => period.active && period.start_date <= now && period.end_date >= now)
    ?? periods?.[0]
    ?? null;

  if (!selectedPeriod) {
    return {
      period: null,
      periods: periods ?? [],
      grades: grades ?? [],
      students: [],
      selectedStudent: null,
      details: []
    };
  }

  let studentsQuery = admin
    .from("students")
    .select("id,code,full_name,grade_id,active")
    .eq("academic_year_id", selectedPeriod.academic_year_id)
    .order("full_name")
    .limit(500);
  if (filters.gradeId) studentsQuery = studentsQuery.eq("grade_id", filters.gradeId);
  if (filters.search) {
    const safeSearch = filters.search.replace(/[,.*()%_]/g, " ").replace(/\s+/g, " ").trim();
    if (safeSearch) studentsQuery = studentsQuery.or(`code.ilike.%${safeSearch}%,full_name.ilike.%${safeSearch}%`);
  }
  const { data: students } = await studentsQuery;
  const studentRows = students ?? [];
  const [{ data: assignments }, evaluations] = await Promise.all([
    admin
      .from("teacher_assignments")
      .select("id,teacher_id,grade_id,subject_id")
      .eq("academic_year_id", selectedPeriod.academic_year_id)
      .eq("active", true),
    fetchEvaluations(selectedPeriod.id, studentRows.map((student) => student.id))
  ]);

  const teacherIds = [...new Set([
    ...(assignments ?? []).map((assignment) => assignment.teacher_id),
    ...evaluations.map((evaluation) => evaluation.teacher_id)
  ])];
  const subjectIds = [...new Set((assignments ?? []).map((assignment) => assignment.subject_id))];
  const [{ data: teachers }, { data: subjects }] = await Promise.all([
    teacherIds.length
      ? admin.from("teachers").select("id,full_name,active").in("id", teacherIds)
      : Promise.resolve({ data: [] }),
    subjectIds.length
      ? admin.from("subjects").select("id,name,active").in("id", subjectIds)
      : Promise.resolve({ data: [] })
  ]);
  const activeTeacherIds = new Set((teachers ?? []).filter((teacher) => teacher.active).map((teacher) => teacher.id));
  const activeSubjectIds = new Set((subjects ?? []).filter((subject) => subject.active).map((subject) => subject.id));
  const teacherMap = new Map((teachers ?? []).map((teacher) => [teacher.id, teacher.full_name]));
  const subjectMap = new Map((subjects ?? []).map((subject) => [subject.id, subject.name]));
  const gradeMap = new Map((grades ?? []).map((grade) => [grade.id, grade.name]));
  const assignmentsByGrade = new Map<string, typeof assignments>();

  for (const assignment of assignments ?? []) {
    if (!activeTeacherIds.has(assignment.teacher_id) || !activeSubjectIds.has(assignment.subject_id)) continue;
    const current = assignmentsByGrade.get(assignment.grade_id) ?? [];
    current.push(assignment);
    assignmentsByGrade.set(assignment.grade_id, current);
  }

  const evaluationsByStudent = new Map<string, EvaluationRow[]>();
  for (const evaluation of evaluations) {
    const current = evaluationsByStudent.get(evaluation.student_id) ?? [];
    current.push(evaluation);
    evaluationsByStudent.set(evaluation.student_id, current);
  }

  const summaries = studentRows.map((student) => {
    const expectedTeachers = new Set(
      (assignmentsByGrade.get(student.grade_id) ?? []).map((assignment) => assignment.teacher_id)
    );
    const completedTeachers = new Set(
      (evaluationsByStudent.get(student.id) ?? []).map((evaluation) => evaluation.teacher_id)
    );
    const completed = [...completedTeachers].filter((teacherId) => expectedTeachers.has(teacherId)).length;
    return {
      ...student,
      gradeName: gradeMap.get(student.grade_id) ?? "Grado",
      expected: expectedTeachers.size,
      completed,
      pending: Math.max(0, expectedTeachers.size - completed)
    };
  });

  const selectedStudent = summaries.find((student) => student.id === filters.studentId) ?? null;
  const details: {
    teacherId: string;
    teacherName: string;
    subjectNames: string[];
    evaluationId: string | null;
    submittedAt: string | null;
  }[] = [];

  if (selectedStudent) {
    const groupedAssignments = new Map<string, Set<string>>();
    for (const assignment of assignmentsByGrade.get(selectedStudent.grade_id) ?? []) {
      const names = groupedAssignments.get(assignment.teacher_id) ?? new Set<string>();
      names.add(subjectMap.get(assignment.subject_id) ?? "Asignatura");
      groupedAssignments.set(assignment.teacher_id, names);
    }
    const completedByTeacher = new Map(
      (evaluationsByStudent.get(selectedStudent.id) ?? []).map((evaluation) => [evaluation.teacher_id, evaluation])
    );
    for (const teacherId of completedByTeacher.keys()) {
      if (!groupedAssignments.has(teacherId)) {
        groupedAssignments.set(teacherId, new Set(["Asignación no vigente"]));
      }
    }
    for (const [teacherId, subjectNames] of groupedAssignments) {
      const evaluation = completedByTeacher.get(teacherId);
      details.push({
        teacherId,
        teacherName: teacherMap.get(teacherId) ?? "Docente",
        subjectNames: [...subjectNames],
        evaluationId: evaluation?.id ?? null,
        submittedAt: evaluation?.submitted_at ?? null
      });
    }
    details.sort((a, b) => a.teacherName.localeCompare(b.teacherName, "es"));
  }

  return {
    period: selectedPeriod,
    periods: periods ?? [],
    grades: (grades ?? []).filter((grade) => grade.active),
    students: summaries,
    selectedStudent,
    details
  };
}
