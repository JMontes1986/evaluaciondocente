"use server";

import { redirect } from "next/navigation";
import { ADMIN_MODULE_KEYS, firstModulePath, type AdminModuleKey } from "@/lib/auth/modules";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/schemas";
import type { AppRole } from "@/types/database.types";

export interface FormState { error?: string; success?: string }

const fullAccessRoles: AppRole[] = ["SUPER_ADMIN", "ADMIN"];
const restrictedRoles: AppRole[] = ["RECTOR", "DIRECTIVO", "COORDINADOR", "DOCENTE"];

export async function loginAction(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Revisa el correo y la contraseña." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { error: "No fue posible iniciar sesión con esas credenciales." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("active,role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile?.active || (!fullAccessRoles.includes(profile.role) && !restrictedRoles.includes(profile.role))) {
    await supabase.auth.signOut();
    return { error: "La cuenta no tiene acceso administrativo activo." };
  }

  let modules: AdminModuleKey[] = [...ADMIN_MODULE_KEYS];
  if (!fullAccessRoles.includes(profile.role)) {
    const { data: permissions } = await supabase
      .from("profile_module_permissions")
      .select("module_key")
      .eq("profile_id", data.user.id);
    modules = (permissions ?? [])
      .map((permission) => permission.module_key)
      .filter((module): module is AdminModuleKey => ADMIN_MODULE_KEYS.includes(module as AdminModuleKey));
  }
  if (!modules.length) {
    await supabase.auth.signOut();
    return { error: "La cuenta no tiene módulos autorizados." };
  }

  redirect(firstModulePath(modules));
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetAction(_state: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const parsed = loginSchema.shape.email.safeParse(email);
  if (!parsed.success) return { error: "Ingresa un correo válido." };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${appUrl}/actualizar-contrasena` });
  return { success: "Si el correo está registrado, recibirá instrucciones para continuar." };
}
