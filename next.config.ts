import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Resource Center tools (public/tools) are framed by Beacon's own pages and app, and by no one else.
const toolHeaders = [
  ...securityHeaders.filter((h) => h.key !== "X-Frame-Options"),
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client"],
  experimental: { serverActions: { bodySizeLimit: "15mb" } },
  async headers() {
    return [
      { source: "/:path((?!tools/).*)", headers: securityHeaders },
      { source: "/tools/:path*", headers: toolHeaders },
    ];
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
