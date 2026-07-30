"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/permissions";
import { decodeCsvBytes, findCsvColumn, normalizeCsvValue, parseCsv } from "@/lib/imports/csv";
import { createAdminClient } from "@/lib/supabase/admin";
import { studentCodeSchema, teacherSchema } from "@/lib/validation/schemas";

export interface CsvImportState {
  status: "idle" | "success" | "error";
  message: string;
  errors?: string[];
}

export type CsvImportAction = (state: CsvImportState, formData: FormData) => Promise<CsvImportState>;

const MAX_FILE_SIZE = 8_000_000;
const MAX_ROWS = 5_000;
const MAX_VISIBLE_ERRORS = 8;

function importError(message: string, errors?: string[]): CsvImportState {
  return { status: "error", message, errors };
}

async function readCsvFile(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona un archivo CSV con información.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("El archivo supera el límite permitido de 8 MB.");
  }
  if (!file.name.toLocaleLowerCase().endsWith(".csv")) {
    throw new Error("El archivo debe tener extensión .csv.");
  }

  const text = decodeCsvBytes(await file.arrayBuffer());
  const table = parseCsv(text);
  if (table.rows.length === 0) throw new Error("El archivo solo contiene encabezados.");
  if (table.rows.length > MAX_ROWS) {
    throw new Error(`El archivo contiene ${table.rows.length} registros; el máximo permitido es ${MAX_ROWS}.`);
  }
  return { file, table };
}

function visibleErrors(errors: string[]) {
  const result = errors.slice(0, MAX_VISIBLE_ERRORS);
  if (errors.length > MAX_VISIBLE_ERRORS) {
    result.push(`Hay ${errors.length - MAX_VISIBLE_ERRORS} errores adicionales.`);
  }
  return result;
}

export async function importTeachersCsvAction(
  _state: CsvImportState,
  formData: FormData
): Promise<CsvImportState> {
  const user = await requireAdmin();

  try {
    const { file, table } = await readCsvFile(formData);
    const nameColumn = findCsvColumn(table.headers, ["nombre", "nombre completo", "full_name"]);
    const emailColumn = findCsvColumn(table.headers, ["correo", "email"]);
    const documentColumn = findCsvColumn(table.headers, ["documento", "numero documento", "document_number"]);
    if (nameColumn < 0 || emailColumn < 0 || documentColumn < 0) {
      return importError("La plantilla no coincide. Usa los encabezados: documento, nombre, correo.");
    }

    const admin = createAdminClient();
    const { data: existingTeachers, error: lookupError } = await admin
      .from("teachers")
      .select("id,document_number,email");
    if (lookupError) return importError("No fue posible consultar los docentes existentes.");

    const documentMap = new Map(
      (existingTeachers ?? [])
        .filter((teacher) => teacher.document_number)
        .map((teacher) => [normalizeCsvValue(teacher.document_number ?? ""), teacher.id])
    );
    const emailMap = new Map(
      (existingTeachers ?? [])
        .filter((teacher) => teacher.email)
        .map((teacher) => [normalizeCsvValue(teacher.email ?? ""), teacher.id])
    );
    const seenIdentities = new Set<string>();
    const errors: string[] = [];
    const records: {
      id: string;
      full_name: string;
      email: string | null;
      document_number: string | null;
      active: boolean;
    }[] = [];

    table.rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const fullName = row[nameColumn]?.trim() ?? "";
      const email = row[emailColumn]?.trim().toLocaleLowerCase() ?? "";
      const documentNumber = row[documentColumn]?.trim() ?? "";
      const parsed = teacherSchema.safeParse({ fullName, email, documentNumber });

      if (!parsed.success) {
        errors.push(`Fila ${rowNumber}: revisa el nombre, correo y documento.`);
        return;
      }
      if (!email && !documentNumber) {
        errors.push(`Fila ${rowNumber}: indica un correo o documento para identificar al docente.`);
        return;
      }

      const documentKey = documentNumber ? `documento:${normalizeCsvValue(documentNumber)}` : "";
      const emailKey = email ? `correo:${normalizeCsvValue(email)}` : "";
      if ((documentKey && seenIdentities.has(documentKey)) || (emailKey && seenIdentities.has(emailKey))) {
        errors.push(`Fila ${rowNumber}: el docente está repetido dentro del archivo.`);
        return;
      }
      if (documentKey) seenIdentities.add(documentKey);
      if (emailKey) seenIdentities.add(emailKey);

      const documentMatch = documentNumber ? documentMap.get(normalizeCsvValue(documentNumber)) : undefined;
      const emailMatch = email ? emailMap.get(normalizeCsvValue(email)) : undefined;
      if (documentMatch && emailMatch && documentMatch !== emailMatch) {
        errors.push(`Fila ${rowNumber}: el documento y el correo pertenecen a docentes diferentes.`);
        return;
      }

      records.push({
        id: documentMatch ?? emailMatch ?? randomUUID(),
        full_name: parsed.data.fullName,
        email: parsed.data.email || null,
        document_number: parsed.data.documentNumber || null,
        active: true
      });
    });

    if (errors.length) {
      return importError(
        `No se importó ningún docente. Se encontraron ${errors.length} filas con errores.`,
        visibleErrors(errors)
      );
    }

    const { error } = await admin.from("teachers").upsert(records, { onConflict: "id" });
    if (error) return importError(`Supabase rechazó la importación: ${error.message}`);

    await admin.from("audit_logs").insert({
      user_id: user.id,
      action: "ADMIN_IMPORT_TEACHERS_CSV",
      entity: "teachers",
      metadata: { processed: records.length, file_name: file.name }
    });
    revalidatePath("/administracion/docentes");
    return { status: "success", message: `Se importaron o actualizaron ${records.length} docentes correctamente.` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible procesar el archivo.";
    return importError(message);
  }
}

