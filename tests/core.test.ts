import test from "node:test";
import assert from "node:assert/strict";
import { average, scorePercentage } from "../src/lib/calculations/scores";
import { evaluationSchema, studentCodeSchema } from "../src/lib/validation/schemas";

test("calcula promedio y porcentaje institucional", () => {
  assert.equal(average([4, 3, 4, 3.4]), 3.6);
  assert.equal(scorePercentage(3.6), 90);
});

test("rechaza puntajes fuera del rango", () => {
  assert.throws(() => scorePercentage(5), RangeError);
});

test("rechaza códigos con caracteres inesperados", () => {
  assert.equal(studentCodeSchema.safeParse("5540 OR 1=1").success, false);
});

test("exige respuestas con puntajes entre 1 y 4", () => {
  const result = evaluationSchema.safeParse({
    teacherId: "8dfec899-c886-48ee-af46-f419dde7ec6d",
    assignmentId: "fc6aef63-9049-4bb4-aaf0-378b1c8bce7c",
    periodId: "d9869982-285d-4d64-9dc8-ccf75420717c",
    answers: [{ questionId: "6984d947-2f36-4fc4-913b-d73f150454e3", score: 5 }]
  });
  assert.equal(result.success, false);
});
