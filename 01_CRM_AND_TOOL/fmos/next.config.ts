import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build output dir override — lets sandboxed/CI builds avoid a locked .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "192.168.1.4:3000",
        "localhost:3000",
        "fmos.fortunemarq.com",
        "*.vercel.app",
      ],
    },
  },
};

export default nextConfig;
