import { LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/permissions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return <div className="min-h-[100dvh] bg-background lg:grid lg:grid-cols-[250px_1fr]">
    <aside className="bg-[#102a4b] px-4 py-5 text-white lg:fixed lg:inset-y-0 lg:w-[250px]">
      <div className="mb-7 px-2"><Brand inverse /></div><AdminNav />
    </aside>
    <div className="lg:col-start-2">
      <header className="sticky top-0 z-20 border-b bg-background/92 backdrop-blur">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div><p className="text-sm font-semibold">{user.fullName}</p><p className="text-xs text-muted-foreground">{user.role}</p></div>
          <form action={logoutAction}><Button variant="ghost" size="sm"><LogOut className="size-4" /> Cerrar sesión</Button></form>
        </div>
      </header>
      <main className="px-4 py-7 sm:px-6 lg:px-8 lg:py-9">{children}</main>
    </div>
  </div>;
}
