export const ADMIN_MODULES = [
  { key: "dashboard", label: "Dashboard", description: "Indicadores, gráficas y análisis institucional.", href: "/administracion" },
  { key: "evaluaciones", label: "Evaluaciones", description: "Registro agregado de evaluaciones enviadas.", href: "/administracion/evaluaciones" },
  { key: "seguimiento", label: "Seguimiento", description: "Seguimiento y liberación de evaluaciones de estudiantes.", href: "/administracion/seguimiento-estudiantes" },
  { key: "docentes", label: "Docentes", description: "Directorio y estado de los docentes.", href: "/administracion/docentes" },
  { key: "resultados_docentes", label: "Resultados docentes", description: "Resultados, preguntas y comentarios por docente.", href: "/administracion/resultados-docentes" },
  { key: "estudiantes", label: "Estudiantes", description: "Directorio, códigos y estado de estudiantes.", href: "/administracion/estudiantes" },
  { key: "grados", label: "Grados", description: "Catálogo institucional de grados.", href: "/administracion/grados" },
  { key: "asignaturas", label: "Asignaturas", description: "Catálogo institucional de asignaturas.", href: "/administracion/asignaturas" },
  { key: "asignaciones", label: "Asignaciones", description: "Relación entre docentes, grados y asignaturas.", href: "/administracion/asignaciones" },
  { key: "preguntas", label: "Preguntas", description: "Banco oficial de preguntas de evaluación.", href: "/administracion/preguntas" },
  { key: "periodos", label: "Semestres", description: "Configuración de periodos de evaluación.", href: "/administracion/periodos" },
  { key: "informes", label: "Informes", description: "Consulta y descarga de informes institucionales.", href: "/administracion/informes" },
  { key: "importaciones", label: "Importaciones", description: "Carga masiva de información académica.", href: "/administracion/importaciones" }
] as const;

export type AdminModuleKey = typeof ADMIN_MODULES[number]["key"];

export const ADMIN_MODULE_KEYS = ADMIN_MODULES.map((module) => module.key) as AdminModuleKey[];

export function isAdminModuleKey(value: string): value is AdminModuleKey {
  return ADMIN_MODULE_KEYS.includes(value as AdminModuleKey);
}

export function firstModulePath(modules: AdminModuleKey[]) {
  return ADMIN_MODULES.find((module) => modules.includes(module.key))?.href ?? "/administracion/sin-acceso";
}

export function moduleForPathname(pathname: string): AdminModuleKey | "super_admin" | null {
  if (pathname === "/administracion") return "dashboard";
  if (pathname.startsWith("/administracion/sin-acceso")) return null;
  if (pathname.startsWith("/administracion/usuarios") || pathname.startsWith("/administracion/configuracion")) {
    return "super_admin";
  }
  if (pathname.startsWith("/administracion/seguimiento-estudiantes")) return "seguimiento";
  if (pathname.startsWith("/administracion/resultados-docentes")) return "resultados_docentes";
  if (pathname.startsWith("/administracion/evaluaciones")) return "evaluaciones";
  if (pathname.startsWith("/administracion/docentes")) return "docentes";
  if (pathname.startsWith("/administracion/estudiantes")) return "estudiantes";
  if (pathname.startsWith("/administracion/grados")) return "grados";
  if (pathname.startsWith("/administracion/asignaturas")) return "asignaturas";
  if (pathname.startsWith("/administracion/asignaciones")) return "asignaciones";
  if (pathname.startsWith("/administracion/preguntas")) return "preguntas";
  if (pathname.startsWith("/administracion/periodos")) return "periodos";
  if (pathname.startsWith("/administracion/informes")) return "informes";
  if (pathname.startsWith("/administracion/importaciones")) return "importaciones";
  if (pathname.startsWith("/api/exports")) return "informes";
  if (pathname.startsWith("/api/ai/dashboard-analysis")) return "dashboard";
  return null;
}
