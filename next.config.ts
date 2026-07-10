import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Whitelist Z.ai platform domains untuk dev server (preview panel, hot-reload)
  allowedDevOrigins: [
    "*.space-z.ai",
    "*.chatglm.cn",
    "*.z.ai",
    "localhost",
    "127.0.0.1",
    "*.vercel.app",
  ],
  // Allow iframe embedding dari Z.ai preview panel & vercel
  async headers() {
    return [
      {
        source: "/((?!admin).*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://*.space-z.ai https://*.chatglm.cn https://*.z.ai https://*.vercel.app http://localhost:*;",
          },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://*.space-z.ai https://*.chatglm.cn https://*.z.ai https://*.vercel.app http://localhost:*;",
          },
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
