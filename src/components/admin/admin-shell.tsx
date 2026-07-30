"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "admin-sidebar-collapsed";

export function AdminShell({
  user,
  children
}: {
  user: { fullName: string; role: string };
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <div
      className={cn(
        "min-h-[100dvh] bg-background lg:grid lg:transition-[grid-template-columns] lg:duration-200",
        collapsed ? "lg:grid-cols-[76px_1fr]" : "lg:grid-cols-[250px_1fr]"
      )}
    >
      <aside
        className={cn(
          "relative bg-[#102a4b] px-4 py-5 text-white lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:h-[100dvh] lg:flex-col lg:transition-[width] lg:duration-200",
          collapsed ? "lg:w-[76px] lg:px-2" : "lg:w-[250px]"
        )}
      >
        <div className="mb-5 shrink-0 px-2">
          <Brand inverse compact={collapsed} />
        </div>

        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expandir menú" : "Contraer menú"}
          className="absolute -right-3 top-7 z-40 hidden size-7 place-items-center rounded-full border border-white/20 bg-[#17446d] text-white shadow-lg transition-colors hover:bg-[#205a8b] lg:grid"
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-color:rgba(255,255,255,.28)_transparent] [scrollbar-width:thin]">
          <AdminNav collapsed={collapsed} />
        </div>

        {!collapsed && (
          <p className="mt-4 shrink-0 border-t border-white/10 px-2 pt-4 text-[10px] leading-relaxed text-white/45">
            © 2026 Colegio Franciscano Agustín Gemelli. Todos los derechos reservados.
          </p>
        )}
      </aside>

      <div className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-20 border-b bg-background/92 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-sm font-semibold">{user.fullName}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
            <form action={logoutAction}>
              <Button variant="ghost" size="sm"><LogOut className="size-4" /> Cerrar sesión</Button>
            </form>
          </div>
        </header>
        <main className="px-4 py-7 sm:px-6 lg:px-8 lg:py-9">{children}</main>
      </div>
    </div>
  );
}
