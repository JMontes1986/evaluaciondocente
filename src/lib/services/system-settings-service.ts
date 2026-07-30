import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SystemSettings {
  minResponses: number;
  studentSessionMinutes: number;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const { data } = await createAdminClient()
    .from("system_settings")
    .select("min_responses,student_session_minutes")
    .eq("id", 1)
    .maybeSingle();

  const environmentMinimum = Number(process.env.MIN_RESPONSES_FOR_REPORT ?? 5);
  return {
    minResponses: data?.min_responses
      ?? (Number.isFinite(environmentMinimum) ? Math.max(3, Math.min(50, environmentMinimum)) : 5),
    studentSessionMinutes: data?.student_session_minutes ?? 120
  };
}
