import assert from "node:assert/strict";
import test from "node:test";
import {
  canUseExternalAiAnalysis,
  canUseTeacherAiAnalysis,
  DashboardScopeError,
  limitDashboardGrade,
  scopeDashboardFilters
} from "../src/lib/auth/dashboard-scope";

test("limita el análisis externo a roles directivos", () => {
  for (const role of ["SUPER_ADMIN", "ADMIN", "RECTOR", "DIRECTIVO", "COORDINADOR"] as const) {
    assert.equal(canUseExternalAiAnalysis(role), true);
  }
  assert.equal(canUseExternalAiAnalysis("DOCENTE"), false);
});

test("autoriza el análisis individual a las tres cuentas institucionales indicadas", () => {
  for (const email of [
    "convivencia@colgemelli.edu.co",
    "gformativa@colgemelli.edu.co",
    "ghumana@colgemelli.edu.co"
  ]) {
    assert.equal(canUseTeacherAiAnalysis("DOCENTE", email), true);
  }
  assert.equal(canUseTeacherAiAnalysis("DOCENTE", "otro@colgemelli.edu.co"), false);
  assert.equal(canUseTeacherAiAnalysis("RECTOR", "rectoria@colgemelli.edu.co"), true);
});

const ownTeacherId = "8dfec899-c886-48ee-af46-f419dde7ec6d";
const otherTeacherId = "bd7e0c3c-f975-460d-8907-5a9ac3c33d41";
const ownGradeId = "a4c9c117-0689-4df6-a174-897f8e99a7a2";
const otherGradeId = "36b97279-15ab-4418-a753-e7981ea8515f";

test("DOCENTE siempre queda forzado a su teacher_id", () => {
  const scope = scopeDashboardFilters(
    { teacherId: otherTeacherId, gradeId: ownGradeId },
    { role: "DOCENTE", teacherId: ownTeacherId }
  );

  assert.equal(scope.teacherScoped, true);
  assert.equal(scope.filters.teacherId, ownTeacherId);
});

test("DOCENTE no puede conservar un grado fuera de sus asignaciones", () => {
  const scope = scopeDashboardFilters(
    { teacherId: otherTeacherId, gradeId: otherGradeId },
    { role: "DOCENTE", teacherId: ownTeacherId }
  );
  const limited = limitDashboardGrade(scope, new Set([ownGradeId]));

  assert.equal(limited.filters.teacherId, ownTeacherId);
  assert.equal(limited.filters.gradeId, undefined);
});

test("roles institucionales conservan los filtros solicitados", () => {
  const scope = scopeDashboardFilters(
    { teacherId: otherTeacherId, gradeId: otherGradeId },
    { role: "RECTOR", teacherId: null }
  );

  assert.equal(scope.teacherScoped, false);
  assert.equal(scope.filters.teacherId, otherTeacherId);
  assert.equal(scope.filters.gradeId, otherGradeId);
});

test("DOCENTE sin vínculo falla de forma cerrada", () => {
  assert.throws(
    () => scopeDashboardFilters({}, { role: "DOCENTE", teacherId: null }),
    DashboardScopeError
  );
});
