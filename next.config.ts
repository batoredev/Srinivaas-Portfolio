import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // One 404 for both root layouts (cinematic and professional).
  experimental: {
    globalNotFound: true,
  },
};

export default nextConfig;
