import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
