import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Acceso administrativo" };

export default function LoginPage() {
  return <main className="grid min-h-[100dvh] bg-background lg:grid-cols-[.85fr_1.15fr]">
    <section className="hidden bg-[#102a4b] p-10 text-white lg:flex lg:flex-col lg:justify-between">
      <Brand inverse />
      <div className="max-w-lg">
        <ShieldCheck className="mb-7 size-9 text-[#e4bf68]" strokeWidth={1.5} />
        <h1 className="text-4xl font-semibold leading-tight tracking-[-.035em]">Información educativa protegida con controles institucionales.</h1>
        <p className="mt-5 max-w-[55ch] text-base leading-relaxed text-white/65">El acceso está reservado al personal autorizado. Las respuestas de los estudiantes se presentan de forma agregada y confidencial.</p>
      </div>
      <p className="text-xs uppercase tracking-[.18em] text-white/40">Colegio Franciscano Agustín Gemelli</p>
    </section>
    <section className="flex items-center justify-center px-4 py-10 sm:px-8">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Volver al inicio</Link>
        <Card>
          <CardHeader className="pb-5">
            <div className="mb-4 lg:hidden"><Brand /></div>
            <CardTitle className="text-2xl">Acceso administrativo</CardTitle>
            <CardDescription>Ingresa con tu cuenta institucional de Supabase Auth.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <Link href="/recuperar-contrasena" className="mt-5 block text-center text-sm font-medium text-primary hover:underline">¿Olvidaste tu contraseña?</Link>
          </CardContent>
        </Card>
      </div>
    </section>
  </main>;
}
