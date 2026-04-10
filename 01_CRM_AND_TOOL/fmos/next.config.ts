import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["192.168.1.4:3000", "localhost:3000"],
    },
  },
};

export default nextConfig;
