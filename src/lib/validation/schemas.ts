import { z } from "zod";

export const studentCodeSchema = z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9-]+$/);
export const institutionalEmailSchema = z.string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Ingresa un correo institucional válido."))
  .refine((email) => email.endsWith("@colgemelli.edu.co"), {
    message: "Solo se permiten correos del dominio @colgemelli.edu.co."
  });

export const loginSchema = z.object({ email: institutionalEmailSchema, password: z.string().min(8).max(128) });
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z.string()
    .min(12, "La nueva contraseña debe tener al menos 12 caracteres.")
    .max(128, "La nueva contraseña es demasiado larga.")
    .regex(/[a-z]/, "Incluye al menos una letra minúscula.")
    .regex(/[A-Z]/, "Incluye al menos una letra mayúscula.")
    .regex(/[0-9]/, "Incluye al menos un número."),
  confirmPassword: z.string().min(12).max(128)
}).refine((value) => value.newPassword === value.confirmPassword, {
  message: "Las contraseñas nuevas no coinciden.",
  path: ["confirmPassword"]
}).refine((value) => value.currentPassword !== value.newPassword, {
  message: "La nueva contraseña debe ser diferente de la actual.",
  path: ["newPassword"]
});
export const teacherSchema = z.object({
  fullName: z.string().trim().min(3).max(180),
  email: z.union([z.email(), z.literal("")]).optional(),
  documentNumber: z.string().trim().max(40).optional()
});
export const studentSchema = z.object({
  code: studentCodeSchema,
  fullName: z.string().trim().min(3).max(180),
  gradeId: z.uuid(),
  academicYearId: z.uuid()
});
export const teacherAssignmentSchema = z.object({
  teacherId: z.uuid(),
  subjectId: z.uuid(),
  gradeIds: z.array(z.uuid()).min(1).max(20),
  academicYearId: z.uuid()
});
export const reassignTeacherAssignmentsSchema = z.object({
  currentTeacherId: z.uuid(),
  newTeacherId: z.uuid(),
  subjectId: z.uuid(),
  gradeIds: z.array(z.uuid()).min(1).max(20),
  academicYearId: z.uuid()
}).refine((value) => value.currentTeacherId !== value.newTeacherId, {
  message: "El nuevo docente debe ser diferente al actual.",
  path: ["newTeacherId"]
});
export const subjectSchema = z.object({
  name: z.string().trim().min(2).max(120)
});
export const updateSubjectSchema = subjectSchema.extend({
  id: z.uuid()
});
export const questionSchema = z.object({
  text: z.string().trim().min(10).max(500),
  category: z.string().trim().max(120).optional(),
  orderNumber: z.coerce.number().int().positive()
});
export const periodSchema = z.object({
  name: z.string().trim().min(3).max(160),
  academicYearId: z.uuid(),
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime(),
  active: z.boolean().default(false),
  allowFeedback: z.boolean().default(true)
}).refine((value) => new Date(value.endDate) > new Date(value.startDate), { message: "La fecha final debe ser posterior a la inicial." });
export const semesterEvaluationSchema = z.object({
  semester: z.enum(["primer", "segundo"]),
  academicYearId: z.uuid(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  active: z.boolean().default(false),
  allowFeedback: z.boolean().default(true)
}).refine((value) => value.endDate >= value.startDate, {
  message: "La fecha final debe ser igual o posterior a la inicial."
});
export const evaluationSchema = z.object({
  teacherId: z.uuid(),
  assignmentId: z.uuid(),
  periodId: z.uuid(),
  answers: z.array(z.object({ questionId: z.uuid(), score: z.number().int().min(1).max(4) })).min(1),
  feedback: z.string().trim().max(2000).optional()
});
