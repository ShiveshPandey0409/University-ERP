import type { NextConfig } from "next";

// API_INTERNAL_URL wins if set; otherwise API_INTERNAL_HOSTPORT ("host:port",
// injected by Render from the erp-api service) is used; local dev falls back to :4000.
const hostport = process.env.API_INTERNAL_HOSTPORT;
const API_INTERNAL_URL =
  process.env.API_INTERNAL_URL ??
  (hostport ? `http://${hostport}` : "http://localhost:4000");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@erp/shared"],
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    // Proxy /api/* to the NestJS API so the refresh cookie stays first-party.
    return [{ source: "/api/:path*", destination: `${API_INTERNAL_URL}/api/:path*` }];
  },
};

export default nextConfig;
