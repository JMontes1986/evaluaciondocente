import { NextResponse } from "next/server";
import { studentSessionSecret } from "@/lib/env";
import {
  createPasswordRecoveryMarker,
  isRecentPasswordRecovery,
  PASSWORD_RECOVERY_COOKIE,
  passwordRecoveryCookieOptions
} from "@/lib/security/password-recovery";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const recoveryFlow = url.searchParams.get("flow") === "recovery";
  if (!code || !recoveryFlow) return NextResponse.redirect(new URL("/login?error=enlace-invalido", url.origin));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  const user = data.session?.user;
  if (error || !user || !isRecentPasswordRecovery(user.recovery_sent_at)) {
    if (data.session) await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=enlace-expirado", url.origin));
  }

  const response = NextResponse.redirect(new URL("/actualizar-contrasena", url.origin));
  response.cookies.set(
    PASSWORD_RECOVERY_COOKIE,
    createPasswordRecoveryMarker(user.id, studentSessionSecret()),
    passwordRecoveryCookieOptions()
  );
  return response;
}
