import "server-only";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/types/database.types";
import { publicEnv } from "@/lib/env";

export function createAdminClient() {
  const env = publicEnv();
  const serviceKey = z.string().min(1).parse(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
