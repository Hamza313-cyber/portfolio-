import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Local testing only: send /api/* to the FastAPI server running on your computer.
  // On Vercel this is not set, and vercel.json routes /api/* to the Python service.
  async rewrites() {
    const localApi = process.env.LOCAL_API_URL ?? (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : "");
    if (!localApi) return [];
    return [{ source: "/api/:path*", destination: `${localApi}/api/:path*` }];
  },
};

export default nextConfig;
