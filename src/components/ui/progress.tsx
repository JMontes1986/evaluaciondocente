import { cn } from "@/lib/utils";

export function Progress({ value, className, label }: { value: number; className?: string; label?: string }) {
  const safeValue = Math.min(100, Math.max(0, value));
  return <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-secondary", className)} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeValue}>
    <div className="h-full rounded-full bg-primary transition-transform duration-500" style={{ transform: `translateX(-${100 - safeValue}%)` }} />
  </div>;
}
