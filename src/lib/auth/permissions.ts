import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { ADMIN_MODULE_KEYS, type AdminModuleKey } from "@/lib/auth/modules";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/database.types";

const fullAccessRoles: AppRole[] = ["SUPER_ADMIN", "ADMIN"];
const restrictedRoles: AppRole[] = ["RECTOR", "DIRECTIVO", "COORDINADOR", "DOCENTE"];

export interface AdminIdentity {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  modules: AdminModuleKey[];
}

export const requireAdmin = cache(async (): Promise<AdminIdentity> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,role,active")
    .eq("id", user.id)
    .single();
  if (!profile?.active) redirect("/login?error=unauthorized");

  let modules: AdminModuleKey[] = [];
  if (fullAccessRoles.includes(profile.role)) {
    modules = [...ADMIN_MODULE_KEYS];
  } else if (restrictedRoles.includes(profile.role)) {
    const { data: permissions } = await supabase
      .from("profile_module_permissions")
      .select("module_key")
      .eq("profile_id", user.id);
    modules = (permissions ?? [])
      .map((permission) => permission.module_key)
      .filter((module): module is AdminModuleKey => ADMIN_MODULE_KEYS.includes(module as AdminModuleKey));
  }

  if (!modules.length) redirect("/login?error=unauthorized");
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile.full_name,
    role: profile.role,
    modules
  };
});

export async function requireModule(module: AdminModuleKey) {
  const identity = await requireAdmin();
  if (!identity.modules.includes(module)) redirect(`/administracion/sin-acceso?modulo=${module}`);
  return identity;
}

export async function requireSuperAdmin() {
  const identity = await requireAdmin();
  if (identity.role !== "SUPER_ADMIN") redirect("/administracion/sin-acceso?modulo=super_admin");
  return identity;
}
