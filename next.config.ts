import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Headless browser automation in this environment reaches the dev
  // server via 127.0.0.1, which Next 16 treats as a cross-site origin.
  allowedDevOrigins: ["127.0.0.1"],
  // Baseline SaaS headers. CSP is intentionally absent: print views and
  // seeded inline handlers predate it; add a nonce-based CSP before
  // embedding any third-party scripts.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
