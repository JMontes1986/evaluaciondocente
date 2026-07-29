import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-[background,color,transform,box-shadow] duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  { variants: {
    variant: {
      default: "bg-primary text-primary-foreground shadow-[0_10px_25px_-14px_oklch(0.25_0.09_250/.7)] hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/75",
      outline: "border bg-background hover:bg-secondary",
      ghost: "hover:bg-secondary hover:text-secondary-foreground",
      destructive: "bg-destructive text-white hover:bg-destructive/90"
    },
    size: { default: "h-11", sm: "min-h-9 px-3", lg: "min-h-12 px-6 text-base", icon: "size-11 p-0" }
  }, defaultVariants: { variant: "default", size: "default" } }
);

export function Button({ className, variant, size, asChild = false, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
export { buttonVariants };
