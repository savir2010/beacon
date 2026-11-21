import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client"],
  experimental: { serverActions: { bodySizeLimit: "15mb" } },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // The Ionic app is built into public/app. Its own routes (/app/login, /app/client/...) fall back to its index.
  async rewrites() {
    return { beforeFiles: [], afterFiles: [], fallback: [{ source: "/app/:path*", destination: "/app/index.html" }, { source: "/app", destination: "/app/index.html" }] };
  },
  async redirects() {
    return [
      { source: "/signin", destination: "/app", permanent: false },
      { source: "/workspace/:path*", destination: "/app", permanent: false },
      { source: "/staff/:path*", destination: "/app", permanent: false },
    ];
  },
};

export default nextConfig;
