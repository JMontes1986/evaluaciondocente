import test from "node:test";
import assert from "node:assert/strict";
import { findCsvColumn, normalizeCsvValue, parseCsv } from "../src/lib/imports/csv";

test("interpreta CSV separado por punto y coma y elimina el BOM", () => {
  const table = parseCsv("\uFEFFcodigo;nombre;grado;ano\r\nA-18;María del Pilar Ríos;6A;2026");
  assert.deepEqual(table.headers, ["codigo", "nombre", "grado", "ano"]);
  assert.deepEqual(table.rows[0], ["A-18", "María del Pilar Ríos", "6A", "2026"]);
});

test("interpreta comas, campos entre comillas y comillas escapadas", () => {
  const table = parseCsv('documento,nombre,correo\n84521,"Ríos, Ana ""María""",ana@colegio.edu.co');
  assert.deepEqual(table.rows[0], ["84521", 'Ríos, Ana "María"', "ana@colegio.edu.co"]);
});

test("normaliza tildes y encuentra alias de encabezados", () => {
  const table = parseCsv("Código,Nombre Completo,Año\nA-18,María del Pilar Ríos,2026");
  assert.equal(findCsvColumn(table.headers, ["codigo"]), 0);
  assert.equal(findCsvColumn(table.headers, ["nombre completo"]), 1);
  assert.equal(findCsvColumn(table.headers, ["ano"]), 2);
  assert.equal(normalizeCsvValue("  Séptimo A "), "septimo a");
});

test("rechaza un CSV con comillas sin cerrar", () => {
  assert.throws(() => parseCsv('codigo,nombre\nA-18,"María'), /comilla sin cerrar/);
});
