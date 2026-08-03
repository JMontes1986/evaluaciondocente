"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ADMIN_MODULE_KEYS, isAdminModuleKey, type AdminModuleKey } from "@/lib/auth/modules";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/types/database.types";

export interface UserAccessState {
  status: "idle" | "success" | "error";
  message: string;
}

export interface RestrictedUser {
  id: string;
  fullName: string;
  email: string;
  role: "RECTOR" | "DIRECTIVO" | "COORDINADOR";
  active: boolean;
  modules: AdminModuleKey[];
}

const restrictedRoleSchema = z.enum(["RECTOR", "DIRECTIVO", "COORDINADOR"]);
const passwordSchema = z.string()
  .min(12)
  .max(128)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/[0-9]/);

function selectedModules(formData: FormData) {
  return [...new Set(formData.getAll("modules").map(String).filter(isAdminModuleKey))];
}

export async function getRestrictedUsers(): Promise<RestrictedUser[]> {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const [{ data: profiles }, { data: permissions }, { data: authData }] = await Promise.all([
    admin
      .from("profiles")
      .select("id,full_name,role,active")
      .in("role", ["RECTOR", "DIRECTIVO", "COORDINADOR"])
      .order("full_name"),
    admin.from("profile_module_permissions").select("profile_id,module_key"),
    admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  ]);
  const emails = new Map((authData?.users ?? []).map((user) => [user.id, user.email ?? ""]));
  const modulesByUser = new Map<string, AdminModuleKey[]>();
  for (const permission of permissions ?? []) {
    if (!isAdminModuleKey(permission.module_key)) continue;
    const modules = modulesByUser.get(permission.profile_id) ?? [];
    modules.push(permission.module_key);
    modulesByUser.set(permission.profile_id, modules);
  }

  return (profiles ?? []).map((profile) => ({
    id: profile.id,
    fullName: profile.full_name,
    email: emails.get(profile.id) ?? "",
    role: profile.role as RestrictedUser["role"],
    active: profile.active,
    modules: modulesByUser.get(profile.id) ?? []
  }));
}

export async function createRestrictedUserAction(
  _state: UserAccessState,
  formData: FormData
): Promise<UserAccessState> {
  const superAdmin = await requireSuperAdmin();
  const modules = selectedModules(formData);
  const parsed = z.object({
    fullName: z.string().trim().min(3).max(180),
    email: z.email(),
    password: passwordSchema,
    role: restrictedRoleSchema
  }).safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role")
  });
  if (!parsed.success || modules.length === 0) {
    return { status: "error", message: "Revisa los datos y selecciona al menos un módulo." };
  }

  const admin = createAdminClient();
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: parsed.data.email.toLocaleLowerCase(),
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName }
  });
  if (authError || !authData.user) {
    return {
      status: "error",
      message: authError?.message.toLocaleLowerCase().includes("already")
        ? "Ya existe una cuenta con ese correo."
        : "Supabase Auth no pudo crear la cuenta."
    };
  }

  const userId = authData.user.id;
  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    full_name: parsed.data.fullName,
    role: parsed.data.role,
    active: true
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return { status: "error", message: "No fue posible crear el perfil de acceso." };
  }

  const { error: permissionError } = await admin.from("profile_module_permissions").insert(
    modules.map((moduleKey) => ({
      profile_id: userId,
      module_key: moduleKey,
      granted_by: superAdmin.id
    }))
  );
  if (permissionError) {
    await admin.auth.admin.deleteUser(userId);
    return { status: "error", message: "No fue posible asignar los módulos seleccionados." };
  }

  await admin.from("audit_logs").insert({
    user_id: superAdmin.id,
    action: "SUPER_ADMIN_CREATE_RESTRICTED_USER",
    entity: "profiles",
    entity_id: userId,
    metadata: { role: parsed.data.role, modules }
  });
  revalidatePath("/administracion/configuracion");
  revalidatePath("/administracion/usuarios");
  return { status: "success", message: `Cuenta creada para ${parsed.data.fullName}.` };
}

export async function updateRestrictedUserAction(
  _state: UserAccessState,
  formData: FormData
): Promise<UserAccessState> {
  const superAdmin = await requireSuperAdmin();
  const modules = selectedModules(formData);
  const parsed = z.object({
    profileId: z.uuid(),
    fullName: z.string().trim().min(3).max(180),
    role: restrictedRoleSchema,
    active: z.boolean()
  }).safeParse({
    profileId: formData.get("profileId"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
    active: formData.get("active") === "on"
  });
  if (!parsed.success || modules.length === 0) {
    return { status: "error", message: "Selecciona al menos un módulo y revisa los datos." };
  }

  const admin = createAdminClient();
  const { data: currentProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", parsed.data.profileId)
    .maybeSingle();
  if (!currentProfile || !restrictedRoleSchema.safeParse(currentProfile.role).success) {
    return { status: "error", message: "Esta cuenta no puede modificarse desde este formulario." };
  }

  const { data: previousPermissions } = await admin
    .from("profile_module_permissions")
    .select("module_key,granted_by")
    .eq("profile_id", parsed.data.profileId);
  await admin.from("profile_module_permissions").delete().eq("profile_id", parsed.data.profileId);
  const { error: permissionError } = await admin.from("profile_module_permissions").insert(
    modules.map((moduleKey) => ({
      profile_id: parsed.data.profileId,
      module_key: moduleKey,
      granted_by: superAdmin.id
    }))
  );
  if (permissionError) {
    if (previousPermissions?.length) {
      await admin.from("profile_module_permissions").insert(
        previousPermissions.map((permission) => ({
          profile_id: parsed.data.profileId,
          module_key: permission.module_key,
          granted_by: permission.granted_by
        }))
      );
    }
    return { status: "error", message: "No fue posible actualizar los módulos." };
  }

  const { error: profileError } = await admin.from("profiles").update({
    full_name: parsed.data.fullName,
    role: parsed.data.role as AppRole,
    active: parsed.data.active
  }).eq("id", parsed.data.profileId);
  if (profileError) return { status: "error", message: "Los módulos cambiaron, pero el perfil no pudo actualizarse." };

  await admin.from("audit_logs").insert({
    user_id: superAdmin.id,
    action: "SUPER_ADMIN_UPDATE_RESTRICTED_USER",
    entity: "profiles",
    entity_id: parsed.data.profileId,
    metadata: { role: parsed.data.role, active: parsed.data.active, modules }
  });
  revalidatePath("/administracion/configuracion");
  return { status: "success", message: "Acceso actualizado correctamente." };
}

export { ADMIN_MODULE_KEYS };
