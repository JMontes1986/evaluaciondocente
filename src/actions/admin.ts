"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/permissions";
import { questionSchema, studentSchema, subjectSchema, teacherAssignmentSchema, teacherSchema, updateSubjectSchema } from "@/lib/validation/schemas";

async function audit(userId: string, action: string, entity: string, entityId?: string) {
  await createAdminClient().from("audit_logs").insert({ user_id: userId, action, entity, entity_id: entityId ?? null });
}

export async function createTeacherAction(formData: FormData) {
  const adminUser = await requireAdmin();
  const parsed = teacherSchema.safeParse({ fullName: formData.get("fullName"), email: formData.get("email"), documentNumber: formData.get("documentNumber") });
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
  const adminUser = await requireAdmin();
  const parsed = studentSchema.safeParse({ code: formData.get("code"), fullName: formData.get("fullName"), gradeId: formData.get("gradeId"), academicYearId: formData.get("academicYearId") });
  if (!parsed.success) return;
  const { data } = await createAdminClient().from("students").insert({
    code: parsed.data.code, full_name: parsed.data.fullName,
    grade_id: parsed.data.gradeId, academic_year_id: parsed.data.academicYearId
  }).select("id").single();
  await audit(adminUser.id, "ADMIN_CREATE_STUDENT", "students", data?.id);
  revalidatePath("/administracion/estudiantes");
}

export async function createTeacherAssignmentAction(formData: FormData) {
  const adminUser = await requireAdmin();
  const parsed = teacherAssignmentSchema.safeParse({
    teacherId: formData.get("teacherId"),
    subjectId: formData.get("subjectId"),
    gradeId: formData.get("gradeId"),
    academicYearId: formData.get("academicYearId")
  });
  if (!parsed.success) return;

  const admin = createAdminClient();
  const { data } = await admin
    .from("teacher_assignments")
    .upsert({
      teacher_id: parsed.data.teacherId,
      subject_id: parsed.data.subjectId,
      grade_id: parsed.data.gradeId,
      academic_year_id: parsed.data.academicYearId,
      active: true
    }, { onConflict: "teacher_id,grade_id,subject_id,academic_year_id" })
    .select("id")
    .single();

  await audit(adminUser.id, "ADMIN_UPSERT_TEACHER_ASSIGNMENT", "teacher_assignments", data?.id);
  revalidatePath("/administracion/asignaciones");
  revalidatePath("/evaluacion");
}

export async function createSubjectAction(formData: FormData) {
  const adminUser = await requireAdmin();
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
  const adminUser = await requireAdmin();
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

export async function createQuestionAction(formData: FormData) {
  const adminUser = await requireAdmin();
  const parsed = questionSchema.safeParse({ text: formData.get("text"), category: formData.get("category"), orderNumber: formData.get("orderNumber") });
  if (!parsed.success) return;
  const { data } = await createAdminClient().from("evaluation_questions").insert({
    text: parsed.data.text, category: parsed.data.category || null, order_number: parsed.data.orderNumber
  }).select("id").single();
  await audit(adminUser.id, "ADMIN_CREATE_QUESTION", "evaluation_questions", data?.id);
  revalidatePath("/administracion/preguntas");
}

const toggleTables = ["teachers", "students", "grades", "subjects", "teacher_assignments", "evaluation_questions", "evaluation_periods"] as const;
type ToggleTable = typeof toggleTables[number];

export async function toggleActiveAction(table: ToggleTable, id: string, active: boolean) {
  const adminUser = await requireAdmin();
  if (!toggleTables.includes(table)) return;
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
