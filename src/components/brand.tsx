import Link from "next/link";

export function Brand({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  return <Link href="/" className="inline-flex items-center gap-3" aria-label="Colgemelli, inicio">
    <span className={`grid size-10 place-items-center rounded-xl border text-sm font-black tracking-tight ${inverse ? "border-white/20 bg-white/10 text-white" : "border-primary/20 bg-primary text-primary-foreground"}`}>CG</span>
    <span className={`${inverse ? "text-white" : "text-foreground"} ${compact ? "lg:hidden" : ""}`}>
      <span className="block text-sm font-bold tracking-tight">Colgemelli</span>
    </span>
  </Link>;
}
