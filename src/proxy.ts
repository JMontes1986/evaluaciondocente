import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_MODULE_KEYS, moduleForPathname, type AdminModuleKey } from "@/lib/auth/modules";
import { buildContentSecurityPolicy, CONTENT_SECURITY_POLICY_HEADER } from "@/lib/security/csp";

function secureResponse(response: NextResponse, contentSecurityPolicy: string) {
  response.headers.set(CONTENT_SECURITY_POLICY_HEADER, contentSecurityPolicy);
  return response;
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(CONTENT_SECURITY_POLICY_HEADER, contentSecurityPolicy);
  const nextResponse = () => {
    requestHeaders.set("cookie", request.cookies.toString());
    return secureResponse(NextResponse.next({ request: { headers: requestHeaders } }), contentSecurityPolicy);
  };
  const redirectResponse = (url: URL) => secureResponse(NextResponse.redirect(url), contentSecurityPolicy);
  let response = nextResponse();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = nextResponse();
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const requiredModule = moduleForPathname(pathname);
  const protectedRequest = pathname.startsWith("/administracion") || requiredModule !== null;

  if (protectedRequest && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return redirectResponse(loginUrl);
  }
  if (!protectedRequest || !user || requiredModule === null) return response;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,active")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.active) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("error", "unauthorized");
    return redirectResponse(loginUrl);
  }

  const isSuperAdmin = profile.role === "SUPER_ADMIN";
  const hasFullAccess = isSuperAdmin || profile.role === "ADMIN";
  if (requiredModule === "super_admin") {
    if (isSuperAdmin) return response;
  } else if (hasFullAccess) {
    return response;
  } else {
    const { data: permissions } = await supabase
      .from("profile_module_permissions")
      .select("module_key")
      .eq("profile_id", user.id);
    const modules = (permissions ?? [])
      .map((permission) => permission.module_key)
      .filter((module): module is AdminModuleKey => ADMIN_MODULE_KEYS.includes(module as AdminModuleKey));
    if (modules.includes(requiredModule)) return response;
  }

  const forbiddenUrl = request.nextUrl.clone();
  forbiddenUrl.pathname = "/administracion/sin-acceso";
  forbiddenUrl.search = "";
  forbiddenUrl.searchParams.set("modulo", requiredModule);
  return redirectResponse(forbiddenUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