export async function importStudentsCsvAction(
  _state: CsvImportState,
  formData: FormData
): Promise<CsvImportState> {
  const user = await requireAdmin();

  try {
    const { file, table } = await readCsvFile(formData);
    const codeColumn = findCsvColumn(table.headers, ["codigo", "código", "code"]);
    const nameColumn = findCsvColumn(table.headers, ["nombre", "nombre completo", "full_name"]);
    const gradeColumn = findCsvColumn(table.headers, ["grado", "grade"]);
    const yearColumn = findCsvColumn(table.headers, ["ano", "año", "anio", "academic_year"]);
    if ([codeColumn, nameColumn, gradeColumn, yearColumn].some((column) => column < 0)) {
      return importError("La plantilla no coincide. Usa los encabezados: codigo, nombre, grado, ano.");
    }

    const admin = createAdminClient();
    const [{ data: grades, error: gradesError }, { data: years, error: yearsError }] = await Promise.all([
      admin.from("grades").select("id,name").eq("active", true),
      admin.from("academic_years").select("id,name")
    ]);
    if (gradesError || yearsError) {
      return importError("No fue posible consultar los grados y años académicos.");
    }

    const gradeMap = new Map((grades ?? []).map((grade) => [normalizeCsvValue(grade.name), grade.id]));
    const yearMap = new Map((years ?? []).map((year) => [normalizeCsvValue(year.name), year.id]));
    const seenCodes = new Set<string>();
    const errors: string[] = [];
    const records: {
      code: string;
      full_name: string;
      grade_id: string;
      academic_year_id: string;
      active: boolean;
    }[] = [];

    table.rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const code = row[codeColumn]?.trim() ?? "";
      const fullName = row[nameColumn]?.trim() ?? "";
      const gradeName = row[gradeColumn]?.trim() ?? "";
      const yearName = row[yearColumn]?.trim() ?? "";
      const gradeId = gradeMap.get(normalizeCsvValue(gradeName));
      const academicYearId = yearMap.get(normalizeCsvValue(yearName));
      const codeKey = normalizeCsvValue(code);

      if (!studentCodeSchema.safeParse(code).success) {
        errors.push(`Fila ${rowNumber}: el código no tiene un formato válido.`);
      } else if (fullName.length < 3 || fullName.length > 180) {
        errors.push(`Fila ${rowNumber}: el nombre debe tener entre 3 y 180 caracteres.`);
      } else if (!gradeId) {
        errors.push(`Fila ${rowNumber}: el grado "${gradeName || "(vacío)"}" no existe o está inactivo.`);
      } else if (!academicYearId) {
        errors.push(`Fila ${rowNumber}: el año "${yearName || "(vacío)"}" no existe.`);
      } else if (seenCodes.has(codeKey)) {
        errors.push(`Fila ${rowNumber}: el código está repetido dentro del archivo.`);
      } else {
        seenCodes.add(codeKey);
        records.push({
          code,
          full_name: fullName,
          grade_id: gradeId,
          academic_year_id: academicYearId,
          active: true
        });
      }
    });

    if (errors.length) {
      return importError(
        `No se importó ningún estudiante. Se encontraron ${errors.length} filas con errores.`,
        visibleErrors(errors)
      );
    }

    const { error } = await admin.from("students").upsert(records, { onConflict: "code" });
    if (error) return importError(`Supabase rechazó la importación: ${error.message}`);

    await admin.from("audit_logs").insert({
      user_id: user.id,
      action: "ADMIN_IMPORT_STUDENTS_CSV",
      entity: "students",
      metadata: { processed: records.length, file_name: file.name }
    });
    revalidatePath("/administracion/estudiantes");
    return { status: "success", message: `Se importaron o actualizaron ${records.length} estudiantes correctamente.` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible procesar el archivo.";
    return importError(message);
  }
}
