import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root to this directory so Turbopack doesn't walk up
    // and pick up middleware or configs from unrelated projects.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
