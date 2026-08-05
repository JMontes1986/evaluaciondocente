import { LoaderCircle } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-[1500px]" role="status" aria-live="polite">
      <div className="flex items-center gap-3 border-b pb-6">
        <span className="grid size-10 place-items-center rounded-full bg-secondary text-primary">
          <LoaderCircle className="size-5 animate-spin" aria-hidden />
        </span>
        <div>
          <p className="font-semibold">Preparando la información</p>
          <p className="mt-1 text-sm text-muted-foreground">Estamos cargando los indicadores y resultados del Dashboard.</p>
        </div>
      </div>
      <div className="mt-6 grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 rounded-xl border bg-card" />
        ))}
      </div>
      <div className="mt-6 grid animate-pulse gap-6 xl:grid-cols-2">
        <div className="h-80 rounded-xl border bg-card" />
        <div className="h-80 rounded-xl border bg-card" />
      </div>
    </div>
  );
}
