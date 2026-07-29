import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/database.types";

export interface AdminIdentity {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
}

export async function requireAdmin(): Promise<AdminIdentity> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("full_name,role,active").eq("id", user.id).single();
  if (!profile?.active || !["SUPER_ADMIN", "ADMIN"].includes(profile.role)) redirect("/login?error=unauthorized");
  return { id: user.id, email: user.email ?? "", fullName: profile.full_name, role: profile.role };
}

export async function requireSuperAdmin() {
  const identity = await requireAdmin();
  if (identity.role !== "SUPER_ADMIN") redirect("/administracion?error=forbidden");
  return identity;
}
