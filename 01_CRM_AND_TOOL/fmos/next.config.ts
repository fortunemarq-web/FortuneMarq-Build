import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build output dir override — lets sandboxed/CI builds avoid a locked .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Hosts allowed to load dev-server assets (/_next/*) from a non-localhost
  // origin — needed for phone testing over Wi-Fi or Tailscale. Without this,
  // Next 16 can block the page's CSS/JS and it renders blank on a device.
  // The Tailscale IP is stable per device; the 192.168.* range covers home LAN.
  allowedDevOrigins: [
    "100.114.160.47", // this Mac mini on Tailscale (stable)
    "192.168.1.3",
    "192.168.1.*",
    "192.168.0.*",
  ],
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      // NOTE: `npm run dev` binds 0.0.0.0 (see package.json) so a phone on the
      // same Wi-Fi can reach the dev server for mobile testing. That exposes the
      // dev server to the LAN — only run it on a trusted network. We intentionally
      // do NOT whitelist a hardcoded LAN IP here (it changes per network / is a
      // stale-config footgun); localhost covers normal local dev.
      allowedOrigins: [
        "localhost:3000",
        "fmos.fortunemarq.com",
        "*.vercel.app",
      ],
    },
  },
};

export default nextConfig;
