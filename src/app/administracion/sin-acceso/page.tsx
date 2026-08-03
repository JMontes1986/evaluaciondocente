import Link from "next/link";
import { Button } from "@/components/ui/button";
import { firstModulePath } from "@/lib/auth/modules";
import { requireAdmin } from "@/lib/auth/permissions";

export default async function NoAccessPage() {
  const user = await requireAdmin();
  return (
    <section className="mx-auto max-w-2xl rounded-xl border border-dashed bg-card px-6 py-14 text-center">
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Acceso restringido</p>
      <h1 className="mt-3 text-2xl font-semibold">Este módulo no está autorizado</h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
        Tu cuenta tiene acceso únicamente a los módulos definidos por el administrador principal.
      </p>
      <Button asChild className="mt-6">
        <Link href={firstModulePath(user.modules)}>Ir a un módulo autorizado</Link>
      </Button>
    </section>
  );
}
