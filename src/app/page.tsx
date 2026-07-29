import Link from "next/link";
import { ArrowRight, BookOpenCheck, LockKeyhole, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return <main className="min-h-[100dvh] bg-[#102a4b] text-white">
    <div className="institutional-grid min-h-[100dvh]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Brand inverse />
        <span className="hidden text-xs font-medium uppercase tracking-[.2em] text-white/55 sm:block">Colegio Franciscano</span>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 md:py-20 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-3 py-1.5 text-xs font-medium text-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
            <ShieldCheck className="size-4 text-[#e4bf68]" />
            Participación confidencial y segura
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-.045em] sm:text-5xl md:text-6xl">
            Bienvenido a la Evaluación Docente de ColGemelli
          </h1>
          <div className="mt-7 max-w-[65ch] space-y-4 text-base leading-relaxed text-white/70 sm:text-lg">
            <p>Tu opinión construye el futuro. Queremos seguir creciendo y mejorando para brindarte la mejor experiencia educativa. Por eso, tu participación en la Evaluación Docente es clave.</p>
            <p>Responde con sinceridad y compromiso: cada respuesta es una oportunidad para fortalecer la calidad de nuestras clases y construir juntos un Colegio Gemellista cada vez mejor.</p>
          </div>
          <p className="mt-8 border-l-2 border-[#e4bf68] pl-4 text-sm font-semibold text-white/90">Participa y ayúdanos a seguir mejorando día a día.</p>
        </div>

        <div className="grid gap-4">
          <article className="group rounded-[1.4rem] border border-white/15 bg-white/[.08] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,.1),0_24px_60px_-38px_rgba(0,0,0,.65)] backdrop-blur-md sm:p-7">
            <BookOpenCheck className="size-7 text-[#e4bf68]" strokeWidth={1.7} />
            <p className="mt-6 text-xs font-semibold uppercase tracking-[.18em] text-white/50">Para estudiantes</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Evaluación docente</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/65">Ingresa con tu código institucional y evalúa únicamente a los docentes de tu grado.</p>
            <Button asChild size="lg" className="mt-6 w-full bg-white text-[#102a4b] hover:bg-white/90">
              <Link href="/estudiante">Acceder ahora <ArrowRight className="size-4" /></Link>
            </Button>
          </article>
          <article className="group rounded-[1.4rem] border border-white/10 bg-[#0c223d]/80 p-6 sm:p-7">
            <LockKeyhole className="size-6 text-white/70" strokeWidth={1.7} />
            <p className="mt-5 text-xs font-semibold uppercase tracking-[.18em] text-white/45">Personal autorizado</p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <div><h2 className="text-xl font-semibold tracking-tight">Acceso administrador</h2><p className="mt-1 text-sm text-white/55">Gestión, análisis e informes.</p></div>
              <Button asChild variant="outline" className="shrink-0 border-white/20 bg-transparent text-white hover:bg-white/10">
                <Link href="/login" aria-label="Acceder a administración"><ArrowRight className="size-4" /></Link>
              </Button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </main>;
}
