export default function TeacherResultsLoading() {
  return (
    <div className="mx-auto max-w-[1500px] animate-pulse" aria-label="Cargando resultados del docente">
      <div className="h-28 rounded-xl bg-secondary" />
      <div className="mt-6 h-24 rounded-xl bg-secondary" />
      <div className="mt-8 h-72 rounded-xl bg-secondary" />
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="h-96 rounded-xl bg-secondary" />
        <div className="h-96 rounded-xl bg-secondary" />
      </div>
    </div>
  );
}
