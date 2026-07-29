import { describe, expect, it } from "vitest";
import { average, scorePercentage } from "@/lib/calculations/scores";
import { evaluationSchema, studentCodeSchema } from "@/lib/validation/schemas";

describe("cálculos de evaluación", () => {
  it("calcula promedio y porcentaje institucional", () => {
    expect(average([4, 3, 4, 3.4])).toBe(3.6);
    expect(scorePercentage(3.6)).toBe(90);
  });
  it("rechaza puntajes fuera del rango", () => {
    expect(() => scorePercentage(5)).toThrow(RangeError);
  });
});

describe("validaciones sensibles", () => {
  it("rechaza códigos con caracteres inesperados", () => {
    expect(studentCodeSchema.safeParse("5540 OR 1=1").success).toBe(false);
  });
  it("exige puntajes entre 1 y 4", () => {
    expect(evaluationSchema.safeParse({
      teacherId: "8dfec899-c886-48ee-af46-f419dde7ec6d",
      assignmentId: "fc6aef63-9049-4bb4-aaf0-378b1c8bce7c",
      periodId: "d9869982-285d-4d64-9dc8-ccf75420717c",
      answers: [{ questionId: "6984d947-2f36-4fc4-913b-d73f150454e3", score: 5 }]
    }).success).toBe(false);
  });
});
