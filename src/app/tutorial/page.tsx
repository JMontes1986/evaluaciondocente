import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Check,
  Download,
  FileSpreadsheet,
  FileText,
  LockKeyhole,
  ShieldCheck
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Tutorial de resultados y exportaciones",
  description: "Guía visual para consultar resultados docentes y descargar informes institucionales."
};

const sections = [
  ["#ingreso", "1. Ingreso"],
  ["#consulta", "2. Consultar"],
  ["#lectura", "3. Interpretar"],
  ["#exportar", "4. Exportar"],
  ["#seguridad", "5. Seguridad"]
] as const;

export default function TutorialPage() {
  return (
    <main className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Brand />
          <Button asChild variant="ghost" size="sm">
            <Link href="/"><ArrowLeft className="size-4" /> Volver al inicio</Link>
          </Button>
        </div>
      </header>

      <section className="overflow-hidden bg-[#102a4b] text-white">
        <div className="institutional-grid">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1fr_.75fr] lg:items-end lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#e4bf68]">Guía visual · Gestión formativa</p>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight tracking-[-.04em] sm:text-5xl lg:text-6xl">
                Resultados docentes y exportación de informes
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/68 sm:text-lg">
                Aprende a entrar, elegir el semestre correcto, interpretar los indicadores y descargar archivos Word, Excel y PDF.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/[.07] p-6">
              <ShieldCheck className="size-7 text-[#e4bf68]" />
              <p className="mt-4 text-sm font-semibold">Antes de comenzar</p>
              <p className="mt-2 text-sm leading-6 text-white/65">Usa un computador, un navegador actualizado y tu cuenta institucional autorizada. Confirma siempre el semestre antes de descargar.</p>
            </div>
          </div>
        </div>
      </section>

      <nav className="border-b bg-card" aria-label="Contenido del tutorial">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-4 sm:px-6 lg:px-8">
          {sections.map(([href, label]) => (
            <a key={href} href={href} className="whitespace-nowrap rounded-full border bg-background px-4 py-2 text-sm font-medium hover:bg-secondary">{label}</a>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <TutorialStep id="ingreso" number="01" eyebrow="Acceso administrativo" title="Ingresa con tu cuenta institucional" description="Desde la página principal abre Acceso administrador. Escribe el correo institucional y la contraseña; después pulsa Iniciar sesión.">
          <LoginCapture />
          <Tip icon={<LockKeyhole className="size-5" />} title="Tu contraseña es privada">Nunca la incluyas en documentos, correos o mensajes. Si la olvidaste, usa “¿Olvidaste tu contraseña?”.</Tip>
        </TutorialStep>

        <TutorialStep id="consulta" number="02" eyebrow="Resultados docentes" title="Selecciona docente y semestre" description="En el menú azul elige Resultados docentes. Selecciona a la persona, revisa la evaluación semestral y pulsa Consultar resultados.">
          <ResultsCapture />
          <ol className="grid gap-3 sm:grid-cols-3">
            {["Elige el docente correcto", "Confirma el semestre", "Pulsa Consultar resultados"].map((item, index) => (
              <li key={item} className="flex gap-3 rounded-xl border bg-card p-4 text-sm"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span>{item}</li>
            ))}
          </ol>
        </TutorialStep>

        <TutorialStep id="lectura" number="03" eyebrow="Lectura del informe" title="Interpreta primero el panorama general" description="Comprueba el nombre y el semestre. Luego revisa el promedio general, las preguntas más bajas y altas, la distribución y, al final, los comentarios anónimos.">
          <ReportCapture />
          <Tip icon={<ShieldCheck className="size-5" />} title="Privacidad protegida">Si no se alcanza el mínimo institucional de respuestas, el sistema no muestra resultados parciales ni comentarios.</Tip>
        </TutorialStep>

        <TutorialStep id="exportar" number="04" eyebrow="Descargas" title="Escoge el archivo según lo que necesitas" description="El Word individual se descarga desde Resultados docentes. Los consolidados se encuentran en Informes, si tu cuenta tiene habilitado ese módulo.">
          <ExportsCapture />
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
              <Format title="Word individual" use="Retroalimentación o archivo de un docente" />
              <Format title="Word consolidado" use="Resumen para rectoría o archivo institucional" />
              <Format title="Excel detallado" use="Filtros, análisis y cruces de datos" />
              <Format title="PDF ejecutivo" use="Lectura rápida, impresión o envío" />
            </div>
          </div>
        </TutorialStep>

        <TutorialStep id="seguridad" number="05" eyebrow="Cierre seguro" title="Protege la información al terminar" description="Los informes contienen información institucional reservada. Guárdalos solo en ubicaciones autorizadas y cierra la sesión, especialmente en equipos compartidos.">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              "Verifica docente y semestre antes de compartir.",
              "Conserva el archivo original sin modificaciones.",
              "No intentes identificar estudiantes por sus comentarios.",
              "Cierra sesión y retira descargas temporales del equipo."
            ].map((item) => <div key={item} className="flex gap-3 rounded-xl border bg-card p-5 text-sm leading-6"><Check className="mt-0.5 size-5 shrink-0 text-emerald-700" />{item}</div>)}
          </div>
        </TutorialStep>

        <section className="rounded-3xl bg-[#102a4b] p-7 text-white sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#e4bf68]">Versión descargable</p><h2 className="mt-3 text-2xl font-semibold">¿Necesitas consultar la guía sin conexión?</h2><p className="mt-2 text-sm text-white/65">Descarga el documento completo en formato Word.</p></div>
          <Button asChild size="lg" className="mt-6 bg-white text-[#102a4b] hover:bg-white/90 lg:mt-0">
            <a href="/tutoriales/tutorial-resultados-exportaciones.docx" download><Download className="size-4" /> Descargar tutorial</a>
          </Button>
        </section>
      </div>
    </main>
  );
}

