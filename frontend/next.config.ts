import type { NextConfig } from "next";
import path from "path";

// API_URL is server-only — intentionally no NEXT_PUBLIC_ prefix so it's
// never embedded in the client bundle.
const apiUrl = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root to this directory so Turbopack doesn't walk up
    // and pick up middleware or configs from unrelated projects.
    root: path.resolve(__dirname),
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
