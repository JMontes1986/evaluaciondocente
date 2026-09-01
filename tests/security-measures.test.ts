import assert from "node:assert/strict";
import test from "node:test";
import { moduleForPathname } from "../src/lib/auth/modules";
import { getSecurityMeasures, SECURITY_CATEGORIES } from "../src/lib/security/security-measures";

test("protege el módulo de seguridad como área SUPER_ADMIN", () => {
  assert.equal(moduleForPathname("/administracion/seguridad"), "super_admin");
  assert.equal(moduleForPathname("/administracion/seguridad/detalle"), "super_admin");
});

test("protege el análisis individual con el permiso de resultados docentes", () => {
  assert.equal(moduleForPathname("/api/ai/teacher-analysis"), "resultados_docentes");
});

test("inventaría todas las áreas y conserva identificadores únicos", () => {
  const measures = getSecurityMeasures({ groqConfigured: false });
  assert.ok(measures.length >= 25);
  assert.equal(new Set(measures.map((measure) => measure.id)).size, measures.length);
  for (const category of SECURITY_CATEGORIES) {
    assert.ok(measures.some((measure) => measure.category === category));
  }
  assert.ok(measures.some((measure) => measure.status === "pending"));
  assert.ok(measures.some((measure) => measure.status === "verify"));
});

test("informa la integración Groq sin revelar la credencial", () => {
  const disabled = getSecurityMeasures({ groqConfigured: false }).find((measure) => measure.id === "groq-secret");
  const enabled = getSecurityMeasures({ groqConfigured: true }).find((measure) => measure.id === "groq-secret");
  assert.match(disabled?.description ?? "", /deshabilitada/);
  assert.match(enabled?.description ?? "", /secreto exclusivo del servidor/);
});
