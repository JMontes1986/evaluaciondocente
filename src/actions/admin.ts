"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireModule } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  questionSchema,
  reassignTeacherAssignmentsSchema,
  semesterEvaluationSchema,
  studentSchema,
  subjectSchema,
  teacherAssignmentSchema,
  teacherSchema,
  updateSubjectSchema
} from "@/lib/validation/schemas";

async function audit(userId: string, action: string, entity: string, entityId?: string) {
  await createAdminClient().from("audit_logs").insert({
    user_id: userId,
    action,
    entity,
    entity_id: entityId ?? null
  });
}

export async function createTeacherAction(formData: FormData) {
  const adminUser = await requireModule("docentes");
  const parsed = teacherSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    documentNumber: formData.get("documentNumber")
  });
  if (!parsed.success) return;
  const { data } = await createAdminClient().from("teachers").insert({
    full_name: parsed.data.fullName,
    email: parsed.data.email || null,
    document_number: parsed.data.documentNumber || null
  }).select("id").single();
  await audit(adminUser.id, "ADMIN_CREATE_TEACHER", "teachers", data?.id);
  revalidatePath("/administracion/docentes");
}

export async function createStudentAction(formData: FormData) {
  const adminUser = await requireModule("estudiantes");
  const parsed = studentSchema.safeParse({
    code: formData.get("code"),
    fullName: formData.get("fullName"),
    gradeId: formData.get("gradeId"),
    academicYearId: formData.get("academicYearId")
  });
  if (!parsed.success) return;
  const { data } = await createAdminClient().from("students").insert({
    code: parsed.data.code,
    full_name: parsed.data.fullName,
    grade_id: parsed.data.gradeId,
    academic_year_id: parsed.data.academicYearId
  }).select("id").single();
  await audit(adminUser.id, "ADMIN_CREATE_STUDENT", "students", data?.id);
  revalidatePath("/administracion/estudiantes");
}

export async function createTeacherAssignmentAction(formData: FormData) {
  const adminUser = await requireModule("asignaciones");
  const parsed = teacherAssignmentSchema.safeParse({
    teacherId: formData.get("teacherId"),
    subjectId: formData.get("subjectId"),
    gradeIds: formData.getAll("gradeIds"),
    academicYearId: formData.get("academicYearId")
  });
  if (!parsed.success) return;

  const admin = createAdminClient();
  const records = parsed.data.gradeIds.map((gradeId) => ({
    teacher_id: parsed.data.teacherId,
    subject_id: parsed.data.subjectId,
    grade_id: gradeId,
    academic_year_id: parsed.data.academicYearId,
    active: true
  }));
  const { data, error } = await admin
    .from("teacher_assignments")
    .upsert(records, { onConflict: "teacher_id,grade_id,subject_id,academic_year_id" })
    .select("id");
  if (error) return;

  await audit(adminUser.id, "ADMIN_BULK_UPSERT_TEACHER_ASSIGNMENTS", "teacher_assignments", data?.[0]?.id);
  revalidatePath("/administracion/asignaciones");
  revalidatePath("/evaluacion");
}

export async function reassignTeacherAssignmentsAction(formData: FormData) {
  const adminUser = await requireModule("asignaciones");
  const parsed = reassignTeacherAssignmentsSchema.safeParse({
    currentTeacherId: formData.get("currentTeacherId"),
    newTeacherId: formData.get("newTeacherId"),
    subjectId: formData.get("subjectId"),
    gradeIds: formData.getAll("gradeIds"),
    academicYearId: formData.get("academicYearId")
  });
  if (!parsed.success) redirect("/administracion/asignaciones?reasignacion=datos-invalidos");

  const admin = createAdminClient();
  const { data: newTeacher } = await admin
    .from("teachers")
    .select("id")
    .eq("id", parsed.data.newTeacherId)
    .eq("active", true)
    .maybeSingle();
  if (!newTeacher) redirect("/administracion/asignaciones?reasignacion=datos-invalidos");

  const { data: sourceAssignments, error: sourceError } = await admin
    .from("teacher_assignments")
    .select("id,grade_id")
    .eq("teacher_id", parsed.data.currentTeacherId)
    .eq("subject_id", parsed.data.subjectId)
    .eq("academic_year_id", parsed.data.academicYearId)
    .eq("active", true)
    .in("grade_id", parsed.data.gradeIds);

  if (sourceError || !sourceAssignments?.length) {
    redirect("/administracion/asignaciones?reasignacion=sin-coincidencias");
  }

  const targetRecords = sourceAssignments.map((assignment) => ({
    teacher_id: parsed.data.newTeacherId,
    subject_id: parsed.data.subjectId,
    grade_id: assignment.grade_id,
    academic_year_id: parsed.data.academicYearId,
    active: true
  }));
  const { error: targetError } = await admin
    .from("teacher_assignments")
    .upsert(targetRecords, { onConflict: "teacher_id,grade_id,subject_id,academic_year_id" });
  if (targetError) redirect("/administracion/asignaciones?reasignacion=error");

  const sourceIds = sourceAssignments.map((assignment) => assignment.id);
  const { error: deactivateError } = await admin
    .from("teacher_assignments")
    .update({ active: false })
    .in("id", sourceIds);
  if (deactivateError) redirect("/administracion/asignaciones?reasignacion=error");

  await admin.from("audit_logs").insert({
    user_id: adminUser.id,
    action: "ADMIN_REASSIGN_TEACHER_ASSIGNMENTS",
    entity: "teacher_assignments",
    entity_id: sourceIds[0],
    metadata: {
      previous_teacher_id: parsed.data.currentTeacherId,
      new_teacher_id: parsed.data.newTeacherId,
      subject_id: parsed.data.subjectId,
      academic_year_id: parsed.data.academicYearId,
      grade_ids: sourceAssignments.map((assignment) => assignment.grade_id),
      previous_assignment_ids: sourceIds
    }
  });
  revalidatePath("/administracion/asignaciones");
  revalidatePath("/evaluacion");
  redirect(`/administracion/asignaciones?reasignacion=ok&cantidad=${sourceIds.length}`);
}

