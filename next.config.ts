import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-DNS-Prefetch-Control", value: "off" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }
      ]
    }, {
      source: "/reporte/docente/:path*",
      headers: [
        { key: "Cache-Control", value: "private, no-store, max-age=0" },
        { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }
      ]
    }, {
      source: "/administracion/:path*",
      headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }]
    }, {
      source: "/evaluacion/:path*",
      headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }]
    }, {
      source: "/api/exports/:path*",
      headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }]
    }];
  }
};

export default nextConfig;
