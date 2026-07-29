"use client";

import { usePathname } from "next/navigation";
import { importStudentsCsvAction, importTeachersCsvAction } from "@/actions/csv-imports";
import { CsvImportForm } from "@/components/admin/csv-import-form";

export default function AdministrationTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      {pathname === "/administracion/docentes" && (
        <CsvImportForm
          action={importTeachersCsvAction}
          columns="documento, nombre, correo"
          entityLabel="docentes"
          inputId="teachers-csv-file"
          templateHref="/plantillas/docentes.csv"
        />
      )}
      {pathname === "/administracion/estudiantes" && (
        <CsvImportForm
          action={importStudentsCsvAction}
          columns="codigo, nombre, grado, ano"
          entityLabel="estudiantes"
          inputId="students-csv-file"
          templateHref="/plantillas/estudiantes.csv"
        />
      )}
      {children}
    </>
  );
}
