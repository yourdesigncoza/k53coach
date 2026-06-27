import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack ignores unrelated lockfiles higher up.
  turbopack: { root: __dirname },
};

export default nextConfig;
