import { createStudentAction } from "@/actions/admin";
import { PageHeading } from "@/components/admin/page-heading";
import { StatusButton } from "@/components/admin/status-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function StudentsPage() {
  const admin = createAdminClient();
  const [{ data: students }, { data: grades }, { data: years }] = await Promise.all([
    admin.from("students").select("id,code,full_name,grade_id,academic_year_id,active").order("full_name").limit(250),
    admin.from("grades").select("id,name").eq("active",true).order("order_number"),
    admin.from("academic_years").select("id,name").order("name",{ascending:false})
  ]);
  const gradeMap = new Map((grades ?? []).map((x)=>[x.id,x.name])); const yearMap = new Map((years ?? []).map((x)=>[x.id,x.name]));
  return <div className="mx-auto max-w-[1400px]"><PageHeading eyebrow="Gestión académica" title="Estudiantes" description="Los códigos solo son visibles para administradores autorizados." />
    <form action={createStudentAction} className="mb-7 grid gap-3 rounded-xl border bg-card p-5 lg:grid-cols-[.7fr_1.2fr_1fr_1fr_auto]">
      <Input name="code" required placeholder="Código" aria-label="Código" /><Input name="fullName" required placeholder="Nombre completo" aria-label="Nombre completo" />
      <select name="gradeId" required className="min-h-11 rounded-lg border bg-background px-3 text-sm" aria-label="Grado"><option value="">Grado</option>{grades?.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <select name="academicYearId" required className="min-h-11 rounded-lg border bg-background px-3 text-sm" aria-label="Año académico"><option value="">Año</option>{years?.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select><Button type="submit">Agregar</Button>
    </form>
    <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[760px] text-sm"><thead className="border-b bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-4">Código</th><th className="p-4">Nombre</th><th className="p-4">Grado</th><th className="p-4">Año</th><th className="p-4">Estado</th><th className="p-4 text-right">Acciones</th></tr></thead><tbody className="divide-y">{students?.map(x=><tr key={x.id}><td className="p-4 font-mono">{x.code}</td><td className="p-4 font-medium">{x.full_name}</td><td className="p-4">{gradeMap.get(x.grade_id)}</td><td className="p-4">{yearMap.get(x.academic_year_id)}</td><td className="p-4"><Badge>{x.active?"Activo":"Inactivo"}</Badge></td><td className="p-4"><div className="flex justify-end"><StatusButton table="students" id={x.id} active={x.active}/></div></td></tr>)}</tbody></table>{!students?.length&&<p className="p-10 text-center text-sm text-muted-foreground">No hay estudiantes registrados.</p>}</div>
  </div>;
}