function TutorialStep({ id, number, eyebrow, title, description, children }: { id: string; number: string; eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-28 border-t py-14 first:border-t-0 first:pt-0 lg:py-20"><div className="mb-8 grid gap-5 lg:grid-cols-[110px_1fr]"><span className="font-mono text-5xl font-semibold text-primary/20">{number}</span><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">{eyebrow}</p><h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2><p className="mt-4 max-w-3xl leading-7 text-muted-foreground">{description}</p></div></div><div className="space-y-6 lg:pl-[110px]">{children}</div></section>;
}

function CaptureFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return <figure className="overflow-hidden rounded-2xl border bg-[#e9eef3] shadow-[0_24px_70px_-42px_rgba(16,42,75,.55)]"><div className="flex items-center gap-2 border-b bg-white px-4 py-3"><span className="size-2.5 rounded-full bg-red-400" /><span className="size-2.5 rounded-full bg-amber-400" /><span className="size-2.5 rounded-full bg-emerald-400" /><span className="ml-3 rounded-md bg-secondary px-3 py-1 font-mono text-[10px] text-muted-foreground">evaluacion.colgemelli.edu.co</span></div>{children}<figcaption className="border-t bg-white px-4 py-3 text-xs text-muted-foreground">Vista de la aplicación: {label}</figcaption></figure>;
}

function LoginCapture() {
  return <CaptureFrame label="acceso administrativo"><div className="grid min-h-80 md:grid-cols-[.85fr_1.15fr]"><div className="hidden bg-[#102a4b] p-8 text-white md:block"><div className="grid size-9 place-items-center rounded-lg border border-white/20 bg-white/10 text-xs font-black">CG</div><ShieldCheck className="mt-16 size-8 text-[#e4bf68]" /><p className="mt-5 max-w-xs text-2xl font-semibold">Información educativa protegida.</p></div><div className="grid place-items-center p-7"><div className="w-full max-w-sm rounded-xl border bg-white p-6"><h3 className="text-xl font-semibold">Acceso administrativo</h3><p className="mt-1 text-xs text-muted-foreground">Ingresa con tu cuenta institucional.</p><div className="mt-5 space-y-4"><MockField label="Correo electrónico" value="gformativa@colgemelli.edu.co" /><MockField label="Contraseña" value="••••••••••••" /><div className="rounded-lg bg-[#102a4b] py-2.5 text-center text-sm font-semibold text-white">Iniciar sesión</div></div></div></div></div></CaptureFrame>;
}

