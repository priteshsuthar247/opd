import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Headless browser automation in this environment reaches the dev
  // server via 127.0.0.1, which Next 16 treats as a cross-site origin.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
