export const CONTENT_SECURITY_POLICY_HEADER = "Content-Security-Policy";

interface ContentSecurityPolicyOptions {
  development?: boolean;
  production?: boolean;
}

export function buildContentSecurityPolicy(
  nonce: string,
  {
    development = process.env.NODE_ENV === "development",
    production = process.env.NODE_ENV === "production"
  }: ContentSecurityPolicyOptions = {}
) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    `script-src-elem 'self' 'nonce-${nonce}'`,
    "script-src-attr 'none'",
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co",
    "font-src 'self' data:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(production ? ["upgrade-insecure-requests"] : [])
  ].join("; ");
}
