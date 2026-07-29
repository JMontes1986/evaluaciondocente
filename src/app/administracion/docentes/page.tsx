import { createTeacherAction } from "@/actions/admin";
import { PageHeading } from "@/components/admin/page-heading";
import { StatusButton } from "@/components/admin/status-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function TeachersPage() {
  const { data: teachers } = await createAdminClient().from("teachers").select("id,full_name,email,active").order("full_name");
  return <div className="mx-auto max-w-[1400px]"><PageHeading eyebrow="Gestión académica" title="Docentes" description="Administra el directorio docente y su estado institucional." />
    <form action={createTeacherAction} className="mb-7 grid gap-3 rounded-xl border bg-card p-5 md:grid-cols-[1fr_1fr_1fr_auto]">
      <Input name="fullName" required placeholder="Nombre completo" aria-label="Nombre completo" /><Input name="email" type="email" placeholder="Correo" aria-label="Correo" /><Input name="documentNumber" placeholder="Documento (opcional)" aria-label="Documento" /><Button type="submit">Agregar docente</Button>
    </form>
    <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[680px] text-sm"><thead className="border-b bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-4">Nombre</th><th className="p-4">Correo</th><th className="p-4">Estado</th><th className="p-4 text-right">Acciones</th></tr></thead><tbody className="divide-y">{(teachers ?? []).map((teacher)=><tr key={teacher.id}><td className="p-4 font-medium">{teacher.full_name}</td><td className="p-4 text-muted-foreground">{teacher.email ?? "Sin correo"}</td><td className="p-4"><Badge>{teacher.active ? "Activo" : "Inactivo"}</Badge></td><td className="p-4"><div className="flex justify-end"><StatusButton table="teachers" id={teacher.id} active={teacher.active} /></div></td></tr>)}</tbody></table>{!teachers?.length && <p className="p-10 text-center text-sm text-muted-foreground">No hay docentes registrados.</p>}</div>
  </div>;
}
