"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { requireModule } from "@/lib/auth/permissions";
import { MAX_XLSX_COMPRESSED_BYTES, validateXlsxArchive } from "@/lib/imports/xlsx-security";
import { createAdminClient } from "@/lib/supabase/admin";
import { studentCodeSchema } from "@/lib/validation/schemas";

export async function importStudentsAction(formData: FormData) {
  const user = await requireModule("importaciones");
  const file = formData.get("file");
  if (
    !(file instanceof File)
    || file.size === 0
    || file.size > MAX_XLSX_COMPRESSED_BYTES
    || !file.name.toLocaleLowerCase().endsWith(".xlsx")
  ) return;

  const fileBytes = await file.arrayBuffer();
  let archiveStats: ReturnType<typeof validateXlsxArchive>;
  try {
    archiveStats = validateXlsxArchive(fileBytes);
  } catch {
    return;
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(fileBytes);
  } catch {
    return;
  }
  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount > 5_001 || sheet.columnCount > 20) return;

  const admin = createAdminClient();
  const [{ data: grades }, { data: year }] = await Promise.all([
    admin.from("grades").select("id,name").eq("active", true),
    admin.from("academic_years").select("id").eq("active", true).single()
  ]);
  if (!year) return;

  const gradeMap = new Map((grades ?? []).map((grade) => [grade.name.toLocaleLowerCase(), grade.id]));
  const seen = new Set<string>();
  const records: { code: string; full_name: string; grade_id: string; academic_year_id: string }[] = [];
  sheet.eachRow((row, index) => {
    if (index === 1) return;
    const code = String(row.getCell(1).text).trim();
    const name = String(row.getCell(2).text).trim();
    const grade = String(row.getCell(3).text).trim().toLocaleLowerCase();
    const gradeId = gradeMap.get(grade);
    if (studentCodeSchema.safeParse(code).success && name.length >= 3 && gradeId && !seen.has(code)) {
      seen.add(code);
      records.push({ code, full_name: name, grade_id: gradeId, academic_year_id: year.id });
    }
  });

  if (records.length) await admin.from("students").upsert(records, { onConflict: "code" });
  await admin.from("audit_logs").insert({
    user_id: user.id,
    action: "ADMIN_IMPORT_STUDENTS",
    entity: "students",
    metadata: {
      accepted: records.length,
      file_name: file.name,
      zip_entries: archiveStats.entries,
      compressed_bytes: archiveStats.compressedBytes,
      uncompressed_bytes: archiveStats.uncompressedBytes
    }
  });
  revalidatePath("/administracion/estudiantes");
}