function ResultsCapture() {
  return <CaptureFrame label="consulta de resultados por docente"><div className="grid min-h-80 grid-cols-[72px_1fr] sm:grid-cols-[210px_1fr]"><aside className="bg-[#102a4b] p-3 text-white"><div className="mb-8 px-2 text-xs font-bold">CG <span className="hidden sm:inline">Colgemelli</span></div>{["Dashboard", "Docentes", "Resultados docentes", "Informes"].map((item) => <div key={item} className={`mb-1 rounded-md px-3 py-2 text-[10px] sm:text-xs ${item === "Resultados docentes" ? "bg-white/15" : "text-white/55"}`}>{item === "Resultados docentes" ? <BarChart3 className="mr-2 inline size-3" /> : null}<span className="hidden sm:inline">{item}</span></div>)}</aside><div className="p-5 sm:p-8"><p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Análisis individual</p><h3 className="mt-1 text-xl font-semibold">Resultados por docente</h3><div className="mt-5 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><MockField label="Docente" value="María Pérez" /><MockField label="Evaluación semestral" value="Primer semestre 2026" /><div className="rounded-lg bg-[#102a4b] px-4 py-2.5 text-center text-xs font-semibold text-white">Consultar resultados</div></div></div></div></CaptureFrame>;
}

function ReportCapture() {
  return <CaptureFrame label="informe individual"><div className="p-5 sm:p-8"><div className="rounded-xl bg-[#102a4b] p-6 text-white"><div className="flex items-end justify-between gap-5"><div><p className="text-[10px] uppercase tracking-wider text-white/55">Primer semestre 2026</p><h3 className="mt-2 text-xl font-semibold">María Pérez</h3></div><div className="text-right"><p className="font-mono text-4xl font-semibold">87,5 %</p><p className="text-xs text-white/55">Promedio general</p></div></div><div className="mt-5 grid grid-cols-3 border-t border-white/10 pt-4 text-center"><Metric value="42" label="Evaluaciones" /><Metric value="23" label="Preguntas" /><Metric value="18" label="Comentarios" /></div></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><div className="rounded-xl border bg-white p-5"><p className="text-xs font-semibold text-amber-700">PRIORIDAD</p><p className="mt-3 text-sm">Pregunta con menor resultado</p><p className="mt-2 font-mono text-2xl font-semibold">68,2 %</p></div><div className="rounded-xl border bg-white p-5"><p className="text-xs font-semibold text-emerald-700">FORTALEZA</p><p className="mt-3 text-sm">Pregunta con mejor resultado</p><p className="mt-2 font-mono text-2xl font-semibold">96,4 %</p></div></div></div></CaptureFrame>;
}

function ExportsCapture() {
  return <CaptureFrame label="centro de informes y descargas"><div className="p-5 sm:p-8"><p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Análisis institucional</p><h3 className="mt-1 text-xl font-semibold">Centro de informes</h3><div className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border bg-white p-5"><div className="min-w-52 flex-1"><MockField label="Evaluación semestral" value="Primer semestre 2026" /></div><MockButton icon={<FileSpreadsheet className="size-3" />} label="Excel detallado" /><MockButton icon={<FileText className="size-3" />} label="PDF ejecutivo" /><MockButton icon={<Download className="size-3" />} label="Word" /></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{[["Evaluaciones", "428"], ["Docentes evaluados", "31"], ["Promedio institucional", "3,52 / 4"]].map(([label, value]) => <div key={label} className="rounded-xl border bg-white p-4"><p className="font-mono text-xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>)}</div></div></CaptureFrame>;
}

function MockField({ label, value }: { label: string; value: string }) { return <div><p className="mb-1.5 text-[10px] font-semibold">{label}</p><div className="rounded-md border bg-white px-3 py-2 text-[11px] text-muted-foreground">{value}</div></div>; }
function MockButton({ icon, label }: { icon: React.ReactNode; label: string }) { return <div className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-semibold">{icon}{label}</div>; }
function Metric({ value, label }: { value: string; label: string }) { return <div><p className="font-mono text-lg font-semibold">{value}</p><p className="text-[10px] text-white/55">{label}</p></div>; }
function Format({ title, use }: { title: string; use: string }) { return <div className="bg-card p-5"><p className="font-semibold">{title}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{use}</p></div>; }
function Tip({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) { return <aside className="flex gap-4 rounded-xl border border-amber-700/20 bg-amber-50 p-5 text-amber-950"><span className="mt-0.5 shrink-0">{icon}</span><div><p className="font-semibold">{title}</p><p className="mt-1 text-sm leading-6 text-amber-950/70">{children}</p></div></aside>; }
