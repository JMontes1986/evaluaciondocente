import { z } from "zod";

export const studentCodeSchema = z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9-]+$/);
export const loginSchema = z.object({ email: z.email(), password: z.string().min(8).max(128) });
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
  gradeId: z.uuid(),
  academicYearId: z.uuid()
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
export const evaluationSchema = z.object({
  teacherId: z.uuid(),
  assignmentId: z.uuid(),
  periodId: z.uuid(),
  answers: z.array(z.object({ questionId: z.uuid(), score: z.number().int().min(1).max(4) })).min(1),
  feedback: z.string().trim().max(2000).optional()
});
