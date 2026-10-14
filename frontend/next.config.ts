import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Docker image (frontend/Dockerfile sets NEXT_OUTPUT=standalone): self-contained `node server.js`
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // Lets CI / local checks build without clobbering a running `next dev` (.next)
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Type errors and lint errors must fail the production build
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
