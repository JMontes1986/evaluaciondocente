"use client";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FormSubmitButton({ children, pendingLabel = "Procesando…" }: { children: React.ReactNode; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending} className="w-full">
    {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
    {pending ? pendingLabel : children}
  </Button>;
}
