import type { AppRole } from "@/types/database.types";

const EXTERNAL_AI_DIRECTIVE_ROLES: readonly AppRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "RECTOR",
  "DIRECTIVO",
  "COORDINADOR"
];

const TEACHER_AI_AUTHORIZED_EMAILS = new Set([
  "convivencia@colgemelli.edu.co",
  "gformativa@colgemelli.edu.co",
  "ghumana@colgemelli.edu.co"
]);

export function canUseExternalAiAnalysis(role: AppRole) {
  return EXTERNAL_AI_DIRECTIVE_ROLES.includes(role);
}

export function canUseTeacherAiAnalysis(role: AppRole, email: string) {
  return canUseExternalAiAnalysis(role)
    || TEACHER_AI_AUTHORIZED_EMAILS.has(email.trim().toLowerCase());
}

export interface DashboardFilterInput {
  periodId?: string;
  teacherId?: string;
  gradeId?: string;
}

interface DashboardScopeIdentity {
  role: AppRole;
  teacherId: string | null;
}

export interface DashboardScope {
  filters: DashboardFilterInput;
  teacherScoped: boolean;
}

export class DashboardScopeError extends Error {
  constructor() {
    super("La cuenta docente no tiene un docente asociado.");
    this.name = "DashboardScopeError";
  }
}

export function scopeDashboardFilters(
  filters: DashboardFilterInput,
  identity: DashboardScopeIdentity
): DashboardScope {
  if (identity.role !== "DOCENTE") {
    return { filters: { ...filters }, teacherScoped: false };
  }
  if (!identity.teacherId) throw new DashboardScopeError();

  return {
    filters: { ...filters, teacherId: identity.teacherId },
    teacherScoped: true
  };
}

export function limitDashboardGrade(
  scope: DashboardScope,
  allowedGradeIds: ReadonlySet<string>
): DashboardScope {
  if (!scope.teacherScoped || !scope.filters.gradeId || allowedGradeIds.has(scope.filters.gradeId)) {
    return scope;
  }

  return {
    ...scope,
    filters: { ...scope.filters, gradeId: undefined }
  };
}
