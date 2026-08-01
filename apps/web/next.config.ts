import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: true,
  typedRoutes: true,
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
