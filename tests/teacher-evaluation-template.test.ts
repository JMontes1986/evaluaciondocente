import test from "node:test";
import assert from "node:assert/strict";
import {
  escapeWordXml,
  formatDistributionPercentage
} from "../src/lib/documents/teacher-evaluation-template";

test("formatea porcentajes para el informe Word", () => {
  assert.equal(formatDistributionPercentage(3, 4), "75,0%");
  assert.equal(formatDistributionPercentage(0, 0), "0,0%");
});

test("protege el XML frente a texto ingresado por estudiantes", () => {
  assert.equal(escapeWordXml("A & B <C>"), "A &amp; B &lt;C&gt;");
});
