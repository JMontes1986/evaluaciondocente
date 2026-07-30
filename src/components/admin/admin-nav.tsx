"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, CalendarRange, ChartNoAxesCombined, ClipboardCheck, FileSpreadsheet, FileText, GraduationCap, LayoutDashboard, ListChecks, Settings, UserCog, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  ["/administracion", "Dashboard", LayoutDashboard],
  ["/administracion/evaluaciones", "Evaluaciones", ClipboardCheck],
  ["/administracion/docentes", "Docentes", UsersRound],
  ["/administracion/estudiantes", "Estudiantes", GraduationCap],
  ["/administracion/grados", "Grados", BarChart3],
  ["/administracion/asignaturas", "Asignaturas", BookOpen],
  ["/administracion/asignaciones", "Asignaciones", ListChecks],
  ["/administracion/preguntas", "Preguntas", ChartNoAxesCombined],
  ["/administracion/periodos", "Semestres", CalendarRange],
  ["/administracion/informes", "Informes", FileText],
  ["/administracion/importaciones", "Importaciones", FileSpreadsheet],
  ["/administracion/usuarios", "Usuarios", UserCog],
  ["/administracion/configuracion", "Configuración", Settings]
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return <nav aria-label="Navegación administrativa" className="space-y-1">{items.map(([href,label,Icon]) => {
    const active = href === "/administracion" ? pathname === href : pathname.startsWith(href);
    return <Link key={href} href={href} className={cn("flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors", active ? "bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.08)]" : "text-white/62 hover:bg-white/[.07] hover:text-white")}><Icon className="size-4" strokeWidth={1.8} />{label}</Link>;
  })}</nav>;
}
