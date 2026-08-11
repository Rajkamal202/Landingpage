import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root; an unrelated lockfile higher up the filesystem
  // otherwise wins the inference and Turbopack resolves from the wrong place.
  turbopack: { root: path.resolve(".") },
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  experimental: {
    // Keeps the icon barrel and Motion from pulling their whole surface
    // into every client bundle.
    optimizePackageImports: ["motion", "lucide-react", "@xyflow/react"],
  },
  typedRoutes: true,
};

export default nextConfig;
