"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { ADMIN_MODULE_KEYS, firstModulePath, type AdminModuleKey } from "@/lib/auth/modules";
import { studentSessionSecret } from "@/lib/env";
import {
  PASSWORD_RECOVERY_COOKIE,
  verifyPasswordRecoveryMarker
} from "@/lib/security/password-recovery";
import { adminLoginAccountRateLimiter, adminLoginNetworkRateLimiter, passwordResetRateLimiter } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/services/audit-service";
import { changePasswordSchema, loginSchema, recoveredPasswordSchema } from "@/lib/validation/schemas";
import type { AppRole } from "@/types/database.types";

export interface FormState { error?: string; success?: string }

const fullAccessRoles: AppRole[] = ["SUPER_ADMIN", "ADMIN"];
const restrictedRoles: AppRole[] = ["RECTOR", "DIRECTIVO", "COORDINADOR", "DOCENTE"];

export async function loginAction(_state: FormState, formData: FormData): Promise<FormState> {
  const requestHeaders = await headers();
  const address = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const networkLimit = await adminLoginNetworkRateLimiter.check(`admin-login-ip:${address}`);
  if (!networkLimit.allowed) {
    await writeAuditLog({ action: "ADMIN_LOGIN_FAILURE", entity: "auth", category: "security", status: "warning", metadata: { reason: "rate_limited_network" } });
    return { error: "Demasiados intentos de acceso. Espera unos minutos antes de continuar." };
  }

  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) {
    await writeAuditLog({ action: "ADMIN_LOGIN_FAILURE", entity: "auth", category: "authentication", status: "failure", metadata: { reason: "invalid_input" } });
    return { error: parsed.error.issues[0]?.message ?? "Revisa el correo y la contraseña." };
  }
  const emailFingerprint = createHash("sha256").update(parsed.data.email).digest("hex");
  const accountLimit = await adminLoginAccountRateLimiter.check(`admin-login-account:${emailFingerprint}`);
  if (!accountLimit.allowed) {
    await writeAuditLog({ action: "ADMIN_LOGIN_FAILURE", entity: "auth", category: "security", status: "warning", metadata: { reason: "rate_limited_account" } });
    return { error: "Demasiados intentos de acceso. Espera unos minutos antes de continuar." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    await writeAuditLog({ action: "ADMIN_LOGIN_FAILURE", entity: "auth", category: "authentication", status: "failure", metadata: { reason: "invalid_credentials" } });
    return { error: "No fue posible iniciar sesión con esas credenciales." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active,role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile?.active || (!fullAccessRoles.includes(profile.role) && !restrictedRoles.includes(profile.role))) {
    await writeAuditLog({ actorId: data.user.id, action: "ADMIN_LOGIN_FAILURE", entity: "auth", category: "authentication", status: "failure", metadata: { reason: "unauthorized_profile" } });
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
    await writeAuditLog({ actorId: data.user.id, action: "ADMIN_LOGIN_FAILURE", entity: "auth", category: "authentication", status: "failure", metadata: { reason: "no_authorized_modules", role: profile.role } });
    await supabase.auth.signOut();
    return { error: "La cuenta no tiene módulos autorizados." };
  }

  await writeAuditLog({ actorId: data.user.id, action: "ADMIN_LOGIN_SUCCESS", entity: "auth", category: "authentication", metadata: { role: profile.role, modules } });

  redirect(firstModulePath(modules));
}

export async function logoutAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await writeAuditLog({ actorId: user.id, action: "ADMIN_LOGOUT", entity: "auth", category: "authentication" });
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetAction(_state: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const parsed = loginSchema.shape.email.safeParse(email);
  if (!parsed.success) return { error: "Ingresa un correo válido." };
  const requestHeaders = await headers();
  const address = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const fingerprint = createHash("sha256").update(`${address}:${parsed.data}`).digest("hex");
  const rateLimit = await passwordResetRateLimiter.check(`password-reset:${fingerprint}`);
  if (!rateLimit.allowed) return { success: "Si el correo está registrado, recibirá instrucciones para continuar." };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${appUrl}/auth/callback?flow=recovery` });
  await writeAuditLog({ action: "ADMIN_PASSWORD_RESET_REQUEST", entity: "auth", category: "security", metadata: { requested: true } });
  return { success: "Si el correo está registrado, recibirá instrucciones para continuar." };
}

export async function changePasswordAction(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword")
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa las contraseñas ingresadas." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "La sesión ya no es válida. Vuelve a iniciar sesión." };

  const { error: verificationError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword
  });
  if (verificationError) {
    await writeAuditLog({ actorId: user.id, action: "ADMIN_PASSWORD_CHANGE_FAILURE", entity: "auth", category: "security", status: "failure", metadata: { reason: "invalid_current_password" } });
    return { error: "La contraseña actual no es correcta." };
  }

  const { error } = await supabase.auth.updateUser({
    current_password: parsed.data.currentPassword,
    password: parsed.data.newPassword
  });
  if (error) {
    await writeAuditLog({ actorId: user.id, action: "ADMIN_PASSWORD_CHANGE_FAILURE", entity: "auth", category: "security", status: "failure", metadata: { reason: "provider_rejected_change" } });
    return { error: "No fue posible actualizar la contraseña. Inténtalo nuevamente." };
  }

  await writeAuditLog({ actorId: user.id, action: "ADMIN_PASSWORD_CHANGE", entity: "auth", category: "security" });
  return { success: "Contraseña actualizada correctamente." };
}

export async function updateRecoveredPasswordAction(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = recoveredPasswordSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword")
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa la nueva contraseña." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "El enlace de recuperación ya no es válido. Solicita uno nuevo." };
  const cookieStore = await cookies();
  const recoveryMarker = cookieStore.get(PASSWORD_RECOVERY_COOKIE)?.value;
  if (!verifyPasswordRecoveryMarker(recoveryMarker, user.id, studentSessionSecret())) {
    await writeAuditLog({ actorId: user.id, action: "ADMIN_PASSWORD_RECOVERY_CHANGE_FAILURE", entity: "auth", category: "security", status: "failure", metadata: { reason: "invalid_recovery_marker" } });
    return { error: "El enlace de recuperación ya no es válido. Solicita uno nuevo." };
  }
  cookieStore.delete(PASSWORD_RECOVERY_COOKIE);
  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) return { error: "No fue posible actualizar la contraseña. Solicita un enlace nuevo." };
  await writeAuditLog({ actorId: user.id, action: "ADMIN_PASSWORD_RECOVERY_CHANGE", entity: "auth", category: "security" });
  await supabase.auth.signOut();
  return { success: "Contraseña actualizada. Ya puedes iniciar sesión con tu nueva clave." };
}
