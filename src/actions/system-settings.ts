"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

const systemSettingsSchema = z.object({
  minResponses: z.coerce.number().int().min(3).max(50),
  studentSessionMinutes: z.coerce.number().int().min(15).max(1440)
});

export async function updateSystemSettingsAction(formData: FormData) {
  const adminUser = await requireAdmin();
  const parsed = systemSettingsSchema.safeParse({
    minResponses: formData.get("minResponses"),
    studentSessionMinutes: formData.get("studentSessionMinutes")
  });
  if (!parsed.success) redirect("/administracion/configuracion?error=validation");

  const admin = createAdminClient();
  const { error } = await admin.from("system_settings").upsert({
    id: 1,
    min_responses: parsed.data.minResponses,
    student_session_minutes: parsed.data.studentSessionMinutes,
    updated_by: adminUser.id
  });
  if (error) redirect("/administracion/configuracion?error=save");

  await admin.from("audit_logs").insert({
    user_id: adminUser.id,
    action: "ADMIN_UPDATE_SYSTEM_SETTINGS",
    entity: "system_settings",
    metadata: {
      min_responses: parsed.data.minResponses,
      student_session_minutes: parsed.data.studentSessionMinutes
    }
  });

  revalidatePath("/administracion", "layout");
  redirect("/administracion/configuracion?guardado=1");
}
