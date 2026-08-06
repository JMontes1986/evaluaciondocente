import Link from "next/link";
import { Pencil } from "lucide-react";
import { createSubjectAction, updateSubjectAction } from "@/actions/admin";
import { PageHeading } from "@/components/admin/page-heading";
import { StatusButton } from "@/components/admin/status-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireModule } from "@/lib/auth/permissions";

interface SubjectsPageProps {
  searchParams: Promise<{ editar?: string }>;
}

export default async function SubjectsPage({ searchParams }: SubjectsPageProps) {
  await requireModule("asignaturas");
  const { editar } = await searchParams;
  const { data: subjects } = await createAdminClient()
    .from("subjects")
    .select("id,name,active")
    .order("name");

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeading
        eyebrow="Catálogo"
        title="Asignaturas"
        description="Crea y administra las asignaturas utilizadas en las asignaciones docentes."
      />

      <form
        action={createSubjectAction}
        className="mb-7 grid gap-3 rounded-xl border bg-card p-5 sm:grid-cols-[1fr_auto]"
      >
        <Input
          name="name"
          required
          minLength={2}
          maxLength={120}
          placeholder="Nombre de la nueva asignatura"
          aria-label="Nombre de la nueva asignatura"
        />
        <Button type="submit">Crear asignatura</Button>
      </form>

      <div className="divide-y rounded-xl border bg-card">
        {subjects?.map((subject) => {
          const isEditing = editar === subject.id;

          return (
            <div key={subject.id} className="p-5">
              {isEditing ? (
                <form action={updateSubjectAction} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <input type="hidden" name="id" value={subject.id} />
                  <Input
                    name="name"
                    required
                    minLength={2}
                    maxLength={120}
                    defaultValue={subject.name}
                    aria-label={`Editar ${subject.name}`}
                    autoFocus
                  />
                  <Button type="submit">Guardar cambios</Button>
                  <Button asChild type="button" variant="outline">
                    <Link href="/administracion/asignaturas">Cancelar</Link>
                  </Button>
                </form>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{subject.name}</p>
                    <div className="mt-1"><Badge>{subject.active ? "Activa" : "Inactiva"}</Badge></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/administracion/asignaturas?editar=${subject.id}`}>
                        <Pencil className="size-4" />
                        Editar
                      </Link>
                    </Button>
                    <StatusButton table="subjects" id={subject.id} active={subject.active} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!subjects?.length && (
          <p className="p-10 text-center text-sm text-muted-foreground">
            No hay asignaturas registradas. Crea la primera usando el formulario.
          </p>
        )}
      </div>
    </div>
  );
}
