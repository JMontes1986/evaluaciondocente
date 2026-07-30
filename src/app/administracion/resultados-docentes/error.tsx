"use client";

import { Button } from "@/components/ui/button";

export default function TeacherResultsError({ reset }: { reset: () => void }) {
  return (
    <section role="alert" className="mx-auto max-w-3xl rounded-xl border border-destructive/25 bg-destructive/5 p-8 text-center">
      <h1 className="text-xl font-semibold">No fue posible cargar los resultados</h1>
      <p className="mt-2 text-sm text-muted-foreground">Intenta nuevamente. Si el problema continúa, revisa la conexión con Supabase.</p>
      <Button type="button" className="mt-5" onClick={reset}>Reintentar</Button>
    </section>
  );
}
