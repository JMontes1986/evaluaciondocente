import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-xl border bg-card text-card-foreground shadow-[0_18px_45px_-32px_oklch(0.22_0.06_250/.4)]", className)} {...props} />;
}
export function CardHeader({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("space-y-1.5 p-6", className)} {...props} />; }
export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) { return <h3 className={cn("text-lg font-semibold tracking-tight", className)} {...props} />; }
export function CardDescription({ className, ...props }: React.ComponentProps<"p">) { return <p className={cn("text-sm leading-relaxed text-muted-foreground", className)} {...props} />; }
export function CardContent({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("px-6 pb-6", className)} {...props} />; }
