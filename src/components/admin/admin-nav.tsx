"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CalendarRange,
  ChartNoAxesCombined,
  ClipboardCheck,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Settings,
  UserCog,
  UsersRound
} from "lucide-react";
import type { AdminModuleKey } from "@/lib/auth/modules";
import { cn } from "@/lib/utils";

const items = [
  ["/administracion", "Dashboard", LayoutDashboard, "dashboard"],
  ["/administracion/evaluaciones", "Evaluaciones", ClipboardCheck, "evaluaciones"],
  ["/administracion/seguimiento-estudiantes", "Seguimiento", ClipboardList, "seguimiento"],
  ["/administracion/docentes", "Docentes", UsersRound, "docentes"],
  ["/administracion/resultados-docentes", "Resultados docentes", ChartNoAxesCombined, "resultados_docentes"],
  ["/administracion/estudiantes", "Estudiantes", GraduationCap, "estudiantes"],
  ["/administracion/grados", "Grados", BarChart3, "grados"],
  ["/administracion/asignaturas", "Asignaturas", BookOpen, "asignaturas"],
  ["/administracion/asignaciones", "Asignaciones", ListChecks, "asignaciones"],
  ["/administracion/preguntas", "Preguntas", ChartNoAxesCombined, "preguntas"],
  ["/administracion/periodos", "Semestres", CalendarRange, "periodos"],
  ["/administracion/informes", "Informes", FileText, "informes"],
  ["/administracion/importaciones", "Importaciones", FileSpreadsheet, "importaciones"],
  ["/administracion/usuarios", "Usuarios", UserCog, "super_admin"],
  ["/administracion/configuracion", "Configuración", Settings, "super_admin"]
] as const;

export function AdminNav({
  collapsed = false,
  modules,
  isSuperAdmin
}: {
  collapsed?: boolean;
  modules: AdminModuleKey[];
  isSuperAdmin: boolean;
}) {
  const pathname = usePathname();
  const visibleItems = items.filter(([, , , permission]) =>
    permission === "super_admin" ? isSuperAdmin : modules.includes(permission)
  );

  return (
    <nav aria-label="Navegación administrativa" className="space-y-1">
      {visibleItems.map(([href, label, Icon]) => {
        const active = href === "/administracion" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            aria-label={collapsed ? label : undefined}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              collapsed && "lg:justify-center lg:px-0",
              active
                ? "bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.08)]"
                : "text-white/62 hover:bg-white/[.07] hover:text-white"
            )}
          >
            <Icon className="size-4 shrink-0" strokeWidth={1.8} />
            <span className={collapsed ? "lg:sr-only" : ""}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
