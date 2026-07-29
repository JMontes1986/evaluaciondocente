import Link from "next/link";
import { ArrowLeft, Clock3, LockKeyhole } from "lucide-react";
import { Brand } from "@/components/brand";
import { StudentLoginForm } from "@/components/student-login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Ingreso de estudiantes" };

export default function StudentAccessPage() {
  return <main className="min-h-[100dvh] bg-[#eef3f8]">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
      <Brand />
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Inicio</Link>
    </header>
    <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-8 sm:px-6 md:grid-cols-[1fr_.8fr] md:items-center md:pt-20">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.2em] text-primary/65">Participación estudiantil</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-.04em] text-[#102a4b] sm:text-5xl">Tu experiencia en el aula importa.</h1>
        <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-slate-600">Ingresa tu código para consultar las evaluaciones pendientes. Tus respuestas son confidenciales y los docentes reciben únicamente resultados agregados.</p>
        <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2"><LockKeyhole className="size-4 text-primary" /> Sesión protegida</span>
          <span className="inline-flex items-center gap-2"><Clock3 className="size-4 text-primary" /> Vigencia de 2 horas</span>
        </div>
      </div>
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Identificación</CardTitle>
          <CardDescription>Usa el código asignado por el colegio.</CardDescription>
        </CardHeader>
        <CardContent><StudentLoginForm /></CardContent>
      </Card>
    </section>
  </main>;
}
