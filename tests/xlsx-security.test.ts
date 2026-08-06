import assert from "node:assert/strict";
import test from "node:test";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import {
  MAX_XLSX_COMPRESSION_RATIO,
  validateXlsxArchive
} from "../src/lib/imports/xlsx-security";

const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;

async function createArchive(files: Record<string, string>) {
  const zip = new JSZip();
  for (const [name, contents] of Object.entries(files)) zip.file(name, contents);
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

function centralDirectoryOffsets(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const offsets: number[] = [];
  for (let offset = 0; offset <= bytes.byteLength - 46; offset += 1) {
    if (view.getUint32(offset, true) === CENTRAL_DIRECTORY_SIGNATURE) offsets.push(offset);
  }
  return { offsets, view };
}

test("acepta un contenedor XLSX pequeño y contabiliza su contenido real", async () => {
  const archive = await createArchive({
    "[Content_Types].xml": "<Types />",
    "xl/workbook.xml": "<workbook />",
    "xl/worksheets/sheet1.xml": "<worksheet><row><c><v>1</v></c></row></worksheet>"
  });

  const stats = validateXlsxArchive(archive);
  assert.ok(stats.entries >= 3);
  assert.ok(stats.uncompressedBytes > 0);
  assert.equal(stats.compressedBytes, archive.byteLength);
});

test("acepta un libro producido por ExcelJS", async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Estudiantes");
  sheet.addRow(["codigo", "nombre", "grado"]);
  sheet.addRow(["A-18", "María del Pilar Ríos", "6A"]);

  const bytes = await workbook.xlsx.writeBuffer();
  const stats = validateXlsxArchive(bytes);
  assert.ok(stats.entries > 0);
  assert.ok(stats.uncompressedBytes > stats.compressedBytes);
});

test("rechaza entradas con una relación de compresión propia de una ZIP bomb", async () => {
  const archive = await createArchive({ "xl/worksheets/sheet1.xml": "A".repeat(1_000_000) });
  assert.throws(
    () => validateXlsxArchive(archive),
    new RegExp(`relación de compresión ${MAX_XLSX_COMPRESSION_RATIO}:1`)
  );
});

test("rechaza tamaños descomprimidos falsificados en el directorio ZIP", async () => {
  const archive = await createArchive({ "xl/workbook.xml": "contenido real del libro" });
  const { offsets, view } = centralDirectoryOffsets(archive);
  assert.ok(offsets.length >= 1);
  view.setUint32(offsets.at(-1)! + 24, 4, true);

  assert.throws(() => validateXlsxArchive(archive), /tamaño descomprimido falso/);
});

test("rechaza el total declarado antes de entregar el archivo a ExcelJS", async () => {
  const archive = await createArchive({
    "xl/a.xml": "a",
    "xl/b.xml": "b",
    "xl/c.xml": "c"
  });
  const { offsets, view } = centralDirectoryOffsets(archive);
  assert.ok(offsets.length >= 3);
  for (const offset of offsets) {
    view.setUint32(offset + 20, 200_000, true);
    view.setUint32(offset + 24, 25_000_000, true);
  }

  assert.throws(() => validateXlsxArchive(archive), /contenido supera 64 MB/);
});