export async function createSubjectAction(formData: FormData) {
  const adminUser = await requireModule("asignaturas");
  const parsed = subjectSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return;

  const { data, error } = await createAdminClient()
    .from("subjects")
    .insert({ name: parsed.data.name })
    .select("id")
    .single();
  if (error) return;

  await audit(adminUser.id, "ADMIN_CREATE_SUBJECT", "subjects", data.id);
  revalidatePath("/administracion/asignaturas");
}

export async function updateSubjectAction(formData: FormData) {
  const adminUser = await requireModule("asignaturas");
  const parsed = updateSubjectSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name")
  });
  if (!parsed.success) return;

  const { error } = await createAdminClient()
    .from("subjects")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.id);
  if (error) return;

  await audit(adminUser.id, "ADMIN_UPDATE_SUBJECT", "subjects", parsed.data.id);
  revalidatePath("/administracion/asignaturas");
  revalidatePath("/administracion/asignaciones");
  redirect("/administracion/asignaturas");
}

export async function saveSemesterEvaluationAction(formData: FormData) {
  const adminUser = await requireModule("periodos");
  const parsed = semesterEvaluationSchema.safeParse({
    semester: formData.get("semester"),
    academicYearId: formData.get("academicYearId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    active: formData.get("active") === "on",
    allowFeedback: formData.get("allowFeedback") === "on"
  });
  if (!parsed.success) return;

  const name = parsed.data.semester === "primer"
    ? "Evaluación docente primer semestre"
    : "Evaluación docente segundo semestre";
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("evaluation_periods")
    .select("id")
    .eq("name", name)
    .eq("academic_year_id", parsed.data.academicYearId)
    .maybeSingle();
  const values = {
    name,
    start_date: `${parsed.data.startDate}T00:00:00-05:00`,
    end_date: `${parsed.data.endDate}T23:59:59-05:00`,
    active: parsed.data.active,
    allow_feedback: parsed.data.allowFeedback
  };
  const result = existing
    ? await admin.from("evaluation_periods").update(values).eq("id", existing.id).select("id").single()
    : await admin.from("evaluation_periods").insert({
        ...values,
        academic_year_id: parsed.data.academicYearId
      }).select("id").single();
  if (result.error) return;

  await audit(adminUser.id, "ADMIN_SAVE_SEMESTER_EVALUATION", "evaluation_periods", result.data.id);
  revalidatePath("/administracion/periodos");
  revalidatePath("/administracion", "layout");
  redirect("/administracion/periodos");
}

export async function createQuestionAction(formData: FormData) {
  const adminUser = await requireModule("preguntas");
  const parsed = questionSchema.safeParse({
    text: formData.get("text"),
    category: formData.get("category"),
    orderNumber: formData.get("orderNumber")
  });
  if (!parsed.success) return;
  const { data } = await createAdminClient().from("evaluation_questions").insert({
    text: parsed.data.text,
    category: parsed.data.category || null,
    order_number: parsed.data.orderNumber
  }).select("id").single();
  await audit(adminUser.id, "ADMIN_CREATE_QUESTION", "evaluation_questions", data?.id);
  revalidatePath("/administracion/preguntas");
}

const toggleTables = [
  "teachers",
  "students",
  "grades",
  "subjects",
  "teacher_assignments",
  "evaluation_questions",
  "evaluation_periods"
] as const;
type ToggleTable = typeof toggleTables[number];

export async function toggleActiveAction(table: ToggleTable, id: string, active: boolean) {
  if (!toggleTables.includes(table)) return;
  const moduleByTable = {
    teachers: "docentes",
    students: "estudiantes",
    grades: "grados",
    subjects: "asignaturas",
    teacher_assignments: "asignaciones",
    evaluation_questions: "preguntas",
    evaluation_periods: "periodos"
  } as const;
  const adminUser = await requireModule(moduleByTable[table]);
  const admin = createAdminClient();
  if (table === "teachers") await admin.from("teachers").update({ active }).eq("id", id);
  if (table === "students") await admin.from("students").update({ active }).eq("id", id);
  if (table === "grades") await admin.from("grades").update({ active }).eq("id", id);
  if (table === "subjects") await admin.from("subjects").update({ active }).eq("id", id);
  if (table === "teacher_assignments") await admin.from("teacher_assignments").update({ active }).eq("id", id);
  if (table === "evaluation_questions") await admin.from("evaluation_questions").update({ active }).eq("id", id);
  if (table === "evaluation_periods") await admin.from("evaluation_periods").update({ active }).eq("id", id);
  await audit(adminUser.id, active ? "UPDATE_ACTIVATE" : "UPDATE_DEACTIVATE", table, id);
  revalidatePath("/administracion", "layout");
}
